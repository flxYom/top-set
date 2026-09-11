// Generateur des pages de contenu. Node pur, aucune dependance.
//
//   node scripts/contenu.mjs             regenere les pages, les hubs, la 404 et sitemap.xml
//   node scripts/contenu.mjs --verifier  echoue si une source, un lien, une metadonnee est
//                                        incoherente, ou si un fichier genere est perime
//
// La source est dans contenu/ (non publie) : un fichier HTML par page, dont
// le premier commentaire porte les metadonnees en JSON. Les pages produites
// sont commitees : Vercel sert des fichiers, il n'y a toujours pas d'etape
// de construction en ligne, et le diff d'une page se relit comme du texte.
//
// Deux conventions dans le corps d'une page :
//   [[/chemin|texte]]  lien interne, verifie : la page doit exister
//   [@cle]             appel de source, numerote, relie a contenu/sources.json
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'fs';
import { gzipSync } from 'zlib';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';
import { SITE, texteBrut, ligneSource, pageContenu, corpsHub } from './gabarit.mjs';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENU = join(RACINE, 'contenu');
const lire = f => readFileSync(join(RACINE, f), 'utf8');
const SITECFG = JSON.parse(lire('contenu/site.json'));
const BIBLIO = JSON.parse(lire('contenu/sources.json')).sources;
const SUJETS = JSON.parse(lire('docs/seo/sujets.json')).sujets;

// Budget de performance (docs/seo/content-strategy.md, section F).
const POIDS_MAX_PAGE = 30 * 1024;   // HTML compresse
const POIDS_MAX_CSS = 8 * 1024;     // contenu.css compresse

const TYPES = {
  definition: { article: true, signe: true, sources: true },
  guide:      { article: true, signe: true, sources: true },
  exercice:   { article: true, signe: true, sources: true },
  outil:      { article: false, signe: true, sources: true },
  produit:    { article: false, signe: false, sources: false, logiciel: true },
  methode:    { article: false, signe: false, sources: false }
};
const LUS = ['résumé', 'résumé et passages cités', 'passages cités', 'texte intégral'];
const ACTIFS_PUBLIES = ['PUBLISHED', 'NEEDS_UPDATE'];

const erreurs = [];
const err = (ou, msg) => erreurs.push(`${ou} : ${msg}`);

// ------------------------------------------------------------ lecture
function fichiersContenu(d = CONTENU){
  let out = [];
  for (const e of readdirSync(d)){
    const p = join(d, e);
    if (statSync(p).isDirectory()) out = out.concat(fichiersContenu(p));
    else if (e.endsWith('.html')) out.push(p);
  }
  return out;
}

function lirePage(chemin){
  const brut = readFileSync(chemin, 'utf8').replace(/\r\n/g, '\n');
  const rel = relative(CONTENU, chemin).split('\\').join('/');
  const m = brut.match(/^<!--\s*([\s\S]*?)\s*-->\n?/);
  if (!m){ err(rel, 'métadonnées absentes (premier commentaire JSON)'); return null; }
  let meta;
  try { meta = JSON.parse(m[1]); } catch (e){ err(rel, 'métadonnées : JSON invalide — ' + e.message); return null; }
  const url = '/' + rel.replace(/\.html$/, '');
  return { ...meta, url, source: rel, corpsBrut: brut.slice(m[0].length) };
}

const hubDe = url => SITECFG.hubs.find(h => url.startsWith(h.url + '/'));
const fichierDe = url => url === '/404' ? '404.html'
  : SITECFG.hubs.some(h => h.url === url) ? url.slice(1) + '/index.html'
  : url.slice(1) + '.html';

const pages = fichiersContenu().sort().map(lirePage).filter(Boolean);
const STATIQUES = SITECFG.statiques.map(s => s.url);
const connues = new Map();   // url -> { h1, description } pour les liens et « à lire ensuite »
for (const h of SITECFG.hubs) connues.set(h.url, h);
for (const p of pages) connues.set(p.url, p);
for (const u of STATIQUES) if (!connues.has(u)) connues.set(u, { url: u });

// ------------------------------------------------------------ verification des metadonnees
const vusTitres = new Map(), vusDescr = new Map();
function unique(ou, titre, descr){
  const t = texteBrut(titre).toLowerCase(), d = texteBrut(descr).toLowerCase();
  if (vusTitres.has(t)) err(ou, `même titre que ${vusTitres.get(t)}`); vusTitres.set(t, ou);
  if (vusDescr.has(d)) err(ou, `même description que ${vusDescr.get(d)}`); vusDescr.set(d, ou);
}
// Les pages ecrites a la main comptent aussi : un doublon avec le guide est un doublon.
for (const s of STATIQUES){
  const f = s === '/' ? 'index.html' : s.slice(1) + '.html';
  const h = lire(f);
  unique(s, (h.match(/<title>([^<]*)<\/title>/) || [])[1] || f,
            (h.match(/<meta name="description" content="([^"]*)">/) || [])[1] || f);
}
function bornes(ou, p){
  const t = texteBrut(p.title), d = texteBrut(p.description);
  if (t.length > 60) err(ou, `titre trop long (${t.length} > 60) : ${t}`);
  if (d.length < 110 || d.length > 160) err(ou, `description hors bornes (${d.length}, attendu 110–160)`);
  unique(ou, p.title, p.description);
}

// ------------------------------------------------------------ transformation du corps
const slug = s => texteBrut(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function transformer(p){
  let c = p.corpsBrut;
  for (const [re, quoi] of [[/<script\b/i, 'un script en ligne (la CSP le bloquerait)'], [/<h1\b/i, 'un second h1'],
                            [/\son[a-z]+=/i, 'un gestionnaire d\'événement en ligne'], [/\sstyle=/i, 'un style en ligne']]){
    if (re.test(c)) err(p.source, 'le corps contient ' + quoi);
  }
  c = c.replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, (_, cible, texte) => {
    const u = cible.split('#')[0];
    if (!connues.has(u)) err(p.source, `lien interne vers une page qui n'existe pas : ${cible}`);
    if (u === p.url) err(p.source, `lien vers elle-même : ${cible}`);
    return `<a href="${cible}">${texte}</a>`;
  });
  const numeros = new Map();
  c = c.replace(/\[@([a-z0-9]+)\]/g, (_, cle) => {
    if (!BIBLIO[cle]) err(p.source, `source inconnue [@${cle}] (absente de contenu/sources.json)`);
    if (!numeros.has(cle)) numeros.set(cle, numeros.size + 1);
    const n = numeros.get(cle);
    return `<sup class="appel-note"><a href="#src-${cle}" aria-label="source ${n}">${n}</a></sup>`;
  });
  // Le chapeau et « l'essentiel » ne sont pas transformes : un appel de source
  // ou un lien y resterait tel quel, crochets compris.
  for (const t of [p.lede || '', ...(p.keyPoints || [])]) if (/\[@|\[\[/.test(t)) err(p.source, 'appel de source ou lien [[…]] dans le chapeau ou l\'essentiel : à mettre dans le corps');
  const appuis = p.sources || {};
  for (const cle of numeros.keys()) if (!appuis[cle]) err(p.source, `[@${cle}] est cité sans dire ce qu'il soutient ici (champ « sources »)`);
  for (const cle of Object.keys(appuis)) if (!numeros.has(cle)) err(p.source, `« ${cle} » est listé dans « sources » sans être cité dans le texte`);
  const ids = new Set();
  c = c.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/g, (tout, attrs = '', texte) => {
    const m = attrs.match(/\sid="([^"]+)"/);
    const id = m ? m[1] : slug(texte);
    if (ids.has(id)) err(p.source, `deux titres ont l'identifiant « ${id} »`);
    ids.add(id);
    return m ? tout : `<h2 id="${id}"${attrs}>${texte}</h2>`;
  });
  const toc = [...c.matchAll(/<h2 id="([^"]+)"[^>]*>([\s\S]*?)<\/h2>/g)].map(m => ({ id: m[1], texte: m[2] }));
  for (const m of c.matchAll(/href="#([^"]+)"/g)) if (!ids.has(m[1]) && !m[1].startsWith('src-')) err(p.source, `ancre introuvable #${m[1]}`);
  const sourcesHtml = [...numeros.keys()].map(cle => BIBLIO[cle] ? ligneSource(cle, BIBLIO[cle], appuis[cle]) : '').join('');
  return { corps: c, toc, sourcesHtml, nbSources: numeros.size };
}

// ------------------------------------------------------------ la bibliographie elle-meme
for (const [cle, s] of Object.entries(BIBLIO)){
  for (const champ of ['auteurs', 'annee', 'titre', 'revue', 'ref', 'type', 'lu', 'verifie'])
    if (!s[champ]) err('sources.json', `${cle} : champ « ${champ} » manquant`);
  if (!s.doi && !s.url) err('sources.json', `${cle} : ni DOI ni adresse — une source doit pouvoir être retrouvée`);
  if (s.lu && !LUS.includes(s.lu)) err('sources.json', `${cle} : « lu » doit être l'un de : ${LUS.join(', ')}`);
}

// ------------------------------------------------------------ construction
const enfantsDe = h => pages.filter(p => hubDe(p.url) === h)
  .sort((a, b) => (a.ordre || 99) - (b.ordre || 99) || a.url.localeCompare(b.url));
const ctx = { hubs: SITECFG.hubs, enfantsDe };
const sorties = new Map();
const plan = [];
const CHAMPS = ['type', 'title', 'description', 'h1', 'published', 'reviewed'];

for (const p of pages){
  for (const c of CHAMPS) if (!p[c]) err(p.source, `champ « ${c} » manquant`);
  const T = TYPES[p.type];
  if (!T){ err(p.source, `type inconnu « ${p.type} »`); continue; }
  bornes(p.source, p);
  const hub = hubDe(p.url);
  if (p.url.split('/').length > 2 && !hub) err(p.source, `aucune rubrique pour ${p.url} (contenu/site.json)`);

  // Le lien avec la matrice : une page publiee est un sujet publie, sur la meme requete.
  if (p.type !== 'methode'){
    const sujet = SUJETS.find(s => s.target_url === p.url && s.status !== 'MERGE');
    if (!sujet) err(p.source, `aucun sujet de docs/seo/sujets.json ne porte ${p.url}`);
    else {
      if (sujet.primary_query !== p.primaryQuery) err(p.source, `requête « ${p.primaryQuery} » ≠ celle de la matrice « ${sujet.primary_query} »`);
      if (!ACTIFS_PUBLIES.includes(sujet.status)) err(p.source, `le sujet « ${sujet.id} » est en ${sujet.status} : passer à PUBLISHED`);
      if (sujet.last_review !== p.reviewed) err(p.source, `last_review du sujet (${sujet.last_review}) ≠ reviewed de la page (${p.reviewed})`);
    }
  }
  const t = transformer(p);
  if (T.sources && !t.nbSources) err(p.source, 'une page de ce type cite au moins une source');
  if (T.article && !(p.keyPoints || []).length) err(p.source, '« keyPoints » (l\'essentiel) manquant');

  const liees = (p.related || []).map(u => {
    const cible = connues.get(u);
    if (!cible || !cible.h1) { err(p.source, `« related » vise une page inconnue : ${u}`); return null; }
    return { url: u, h1: cible.h1, description: cible.description };
  }).filter(Boolean);

  const chemin = [{ nom: 'Accueil', url: '/' }];
  if (hub) chemin.push({ nom: hub.nav, url: hub.url });
  chemin.push({ nom: p.fil || texteBrut(p.h1), url: p.url });
  const url = SITE + p.url;
  const jsonld = [{
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: chemin.map((e, i) => ({ '@type': 'ListItem', position: i + 1, name: e.nom, item: SITE + (e.url === '/' ? '/' : e.url) }))
  }];
  if (T.article) jsonld.push({
    '@context': 'https://schema.org', '@type': 'Article',
    headline: texteBrut(p.h1), description: texteBrut(p.description),
    datePublished: p.published, dateModified: p.reviewed, inLanguage: 'fr',
    mainEntityOfPage: url, image: [SITE + '/og-image.png'], isAccessibleForFree: true,
    // L'auteur est l'editeur du site. L'aide de l'IA est dite en toutes lettres
    // sur la page et sur /methode-editoriale ; on ne fait pas d'une IA un auteur
    // au sens des donnees structurees.
    author: { '@type': 'Organization', name: 'Yom Industry', url: SITE + '/methode-editoriale' },
    publisher: { '@type': 'Organization', name: 'Top Set', url: SITE + '/', logo: { '@type': 'ImageObject', url: SITE + '/icon-512.png' } }
  });
  if (T.logiciel) jsonld.push({
    '@context': 'https://schema.org', '@type': 'SoftwareApplication',
    name: 'Top Set', url: SITE + '/', description: texteBrut(p.description),
    applicationCategory: 'SportsApplication', operatingSystem: 'Web', inLanguage: 'fr', isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    screenshot: (p.captures || []).map(c => SITE + c)
  });

  const page = { ...p, ...t, liees, chemin, jsonld, indexable: true, signe: T.signe, jsonldArticle: T.article,
                 rubrique: hub ? hub.nav : p.rubrique };
  sorties.set(fichierDe(p.url), pageContenu(page, ctx));
  plan.push({ url: p.url, lastmod: p.reviewed });
}

// Les hubs : indexables a partir de trois pages. En dessous, une liste
// d'un ou deux liens n'apprend rien a personne et serait une page mince.
const INDEXABLE_DES = 3;
for (const h of SITECFG.hubs){
  bornes('site.json ' + h.url, h);
  const enfants = enfantsDe(h);
  const indexable = enfants.length >= INDEXABLE_DES;
  const chemin = [{ nom: 'Accueil', url: '/' }, { nom: h.nav, url: h.url }];
  const page = {
    ...h, corps: corpsHub(h, enfants, ctx), toc: [], liees: [], chemin, indexable, rubrique: null,
    jsonld: [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: chemin.map((e, i) => ({ '@type': 'ListItem', position: i + 1, name: e.nom, item: SITE + (e.url === '/' ? '/' : e.url) })) }]
  };
  sorties.set(fichierDe(h.url), pageContenu(page, ctx));
  if (indexable) plan.push({ url: h.url, lastmod: enfants.map(e => e.reviewed).sort().pop() });
}

// La 404 : jamais indexee, jamais dans le plan du site.
{
  const e = SITECFG.erreur;
  const page = { ...e, url: '/404', corps: e.corps, toc: [], liees: [], chemin: [{ nom: 'Accueil', url: '/' }, { nom: 'Page introuvable', url: '/404' }],
                 indexable: false, jsonld: [] };
  sorties.set('404.html', pageContenu(page, ctx));
}

// ------------------------------------------------------------ plan du site
{
  const lignes = [...SITECFG.statiques.map(s => ({ url: s.url, lastmod: s.lastmod })), ...plan];
  const xml = ['<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...lignes.map(l => `  <url>\n    <loc>${SITE}${l.url === '/' ? '/' : l.url}</loc>\n    <lastmod>${l.lastmod}</lastmod>\n  </url>`),
    '</urlset>', ''].join('\n');
  sorties.set('sitemap.xml', xml);
}

// ------------------------------------------------------------ budget de poids
for (const [f, t] of sorties){
  if (!f.endsWith('.html')) continue;
  const gz = gzipSync(Buffer.from(t)).length;
  if (gz > POIDS_MAX_PAGE) err(f, `trop lourde : ${gz} octets compressés (budget ${POIDS_MAX_PAGE})`);
}
{
  const gz = gzipSync(readFileSync(join(RACINE, 'contenu.css'))).length;
  if (gz > POIDS_MAX_CSS) err('contenu.css', `trop lourde : ${gz} octets compressés (budget ${POIDS_MAX_CSS})`);
}

// ------------------------------------------------------------ ecriture ou verification
// Un fichier des rubriques que le generateur ne produit plus serait une page
// morte, servie et jamais mise a jour : on la signale.
for (const h of SITECFG.hubs){
  const d = join(RACINE, h.url.slice(1));
  if (!existsSync(d)) continue;
  for (const f of readdirSync(d)) if (f.endsWith('.html')){
    const rel = h.url.slice(1) + '/' + f;
    if (!sorties.has(rel)) err(rel, 'page publiée que le générateur ne produit plus (source supprimée ?)');
  }
}

const VERIF = process.argv.includes('--verifier');
if (VERIF){
  for (const [f, t] of sorties){
    const chemin = join(RACINE, f);
    const disque = existsSync(chemin) ? readFileSync(chemin, 'utf8').replace(/\r\n/g, '\n') : null;
    if (disque !== t) err(f, disque === null ? 'absent : lancer node scripts/contenu.mjs' : 'périmé : lancer node scripts/contenu.mjs');
  }
}
if (erreurs.length){
  console.log(erreurs.map(e => '  FAIL ' + e).join('\n'));
  if (!VERIF) console.log('\nRIEN ÉCRIT.');
  process.exit(1);
}
if (VERIF){
  console.log(`  OK   ${pages.length} pages, ${SITECFG.hubs.length} rubriques, sources et liens cohérents, fichiers générés à jour`);
} else {
  for (const [f, t] of sorties){
    mkdirSync(dirname(join(RACINE, f)), { recursive: true });
    writeFileSync(join(RACINE, f), t, 'utf8');
  }
  console.log(`${sorties.size} fichiers écrits (${pages.length} pages, ${SITECFG.hubs.length} rubriques, 404, sitemap.xml)`);
}
