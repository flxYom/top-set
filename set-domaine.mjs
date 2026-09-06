// Remplace le domaine provisoire par le vrai, partout d'un coup.
//
//   node set-domaine.mjs monsite.fr
//
// Le domaine apparait dans les balises Open Graph, les liens canoniques,
// robots.txt et sitemap.xml — 7 fichiers. Les modifier a la main, c'est
// se garantir d'en oublier un.
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ICI = dirname(fileURLToPath(import.meta.url));
const ACTUEL = 'topset.fr';

const arg = process.argv[2];
if (!arg) {
  console.error('Usage : node set-domaine.mjs mondomaine.fr');
  process.exit(1);
}

// On accepte "https://mon.fr/", "www.mon.fr" ou "mon.fr" : on garde l'hote.
const nouveau = arg.trim()
  .replace(/^https?:\/\//i, '')
  .replace(/\/.*$/, '')
  .toLowerCase();

if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(nouveau)) {
  console.error(`« ${nouveau} » n'est pas un nom de domaine valide.`);
  process.exit(1);
}
if (nouveau === ACTUEL) {
  console.error(`C'est deja le domaine en place. Rien a faire.`);
  process.exit(1);
}

const FICHIERS = readdirSync(ICI).filter(f => /\.(html|txt|xml)$/i.test(f));
let touches = 0, total = 0;

for (const f of FICHIERS) {
  const chemin = join(ICI, f);
  const avant = readFileSync(chemin, 'utf8');
  const n = avant.split(ACTUEL).length - 1;
  if (!n) continue;
  writeFileSync(chemin, avant.split(ACTUEL).join(nouveau), 'utf8');
  console.log(`  ${f.padEnd(24)} ${n} remplacement${n > 1 ? 's' : ''}`);
  touches++; total += n;
}

if (!total) {
  console.log(`Aucune occurrence de « ${ACTUEL} » trouvee — deja fait ?`);
} else {
  console.log(`\n${total} occurrences dans ${touches} fichiers -> ${nouveau}`);
  console.log('\nPense a mettre a jour ACTUEL dans ce script si tu changes encore de domaine.');
}
