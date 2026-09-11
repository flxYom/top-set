// Le generateur refuse-t-il vraiment une page incomplete ?
//
// scripts/contenu.mjs --verifier dit « OK » sur les pages actuelles. Ce test
// verifie l'autre moitie : sur une copie du site, on retire a une page ce que
// son gabarit exige — une section, une rubrique de la fiche, des termes — et
// le generateur doit refuser, en disant quoi. Une regle qui ne sait pas
// echouer ne protege rien.
//
//   node test/contenu.test.mjs

import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITECFG = JSON.parse(readFileSync(join(RACINE, 'contenu/site.json'), 'utf8'));

let pass = 0, fail = 0;
function ok(label, cond, detail = ''){
  if (cond){ pass++; console.log('  OK   ' + label); }
  else { fail++; console.log('  FAIL ' + label + (detail ? '  -> ' + detail : '')); }
}

// Une copie de ce que lit le generateur : ses scripts, les sources des pages,
// la matrice des sujets, la feuille de style et les pages ecrites a la main
// (leurs titres comptent dans le controle des doublons).
function copie(){
  const d = mkdtempSync(join(tmpdir(), 'topset-contenu-'));
  for (const x of ['scripts', 'contenu', 'contenu.css']) cpSync(join(RACINE, x), join(d, x), { recursive: true });
  mkdirSync(join(d, 'docs/seo'), { recursive: true });
  cpSync(join(RACINE, 'docs/seo/sujets.json'), join(d, 'docs/seo/sujets.json'));
  for (const s of SITECFG.statiques){
    const f = s.url === '/' ? 'index.html' : s.url.slice(1) + '.html';
    cpSync(join(RACINE, f), join(d, f));
  }
  return d;
}
// Remplace une chaine exacte dans un fichier de la copie ; echoue si elle n'y
// est pas, pour qu'un test ne passe jamais parce que sa modification a rate.
function modifier(d, f, avant, apres){
  const p = join(d, f);
  const t = readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
  if (!t.includes(avant)) throw new Error(`${f} : « ${avant.slice(0, 60)} » introuvable`);
  writeFileSync(p, t.replace(avant, apres));
}
function generer(d){
  const r = spawnSync(process.execPath, [join(d, 'scripts/contenu.mjs')], { cwd: d, encoding: 'utf8' });
  return { code: r.status, sortie: (r.stdout || '') + (r.stderr || '') };
}
function cas(label, retouche, attendu){
  const d = copie();
  try {
    retouche(d);
    const r = generer(d);
    ok(label, r.code === 1 && r.sortie.includes(attendu), `code ${r.code}, attendu « ${attendu} » :\n${r.sortie.trim()}`);
  } finally { rmSync(d, { recursive: true, force: true }); }
}

const TOPSET = 'contenu/documentation/top-set-musculation.html';
const PLANCHE = 'contenu/exercices/planche-gainage.html';

console.log('\n== Temoin : la copie intacte se genere ==');
{
  const d = copie();
  try {
    const r = generer(d);
    ok('le generateur accepte les pages actuelles', r.code === 0, r.sortie.trim());
    const html = readFileSync(join(d, 'documentation/top-set-musculation.html'), 'utf8');
    ok('la definition affiche ses termes associes', html.includes('<h2 id="termes-associes">Termes associés</h2>') && html.includes('<dl class="termes">'));
    ok('et ils sont dans son sommaire', /class="sommaire"[\s\S]*?href="#termes-associes"/.test(html));
    const exo = readFileSync(join(d, 'exercices/planche-gainage.html'), 'utf8');
    ok('l exercice affiche sa fiche avant le sommaire',
       exo.indexOf('class="fiche reperes"') > -1 && exo.indexOf('class="fiche reperes"') < exo.indexOf('class="sommaire"'));
    ok('et la source citee dans la fiche est numerotee 1', /class="fiche reperes"[\s\S]*?href="#src-calatayud2017" aria-label="source 1"/.test(exo));
    ok('« a lire ensuite » dit la rubrique de chaque page', /class="liees"[\s\S]*?<small>Outils<\/small>/.test(html));
  } finally { rmSync(d, { recursive: true, force: true }); }
}

console.log('\n== Une definition sans ce que son gabarit exige est refusee ==');
cas('sans section « erreurs fréquentes »',
    d => modifier(d, TOPSET, '<h2 id="erreurs">', '<h2>'),
    'section obligatoire absente : <h2 id="erreurs">');
cas('sans section « comment s en servir »',
    d => modifier(d, TOPSET, '<h2 id="utiliser">', '<h2>'),
    'section obligatoire absente : <h2 id="utiliser">');
cas('avec moins de trois termes associes',
    d => {
      const p = join(d, TOPSET);
      const t = readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
      writeFileSync(p, t.replace(/"termes": \[[\s\S]*?\n  \],/, '"termes": [\n    { "terme": "RPE", "def": "Note de difficulté." }\n  ],'));
    },
    'au moins 3 termes associés (1)');
cas('avec un terme qui vise un sujet inconnu',
    d => modifier(d, TOPSET, '"sujet": "rpe"', '"sujet": "rpe-inexistant"'),
    'sujet inconnu « rpe-inexistant »');
// Un sujet marque publie sans page : le terme deviendrait un lien mort. Le
// sujet est choisi parmi ceux qui n'ont pas encore de page, pour que le test
// reste valable a mesure que les pages paraissent.
cas('avec un terme dont le sujet est publie mais sans page',
    d => {
      const p = join(d, 'docs/seo/sujets.json');
      const j = JSON.parse(readFileSync(p, 'utf8'));
      const sansPage = j.sujets.find(s => (s.status === 'SELECTED' || s.status === 'IDEA') && !existsSync(join(d, 'contenu', s.target_url + '.html')));
      sansPage.status = 'PUBLISHED';
      writeFileSync(p, JSON.stringify(j, null, 2));
      modifier(d, TOPSET, '"termes": [', `"termes": [\n    { "terme": "Témoin", "sujet": "${sansPage.id}", "def": "Un terme de test." },`);
    },
    'Témoin vise une page qui n\'existe pas');

console.log('\n== Un exercice sans fiche complete est refuse ==');
cas('sans respiration dans la fiche',
    d => modifier(d, PLANCHE, '"respiration": "Continue et régulière. Ne bloque pas ton souffle."', '"autre": "x"'),
    '« respiration » manquant');
cas('avec une rubrique de fiche inconnue',
    d => modifier(d, PLANCHE, '"niveau":', '"difficulte":'),
    'rubrique inconnue « difficulte »');
cas('sans section « variantes »',
    d => modifier(d, PLANCHE, '<h2 id="variantes">', '<h2>'),
    'section obligatoire absente : <h2 id="variantes">');
cas('sans aucune notion liee',
    d => modifier(d, PLANCHE, '"related": ["/entrainement/carnet-musculation-eps", "/carnet-de-musculation", "/documentation/top-set-musculation"]', '"related": ["/carnet-de-musculation"]'),
    'aucune notion liée');

console.log(`\n${pass} reussis, ${fail} echoues`);
process.exit(fail ? 1 : 0);
