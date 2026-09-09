// Verifie que tous les liens internes des pages HTML resolvent.
//
// Remplace lychee-action, qui echouait a chaque execution sans qu'on puisse
// reproduire l'echec en local ni lire utilement son journal. Une verification
// qu'on ne peut pas rejouer sur sa machine n'apprend rien : elle apprend juste
// a ignorer la pastille rouge.
//
// Deux pieges que ce test attrape et que Windows cache :
//   · la casse — « Guide.html » marche en local, pas sous Linux ;
//   · les ancres — href="#truc" sans element portant cet identifiant.
//
//   node test/liens.test.mjs

import { readdirSync, statSync, readFileSync } from 'fs';
import { join, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..');

let pass = 0, fail = 0;
function ok(label, cond, detail = ''){
  if (cond){ pass++; console.log('  OK   ' + label); }
  else { fail++; console.log('  FAIL ' + label + (detail ? '  -> ' + detail : '')); }
}

// Inventaire exact des fichiers, casse comprise.
const reels = new Set();
(function marcher(d){
  for (const e of readdirSync(d)){
    if (e === '.git' || e === 'node_modules' || e === '.github') continue;
    const p = join(d, e);
    if (statSync(p).isDirectory()) marcher(p);
    else reels.add(relative(RACINE, p).split('\\').join('/'));
  }
})(RACINE);

const pages = [...reels].filter(f => /^[^/]+\.html$/.test(f)).sort();

const ATTRS = ['href', 'src', 'srcset', 'poster', 'action', 'data'];
const EXTERNE = /^(https?:|mailto:|tel:|data:|blob:|\/\/)/;

console.log('\n== Liens internes ==');
ok(pages.length + ' page(s) trouvee(s)', pages.length > 0);

for (const f of pages){
  const t = readFileSync(join(RACINE, f), 'utf8');
  const casses = [];
  const ancres = [];
  const vus = new Set();

  for (const attr of ATTRS){
    const re = new RegExp(attr + '="([^"]{1,300})"', 'g');
    let m;
    while ((m = re.exec(t))){
      const v = m[1].trim();
      if (!v || EXTERNE.test(v)) continue;

      if (v.startsWith('#')){
        const frag = v.slice(1);
        if (!frag) ancres.push(attr + '="#" (ancre vide)');
        else if (!t.includes('id="' + frag + '"') && !t.includes('name="' + frag + '"')){
          ancres.push(attr + '="' + v + '"');
        }
        continue;
      }

      const cible = v.split('#')[0].split('?')[0];
      if (!cible || vus.has(cible)) continue;
      vus.add(cible);

      if (!reels.has(cible)){
        const alt = [...reels].find(r => r.toLowerCase() === cible.toLowerCase());
        casses.push(attr + '="' + v + '"' + (alt ? ' (casse : le fichier est « ' + alt + ' »)' : ' (absent)'));
      }
    }
  }

  ok(f + ' : cibles de fichier', casses.length === 0, casses.join(' | '));
  ok(f + ' : ancres', ancres.length === 0, ancres.join(' | '));
}

// Les pages legales doivent rester atteignables depuis l'app, et entre elles :
// c'est une obligation, pas une commodite.
console.log('\n== Les pages legales sont atteignables ==');
const LEGALES = ['mentions-legales.html', 'confidentialite.html', 'cgu.html', 'guide.html'];
for (const p of LEGALES){
  ok(p + ' existe', reels.has(p));
}
const accueil = readFileSync(join(RACINE, 'index.html'), 'utf8');
for (const p of LEGALES){
  ok('index.html renvoie vers ' + p, accueil.includes('href="' + p + '"'));
}

console.log(`\n${pass} reussis, ${fail} echoues`);
process.exit(fail ? 1 : 0);
