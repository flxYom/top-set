// Verifie la palette des groupes musculaires lue dans app.js :
//  - aucun groupe ne se confond avec une couleur de sens (marque, record,
//    reussite, info, erreur) en vision normale ;
//  - les groupes restent distincts entre eux en vision normale et avec les
//    trois daltonismes courants (simulation Machado 2009) ;
//  - chaque couleur tient un contraste d'au moins 4,5:1 sur la surface des
//    cartes (elle sert aussi de couleur de texte, ex. titres du recap).
// Ecart en DE2000. Seuils : 10 contre les sens, 7 entre groupes.
//   node scripts/palette-groupes.mjs
import { readFileSync } from 'fs';

const SRC = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
const bloc = (SRC.match(/var GROUP_COLORS = \{([\s\S]*?)\};/) || [])[1];
if (!bloc) { console.error('GROUP_COLORS introuvable dans app.js'); process.exit(1); }
const GROUPES = Object.fromEntries([...bloc.matchAll(/'([^']+)':'(#[0-9a-fA-F]{6})'/g)].map(m => [m[1], m[2]]));
const SENS = { marque: '#ff5c38', record: '#ffd23f', reussite: '#2bd08a', info: '#4d7cff', erreur: '#ff4d6d' };
const SURFACE = '#151412';
// Entre groupes : au moins 7, l'ancienne palette tombait a 6,7 (deuteranopie).
const SEUIL_SENS = 10, SEUIL_GROUPES = 7, CONTRASTE_MIN = 4.5;

const hex2rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
const lin = c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4;
const delin = c => c <= .0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - .055;
function rgb2lab(rgb) {
  const [r, g, b] = rgb.map(lin);
  const X = (r * .4124 + g * .3576 + b * .1805) / .95047, Y = r * .2126 + g * .7152 + b * .0722, Z = (r * .0193 + g * .1192 + b * .9505) / 1.08883;
  const f = t => t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116;
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
const VISIONS = {
  normale: null,
  deuteranopie: [[.367322, .860646, -.227968], [.280085, .672501, .047413], [-.01182, .04294, .968881]],
  protanopie: [[.152286, 1.052583, -.204868], [.114503, .786281, .099216], [-.003882, -.048116, 1.051998]],
  tritanopie: [[1.255528, -.076749, -.178779], [-.078411, .930809, .147602], [.004733, .691367, .3039]]
};
const simuler = (rgb, M) => { if (!M) return rgb; const l = rgb.map(lin); return M.map(r => delin(Math.max(0, Math.min(1, r[0] * l[0] + r[1] * l[1] + r[2] * l[2])))); };
function de2000([L1, a1, b1], [L2, a2, b2]) {
  const rad = Math.PI / 180;
  const Cm = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const G = .5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const a1p = a1 * (1 + G), a2p = a2 * (1 + G), C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h1p = (Math.atan2(b1, a1p) / rad + 360) % 360, h2p = (Math.atan2(b2, a2p) / rad + 360) % 360;
  let dhp = h2p - h1p; if (C1p * C2p === 0) dhp = 0; else if (dhp > 180) dhp -= 360; else if (dhp < -180) dhp += 360;
  const dLp = L2 - L1, dCp = C2p - C1p, dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(dhp * rad / 2);
  const Lpm = (L1 + L2) / 2, Cpm = (C1p + C2p) / 2;
  let hpm = h1p + h2p; if (C1p * C2p !== 0) hpm = Math.abs(h1p - h2p) > 180 ? (h1p + h2p + 360) / 2 : (h1p + h2p) / 2;
  const T = 1 - .17 * Math.cos((hpm - 30) * rad) + .24 * Math.cos(2 * hpm * rad) + .32 * Math.cos((3 * hpm + 6) * rad) - .2 * Math.cos((4 * hpm - 63) * rad);
  const dTh = 30 * Math.exp(-(((hpm - 275) / 25) ** 2)), RC = 2 * Math.sqrt(Cpm ** 7 / (Cpm ** 7 + 25 ** 7));
  const SL = 1 + .015 * (Lpm - 50) ** 2 / Math.sqrt(20 + (Lpm - 50) ** 2), SC = 1 + .045 * Cpm, SH = 1 + .015 * Cpm * T, RT = -Math.sin(2 * dTh * rad) * RC;
  return Math.sqrt((dLp / SL) ** 2 + (dCp / SC) ** 2 + (dHp / SH) ** 2 + RT * (dCp / SC) * (dHp / SH));
}
const lum = rgb => { const [r, g, b] = rgb.map(lin); return .2126 * r + .7152 * g + .0722 * b; };
const contraste = (x, y) => { const a = lum(x), b = lum(y); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); };

let echecs = 0;
const noms = Object.keys(GROUPES);
console.log('Palette lue dans app.js :', noms.map(n => n + ' ' + GROUPES[n]).join(', '));
for (const n of noms) {
  const c = hex2rgb(GROUPES[n]);
  const [d, sens] = Object.entries(SENS).map(([k, h]) => [de2000(rgb2lab(c), rgb2lab(hex2rgb(h))), k]).sort((a, b) => a[0] - b[0])[0];
  const k = contraste(c, hex2rgb(SURFACE));
  const ok = d >= SEUIL_SENS && k >= CONTRASTE_MIN;
  if (!ok) echecs++;
  console.log((ok ? 'OK   ' : 'FAIL ') + n.padEnd(10) + ' sens le plus proche : ' + sens + ' ' + d.toFixed(1) + ' · contraste ' + k.toFixed(1) + ':1');
}
for (const [vision, M] of Object.entries(VISIONS)) {
  let pire = [Infinity, ''];
  for (let i = 0; i < noms.length; i++) for (let j = i + 1; j < noms.length; j++) {
    const d = de2000(rgb2lab(simuler(hex2rgb(GROUPES[noms[i]]), M)), rgb2lab(simuler(hex2rgb(GROUPES[noms[j]]), M)));
    if (d < pire[0]) pire = [d, noms[i] + '/' + noms[j]];
  }
  const ok = pire[0] >= SEUIL_GROUPES;
  if (!ok) echecs++;
  console.log((ok ? 'OK   ' : 'FAIL ') + ('vision ' + vision).padEnd(20) + ' paire la plus proche : ' + pire[1] + ' ' + pire[0].toFixed(1));
}
console.log(echecs ? '\n' + echecs + ' probleme(s)' : '\nPalette conforme');
process.exit(echecs ? 1 : 0);
