// Calcule la note de chaque sujet et regenere matrice.md et inventaire.md
// a partir de sujets.json. Aucune dependance.
//
//   node docs/seo/matrice.mjs             regenere les deux fichiers
//   node docs/seo/matrice.mjs --verifier  echoue si sujets.json est incoherent
//                                         ou si les fichiers generes sont perimes
//
// La note n'est jamais saisie a la main : elle se deduit des huit criteres, et
// la ponderation est ecrite ici, une fois, pour qu'on puisse la discuter.
import { readFileSync, writeFileSync, existsSync } from 'fs';

const ICI = new URL('./', import.meta.url);
const DATA = JSON.parse(readFileSync(new URL('sujets.json', ICI), 'utf8'));

// La demande compte double : une page que personne ne cherche ne sert qu'au
// maillage. La pertinence, l'accessibilite, l'opportunite et le lien produit
// comptent une fois et demie : ce sont eux qui disent si TOP SET a une chance
// ET une raison d'etre la. Le reste compte une fois.
export const POIDS = { demand: 2, relevance: 1.5, competition: 1.5, opportunity: 1.5, product: 1.5,
                       authority: 1, sources: 1, linking: 1 };
const MAX = 5 * Object.values(POIDS).reduce((a, b) => a + b, 0);
export const note = s => Math.round(Object.entries(POIDS).reduce((a, [k, w]) => a + w * s[k], 0) / MAX * 100);

const STATUTS = ['IDEA', 'RESEARCHED', 'PLANNED', 'SELECTED', 'DRAFT', 'PUBLISHED', 'NEEDS_UPDATE', 'MERGE', 'RETIRED'];
const ACTIFS = ['SELECTED', 'PLANNED', 'DRAFT', 'PUBLISHED', 'NEEDS_UPDATE'];
const CHAMPS = ['id', 'topic', 'primary_query', 'secondary_queries', 'intent', 'cluster', 'content_type',
                'target_url', 'parent_page', 'risk', 'status', 'scores', 'demand_signal', 'competition', 'notes'];

const erreurs = [];
const vus = new Map(), requetes = new Map(), urls = new Map();
for (const s of DATA.sujets){
  for (const c of CHAMPS) if (!(c in s)) erreurs.push(`${s.id || '?'} : champ « ${c} » manquant`);
  if (vus.has(s.id)) erreurs.push(`${s.id} : identifiant en double`);
  vus.set(s.id, s);
  if (!STATUTS.includes(s.status)) erreurs.push(`${s.id} : statut inconnu « ${s.status} »`);
  for (const k of Object.keys(POIDS)){
    const v = s.scores && s.scores[k];
    if (!Number.isInteger(v) || v < 0 || v > 5) erreurs.push(`${s.id} : note « ${k} » invalide (${v})`);
  }
  if (s.risk === 'élevé' && ACTIFS.includes(s.status)) erreurs.push(`${s.id} : sujet à risque élevé, il ne peut pas être sélectionné`);
  // Cannibalisation : deux pages actives ne visent ni la meme URL ni la meme requete.
  if (ACTIFS.includes(s.status)){
    const q = s.primary_query.toLowerCase();
    if (requetes.has(q)) erreurs.push(`${s.id} et ${requetes.get(q)} visent la même requête « ${q} »`);
    requetes.set(q, s.id);
    if (urls.has(s.target_url)) erreurs.push(`${s.id} et ${urls.get(s.target_url)} visent la même URL ${s.target_url}`);
    urls.set(s.target_url, s.id);
  }
}
// Un sujet fusionne doit pointer vers une page qui existe comme sujet actif.
for (const s of DATA.sujets.filter(x => x.status === 'MERGE')){
  if (!DATA.sujets.some(x => x !== s && x.target_url === s.target_url && x.status !== 'MERGE'))
    erreurs.push(`${s.id} : fusionné vers ${s.target_url}, mais aucun sujet ne porte cette page`);
}

const classes = DATA.sujets.map(s => ({ ...s, score: note(s.scores) })).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
const cel = v => String(v == null ? '' : v).replace(/\|/g, '\\|');

function matrice(){
  const L = [];
  L.push('# Matrice des sujets SEO — générée');
  L.push('');
  L.push('> Ne pas modifier à la main : éditer `sujets.json` puis lancer `node docs/seo/matrice.mjs`.');
  L.push('');
  L.push(`${DATA.sujets.length} sujets étudiés — ${DATA.sujets.filter(s => ACTIFS.includes(s.status)).length} sélectionnés, `
    + `${DATA.sujets.filter(s => s.status === 'MERGE').length} fusionnés dans une autre page, `
    + `${DATA.sujets.filter(s => s.status === 'RETIRED').length} exclus.`);
  L.push('');
  L.push('Pondération : ' + Object.entries(POIDS).map(([k, w]) => `${k} ×${w}`).join(', ')
    + ` ; note = somme pondérée / ${MAX} × 100.`);
  L.push('');
  L.push('| # | Sujet | Requête principale | Cluster | Type | Rel | Dem | Conc | Opp | Aut | Src | Liens | Prod | **Note** | Statut | URL | Risque |');
  L.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  classes.forEach((s, i) => {
    const n = s.scores;
    L.push(`| ${i + 1} | ${cel(s.topic)} | ${cel(s.primary_query)} | ${s.cluster} | ${cel(s.content_type)} | ${n.relevance} | ${n.demand} | ${n.competition} | ${n.opportunity} | ${n.authority} | ${n.sources} | ${n.linking} | ${n.product} | **${s.score}** | ${s.status} | ${cel(s.target_url)} | ${s.risk} |`);
  });
  L.push('');
  L.push('## Signaux et notes, sujet par sujet');
  L.push('');
  for (const s of classes){
    L.push(`### ${s.topic} — ${s.score} (${s.status})`);
    L.push('');
    L.push(`- **Requête** : ${s.primary_query}${s.secondary_queries.length ? ' · variantes : ' + s.secondary_queries.join(', ') : ''}`);
    L.push(`- **Intention** : ${s.intent} · **page parente** : ${s.parent_page || '—'}`);
    L.push(`- **Demande** : ${s.demand_signal}`);
    L.push(`- **Concurrence** : ${s.competition}`);
    if (s.notes) L.push(`- **Notes** : ${s.notes}`);
    L.push('');
  }
  return L.join('\n');
}

function inventaire(){
  const L = [];
  L.push('# Inventaire des contenus — généré');
  L.push('');
  L.push('> Une ligne par URL prévue ou publiée. Évite d\'écrire deux fois la même page. Généré depuis `sujets.json`.');
  L.push('');
  L.push('Statuts : IDEA → RESEARCHED → PLANNED/SELECTED → DRAFT → PUBLISHED → NEEDS_UPDATE ; MERGE (absorbé par une autre page) ; RETIRED (abandonné).');
  L.push('');
  L.push('| URL | Cluster | Intention | Requête principale | Statut | Sujets absorbés | Dernière revue |');
  L.push('|---|---|---|---|---|---|---|');
  const parUrl = new Map();
  for (const s of classes){
    if (!s.target_url || s.status === 'RETIRED') continue;
    if (!parUrl.has(s.target_url)) parUrl.set(s.target_url, { porteur: null, fusions: [] });
    const e = parUrl.get(s.target_url);
    if (s.status === 'MERGE') e.fusions.push(s.id); else if (!e.porteur) e.porteur = s; else e.fusions.push(s.id);
  }
  const ordre = s => ACTIFS.includes(s.status) ? 0 : 1;
  [...parUrl.entries()].filter(([, e]) => e.porteur)
    .sort(([, a], [, b]) => ordre(a.porteur) - ordre(b.porteur) || b.porteur.score - a.porteur.score)
    .forEach(([u, e]) => {
      const s = e.porteur;
      L.push(`| ${u} | ${s.cluster} | ${s.intent} | ${cel(s.primary_query)} | ${s.status} | ${e.fusions.join(', ') || '—'} | ${s.last_review || '—'} |`);
    });
  L.push('');
  return L.join('\n');
}

const sorties = { 'matrice.md': matrice(), 'inventaire.md': inventaire() };
if (process.argv.includes('--verifier')){
  for (const [f, t] of Object.entries(sorties)){
    const chemin = new URL(f, ICI);
    const disque = existsSync(chemin) ? readFileSync(chemin, 'utf8').replace(/\r\n/g, '\n') : '';
    if (disque !== t) erreurs.push(`${f} est périmé : relancer node docs/seo/matrice.mjs`);
  }
  if (erreurs.length){ console.log(erreurs.map(e => '  FAIL ' + e).join('\n')); process.exit(1); }
  console.log(`  OK   ${DATA.sujets.length} sujets cohérents, fichiers générés à jour`);
} else {
  if (erreurs.length){ console.log(erreurs.map(e => '  ERREUR ' + e).join('\n')); process.exit(1); }
  for (const [f, t] of Object.entries(sorties)) writeFileSync(new URL(f, ICI), t, 'utf8');
  console.log(`${DATA.sujets.length} sujets, matrice.md et inventaire.md régénérés`);
}
