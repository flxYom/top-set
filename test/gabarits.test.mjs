// Garde-fou sur le rendu HTML de index.html.
//
// L'app construit son interface par concatenation de chaines. C'est un choix
// assume — pas de framework, pas d'etape de build — mais il a un prix : rien
// n'empeche structurellement d'oublier un esc(). Un identifiant venu d'un
// fichier importe a deja pose un vrai gestionnaire onmouseover sur une carte,
// et il s'executait.
//
// Ces tests lisent le source et refusent les formes qui ont deja fait un trou.
// Ils ne remplacent pas une revue, ils empechent la rechute.
//
//   node test/gabarits.test.mjs

import { readFileSync } from 'fs';

const SRC = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const SW  = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');

let pass = 0, fail = 0;
function ok(label, cond, detail = ''){
  if (cond){ pass++; console.log('  OK   ' + label); }
  else { fail++; console.log('  FAIL ' + label + (detail ? '  -> ' + detail : '')); }
}

console.log('\n== 1. Aucun identifiant interpole sans echappement ==');
// On cherche « + ex.id + » et « + s.id + » : ces objets viennent d'un fichier
// importe ou du cloud, donc leur id n'est pas digne de confiance.
const nus = [];
SRC.split('\n').forEach((l, i) => {
  const m = l.match(/\+\s*(?:ex|s|it|e)\.id\s*\+/g);
  if (m) nus.push('L' + (i + 1) + ' : ' + l.trim().slice(0, 90));
});
ok('aucun « + ex.id + » ou « + s.id + » nu', nus.length === 0, nus.join(' | '));

const echappes = (SRC.match(/esc\((?:ex|s)\.id\)/g) || []).length;
ok('les identifiants passent bien par esc()', echappes >= 20, echappes + ' occurrence(s)');

console.log('\n== 2. esc() couvre les cinq caracteres ==');
const bloc = SRC.slice(SRC.indexOf('function esc(s)'), SRC.indexOf('function esc(s)') + 500);
[['&', '&amp;'], ['<', '&lt;'], ['>', '&gt;'], ['"', '&quot;'], ["'", '&#39;']].forEach(([c, ent]) => {
  ok('esc() remplace ' + JSON.stringify(c) + ' par ' + ent, bloc.indexOf(ent) > -1);
});

console.log('\n== 3. Un identifiant reste un identifiant ==');
ok('ID_SUR existe', /var ID_SUR\s*=\s*\/\^\[A-Za-z0-9_-\]\{1,64\}\$\//.test(SRC));
ok('idSur() est applique aux exercices', (SRC.match(/idSur\(ex[^)]*genId\)/g) || []).length >= 2);
ok('idSur() est applique aux series',    /idSur\(s && s\.id, genSerieId\)/.test(SRC));
// Les identifiants que l'app fabrique doivent evidemment passer son propre filtre.
const ID_SUR = /^[A-Za-z0-9_-]{1,64}$/;
['x1a2b3c', 's1a2b3c', '550e8400-e29b-41d4-a716-446655440000',
 'xmtudmna2ope6x'].forEach(id => {
  ok('l identifiant historique « ' + id.slice(0, 12) + '… » est accepte', ID_SUR.test(id));
});
['x1" onmouseover="alert(1)', '<img src=x>', 'a b', ''].forEach(id => {
  ok('l identifiant hostile ' + JSON.stringify(id.slice(0, 20)) + ' est refuse', !ID_SUR.test(id));
});

console.log('\n== 4. Le groupe est une valeur close ==');
ok('groupeSur() existe', /function groupeSur\(g\)/.test(SRC));
ok('il est applique a la normalisation', (SRC.match(/groupeSur\(ex/g) || []).length >= 2);

console.log('\n== 5. Le CSV ne fabrique pas de formule ==');
ok('csvTexte() existe', /function csvTexte\(v\)/.test(SRC));
ok('il garde = + - @ tab CR', /\^\[=\+\\-@\\t\\r\]/.test(SRC));
ok('les colonnes de texte y passent', (SRC.match(/csvTexte\(/g) || []).length >= 5);
// Les colonnes numeriques ne doivent PAS y passer : « -50 » deviendrait du
// texte dans le tableur, et une charge negative est legitime.
ok('les colonnes numeriques en sont exemptees', !/csvTexte\(csvNombre/.test(SRC));

console.log('\n== 6. L import est borne ==');
ok('IMPORT_MAX existe', /var IMPORT_MAX = 8 \* 1024 \* 1024/.test(SRC));
ok('la taille est verifiee avant JSON.parse',
   SRC.indexOf('text.length > IMPORT_MAX') > -1 &&
   SRC.indexOf('text.length > IMPORT_MAX') < SRC.indexOf('data = JSON.parse(text)'));
ok('le fichier est refuse avant FileReader', /f\.size > IMPORT_MAX/.test(SRC));
ok('les exercices memorises importes sont nettoyes', /nettoyerCustom\(data\.customExercises\)/.test(SRC));
ok('les cles de prototype sont ecartees', /k === '__proto__'/.test(SRC));

console.log('\n== 7. Le service worker se renouvelle ==');
const v = (SW.match(/var VERSION = '(topset-v\d+)'/) || [])[1];
ok('VERSION est nommee', !!v, String(v));
ok('les deux caches portent la version', /VERSION \+ '-coquille'/.test(SW) && /VERSION \+ '-courant'/.test(SW));
ok('les anciens caches sont supprimes a l activation',
   /caches\.keys\(\)/.test(SW) && /caches\.delete\(n\)/.test(SW));
ok('Supabase n est jamais mis en cache', /url\.origin !== self\.location\.origin/.test(SW));
ok('la page passe par le reseau d abord', SW.indexOf('estNavigation(req)') > -1);

console.log('\n== 8. Pas de secret dans ce qui est servi ==');
[/service_role\s*[:=]\s*['"]/, /sb_secret_[A-Za-z0-9]/, /SUPABASE_SERVICE_ROLE_KEY\s*=/].forEach((re, i) => {
  ok('aucun secret de forme ' + i, !re.test(SRC));
});

console.log(`\n${pass} reussis, ${fail} echoues`);
process.exit(fail ? 1 : 0);
