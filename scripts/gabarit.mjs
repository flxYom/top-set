// Le gabarit des pages de contenu : une page = une fonction pure qui rend
// du HTML a partir de ses metadonnees, de son corps deja transforme et du
// contexte du site. Aucune dependance, aucun acces disque ici.
//
// Tout ce que Google et le lecteur voient se decide ici, une fois : title,
// description, canonical, Open Graph, fil d'Ariane, signature, sources,
// JSON-LD. Une page ne peut pas l'oublier, parce qu'elle ne l'ecrit pas.

export const SITE = 'https://www.top-set.fr';
export const AUTEUR_AFFICHE = 'Yom Industry × Claude (Anthropic)';

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
              'septembre', 'octobre', 'novembre', 'décembre'];
export function dateFr(iso){
  const [a, m, j] = iso.split('-').map(Number);
  return (j === 1 ? '1er' : j) + ' ' + MOIS[m - 1] + ' ' + a;
}

export function esc(s){
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// Le texte des metadonnees peut contenir un peu de HTML (une emphase) : on
// l'enleve pour les balises meta, qui ne l'interpretent pas.
export const texteBrut = s => String(s).replace(/<[^>]+>/g, '');

// Du JSON dans une page : « </script> » dans une chaine fermerait la balise.
const ld = obj => '<script type="application/ld+json">' + JSON.stringify(obj).replace(/</g, '\\u003c') + '</script>';

function auteursCourts(liste){
  return liste.length > 3 ? liste.slice(0, 3).join(', ') + ' et al.' : liste.join(', ');
}

export function ligneSource(cle, s, appui){
  const liens = [];
  if (s.doi) liens.push(`<a href="https://doi.org/${esc(s.doi)}">doi:${esc(s.doi)}</a>`);
  if (s.pmid) liens.push(`<a href="https://pubmed.ncbi.nlm.nih.gov/${esc(s.pmid)}/">PubMed</a>`);
  if (s.url) liens.push(`<a href="${esc(s.url)}">texte en ligne</a>`);
  return `<li id="src-${esc(cle)}">${esc(auteursCourts(s.auteurs))} (${s.annee}). ${esc(s.titre)}. `
    + `<i>${esc(s.revue)}</i>, ${esc(s.ref)}. ${liens.join(' · ')}`
    + `<span class="meta">${esc(s.type)} · lu : ${esc(s.lu)} · vérifié le ${dateFr(s.verifie)}</span>`
    + `<span class="appui">Ici : ${appui}</span></li>`;
}

function tete(p, ctx){
  const url = SITE + (p.url === '/' ? '/' : p.url);
  const titre = esc(texteBrut(p.title));
  const descr = esc(texteBrut(p.description));
  const L = [
    '<!doctype html>',
    '<html lang="fr">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
    '<meta name="theme-color" content="#0d0c0a">',
    `<meta name="robots" content="${p.indexable ? 'index,follow' : 'noindex,follow'}">`,
    `<meta name="description" content="${descr}">`,
    `<title>${titre}</title>`,
    `<meta property="og:type" content="${p.jsonldArticle ? 'article' : 'website'}">`,
    '<meta property="og:site_name" content="Top Set">',
    '<meta property="og:locale" content="fr_FR">',
    `<meta property="og:title" content="${titre}">`,
    `<meta property="og:description" content="${descr}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${SITE}/og-image.png">`,
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="Top Set — carnet de musculation">',
    '<meta name="twitter:card" content="summary_large_image">',
    p.url === '/404' ? '' : `<link rel="canonical" href="${url}">`,
    '<link rel="icon" type="image/svg+xml" href="/icon.svg">',
    '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">',
    '<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png">',
    '<link rel="stylesheet" href="/contenu.css">',
    ...p.jsonld.map(ld),
    '</head>'
  ];
  return L.filter(Boolean).join('\n');
}

function barre(){
  return `<a class="lien-evitement" href="#contenu">Aller au contenu</a>
<header class="barre">
  <a class="marque" href="/">TOP<span>SET</span></a>
  <nav class="barre-nav" aria-label="Rubriques">
    <a href="/documentation">Apprendre</a>
    <a class="facultatif" href="/outils">Outils</a>
  </nav>
  <a class="bouton" href="/">Ouvrir le carnet</a>
</header>`;
}

function ariane(chemin){
  return `<nav class="ariane" aria-label="Fil d'Ariane"><ol>`
    + chemin.map((e, i) => i === chemin.length - 1
      ? `<li aria-current="page">${esc(e.nom)}</li>`
      : `<li><a href="${e.url}">${esc(e.nom)}</a></li>`).join('')
    + `</ol></nav>`;
}

function pied(ctx){
  const liens = [
    ...ctx.hubs.map(h => [h.url, h.nav]),
    ['/carnet-de-musculation', 'Le carnet'],
    ['/methode-editoriale', 'Méthode éditoriale'],
    ['/guide', 'Comment ça marche'],
    ['/mentions-legales', 'Mentions légales'],
    ['/confidentialite', 'Confidentialité'],
    ['/cgu', 'CGU']
  ];
  return `<footer class="pied">
  <nav aria-label="Pied de page">${liens.map(([u, t]) => `<a href="${u}">${esc(t)}</a>`).join('')}</nav>
</footer>`;
}

function signature(p){
  const morceaux = [`Par ${esc(AUTEUR_AFFICHE)}`];
  morceaux.push(`publié le ${dateFr(p.published)}`);
  if (p.reviewed && p.reviewed !== p.published) morceaux.push(`mis à jour le ${dateFr(p.reviewed)}`);
  if (p.nbSources) morceaux.push(`sources vérifiées le ${dateFr(p.reviewed)}`);
  // La relecture humaine n'est affichee que quand elle a eu lieu.
  if (p.relu) morceaux.push(`relu par Yom Industry le ${dateFr(p.relu)}`);
  return `<p class="signature">${morceaux.join(' · ')} · <a href="/methode-editoriale">comment ces pages sont faites</a></p>`;
}

export function pageContenu(p, ctx){
  const haut = [];
  if (p.rubrique) haut.push(`<p class="rubrique">${esc(p.rubrique)}</p>`);
  haut.push(`<h1>${p.h1}</h1>`);
  if (p.lede) haut.push(`<p class="chapeau">${p.lede}</p>`);
  if (p.signe) haut.push(signature(p));
  if (p.keyPoints && p.keyPoints.length){
    haut.push(`<aside class="essentiel" aria-labelledby="essentiel-titre"><h2 id="essentiel-titre">L'essentiel</h2><ul>`
      + p.keyPoints.map(k => `<li>${k}</li>`).join('') + `</ul></aside>`);
  }
  // Un outil s'ouvre sur l'outil, pas sur un sommaire (« sommaire »: false).
  if (p.sommaire !== false && p.toc.length >= 3){
    haut.push(`<nav class="sommaire" aria-labelledby="sommaire-titre"><h2 id="sommaire-titre">Sommaire</h2><ol>`
      + p.toc.map(t => `<li><a href="#${t.id}">${t.texte}</a></li>`).join('') + `</ol></nav>`);
  }
  const bas = [];
  if (p.liees.length){
    bas.push(`<section class="liees" aria-labelledby="liees-titre"><h2 id="liees-titre">À lire ensuite</h2><ul>`
      + p.liees.map(l => `<li><a href="${l.url}">${esc(texteBrut(l.h1))}<span>${esc(texteBrut(l.description))}</span></a></li>`).join('')
      + `</ul></section>`);
  }
  if (p.cta){
    bas.push(`<section class="appel" aria-labelledby="appel-titre"><h2 id="appel-titre">${esc(p.cta.titre)}</h2><p>${p.cta.texte}</p>`
      + `<a class="bouton" href="/">${esc(p.cta.bouton || 'Ouvrir le carnet')}</a></section>`);
  }
  if (p.sourcesHtml){
    bas.push(`<section class="sources" aria-labelledby="sources-titre"><h2 id="sources-titre">Sources</h2><ol>${p.sourcesHtml}</ol>`
      + `<p>Chaque source indique ce qui en a été lu. Une erreur ? <a href="mailto:g.benint@gmail.com?subject=${encodeURIComponent('Erreur sur ' + p.url)}">Écris-nous</a>.</p></section>`);
  }
  const scripts = (p.scripts || []).map(s => `<script src="${s}" defer></script>`).join('\n');
  return [
    tete(p, ctx),
    '<body>',
    barre(),
    '<main class="page" id="contenu">',
    ariane(p.chemin),
    ...haut,
    p.corps.trim(),
    ...bas,
    '</main>',
    pied(ctx),
    scripts,
    '</body>',
    '</html>',
    ''
  ].filter(x => x !== '').join('\n');
}

// Un hub : la liste des pages d'une rubrique, et les autres rubriques.
export function corpsHub(hub, enfants, ctx){
  const L = [];
  if (hub.intro) L.push(`<p>${hub.intro}</p>`);
  L.push(enfants.length
    ? `<ul class="pages">` + enfants.map(e => `<li><a href="${e.url}"><strong>${esc(texteBrut(e.h1))}</strong><span>${esc(texteBrut(e.description))}</span></a></li>`).join('') + `</ul>`
    : `<p>Les premières pages de cette rubrique arrivent.</p>`);
  // Les autres rubriques, avec leurs pages : depuis l'app, le lien
  // « Apprendre » mene ici, et chaque page doit rester a deux clics de l'accueil.
  L.push(`<h2 id="autres-rubriques">Les autres rubriques</h2>`);
  for (const h of ctx.hubs.filter(x => x.url !== hub.url)){
    const pages = ctx.enfantsDe(h);
    L.push(`<h3><a href="${h.url}">${esc(h.nav)}</a></h3>`);
    L.push(pages.length
      ? `<ul>` + pages.map(e => `<li><a href="${e.url}">${esc(texteBrut(e.h1))}</a></li>`).join('') + `</ul>`
      : `<p>${esc(h.resume)}</p>`);
  }
  L.push(`<h2 id="le-carnet">Le carnet</h2>`);
  L.push(`<p>Tout ce qui s'explique ici se note dans <a href="/carnet-de-musculation">Top Set, un carnet de musculation gratuit</a>, sans compte.</p>`);
  return L.join('\n');
}
