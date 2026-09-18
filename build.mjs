// Construit le site publie dans dist/ : une copie exacte des fichiers servis,
// avec le JavaScript de l'app minifie.
//
// Pourquoi : app.js fait 340 Ko de source commentee. Minifie, il pese environ
// 35 Ko de moins une fois compresse — autant de gagne au premier chargement,
// sur le reseau d'une salle de sport. La source reste lisible dans le depot :
// seul ce qui part en ligne est reduit.
//
// Ce qui est servi = ce que Vercel recoit (depot moins .vercelignore), moins la
// configuration. En local, on applique les memes exclusions, plus .gitignore
// (fichiers qui n'existent pas sur Vercel), pour que dist/ soit identique ici
// et la-bas. Vercel lance ce script (buildCommand) et sert dist/.
//
//   node build.mjs          construit dist/
//   npx serve dist          pour tester le site tel qu'il sera en ligne

import { execSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = fileURLToPath(new URL(".", import.meta.url));
const SORTIE = join(RACINE, 'dist');
const ESBUILD = 'esbuild@0.28.2';
// Seuls les scripts de l'app. Pas sw.js : sa VERSION doit rester lisible en ligne.
// Pas vendor/ : deja minifie par ses auteurs.
const A_MINIFIER = ['app.js', 'intelligence.js', 'mesure.js', 'supabase-config.js'];

function motifs(fichier) {
  const chemin = join(RACINE, fichier);
  if (!existsSync(chemin)) return [];
  return readFileSync(chemin, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

// Syntaxe .gitignore limitee a ce que ces fichiers utilisent : « dossier/ »,
// un nom, ou un nom avec des * ; sans « / » au milieu, le motif vaut a toute profondeur.
function versRegex(motif) {
  const dossier = motif.endsWith('/');
  const corps = motif.replace(/\/$/, '').replace(/^\//, '');
  const re = corps.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*');
  const ancre = corps.includes('/') ? '^' : '(^|/)';
  return new RegExp(ancre + re + (dossier ? '(/|$)' : '$'));
}

const EXCLUS = [...motifs('.vercelignore'), ...motifs('.gitignore')].map(versRegex);
// Toujours hors du site : la config et l'outillage de ce script.
const TOUJOURS = new Set(['dist', 'build.mjs', 'vercel.json', 'node_modules']);

function servi(rel) {
  const chemin = rel.split(sep).join('/');
  if (chemin.split('/')[0].startsWith('.')) return false;
  if (TOUJOURS.has(chemin.split('/')[0])) return false;
  return !EXCLUS.some((re) => re.test(chemin));
}

rmSync(SORTIE, { recursive: true, force: true });
let nbFichiers = 0;
(function copier(dossier) {
  for (const nom of readdirSync(dossier)) {
    const source = join(dossier, nom);
    const rel = relative(RACINE, source);
    if (!servi(rel)) continue;
    if (statSync(source).isDirectory()) copier(source);
    else { cpSync(source, join(SORTIE, rel)); nbFichiers++; }
  }
})(RACINE);

const gz = (f) => gzipSync(readFileSync(f)).length;
const ko = (n) => (n / 1024).toFixed(1) + ' Ko';
for (const fichier of A_MINIFIER) {
  const cible = join(SORTIE, fichier);
  if (!existsSync(cible)) throw new Error(`${fichier} absent de dist/ : la liste A_MINIFIER est-elle a jour ?`);
  const avant = gz(cible);
  // Sans --format ni --bundle, esbuild traite le fichier comme un script
  // classique : les noms globaux (partages entre intelligence.js et app.js)
  // ne sont pas renommes. Pas de --target : aucune syntaxe n'est reecrite.
  execSync(`npx --yes ${ESBUILD} "${cible}" --minify --legal-comments=none --allow-overwrite "--outfile=${cible}" --log-level=warning`, { stdio: 'inherit' });
  console.log(`${fichier.padEnd(20)} ${ko(avant)} -> ${ko(gz(cible))} (gzip)`);
}
console.log(`dist/ : ${nbFichiers} fichiers`);
