/* Tests des exports de Top Set (export.js) : le calcul commun, le classeur
 * Excel octet par octet, le texte pour une IA.
 *
 *   node test/export.test.mjs
 *
 * Aucune dependance : le .xlsx est relu ici a la main (en-tetes du zip,
 * CRC de chaque fichier, XML bien forme), comme le ferait un tableur.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ICI = dirname(fileURLToPath(import.meta.url));
const X = createRequire(import.meta.url)(join(ICI, '..', 'export.js'));

let passes = 0;
const echecs = [];
function ok(nom, condition, detail) {
  if (condition) { passes++; console.log('  ok   ' + nom); }
  else { echecs.push(nom + (detail !== undefined ? ' — ' + detail : '')); console.log('  FAIL ' + nom + (detail !== undefined ? ' — ' + detail : '')); }
}

// ---------------------------------------------------------------- un carnet
let n = 0;
const S = (poids, reps, o = {}) => {
  const nb = /^\d+$/.test(String(reps)) ? Number(reps) : null;
  const vol = typeof poids === 'number' && nb ? poids * nb : 0;
  const e1rm = typeof poids === 'number' && nb && nb <= 12 ? Math.round(poids * (1 + nb / 30) * 100) / 100 : null;
  return Object.assign({ n: ++n, type: 'travail', poids, reps: String(reps), nbReps: nb, duree: null, rpe: null, repos: null,
    fait: true, note: '', vitesse: null, inclinaison: null, volume: vol, e1rm,
    texte: (typeof poids === 'number' ? String(poids).replace('.', ',') + ' kg × ' : 'PDC × ') + reps,
    court: (typeof poids === 'number' ? String(poids).replace('.', ',') : 'PDC') + '×' + reps }, o);
};
const T = (sec) => ({ n: ++n, type: 'travail', poids: null, reps: sec + ' s', nbReps: null, duree: sec, rpe: null, repos: null,
  fait: true, note: '', vitesse: null, inclinaison: null, volume: 0, e1rm: null, texte: sec + ' s', court: sec + ' s' });
const E = (nom, groupe, series, o = {}) => Object.assign({ nom, ecrit: nom, groupe, sous: '', mode: 'reps', note: '', series }, o);
const J = (date, exos, o = {}) => Object.assign({ date, titre: 'Séance', titreChoisi: false, cycle: '', debutHM: '', finHM: '',
  duree: null, validee: false, ressenti: '', exos }, o);

const modele = {
  version: 1, aujourdhui: '2026-11-16', genere: '2026-11-16T18:00:00.000Z', pseudo: 'Yom', objectifSemaine: 2,
  groupes: ['Pectoraux', 'Dos', 'Épaules', 'Bras', 'Jambes', 'Abdos', 'Cardio', 'Autre'],
  couleurs: { Pectoraux: '#ff7aa2', Jambes: '#b3d236' },
  jours: [
    J('2026-10-19', [
      E('Squat', 'Jambes', [S(60, 10, { type: 'echauffement', repos: 60 }), S(100, 5, { rpe: 8, repos: 150 }), S(100, 5, { repos: 2000 })]),
      E('Développé couché', 'Pectoraux', [S(80, 8, { repos: 120 }), S(80, 7, { note: 'dur' })])
    ], { titre: 'Jambes · Pectoraux', debutHM: '18:05', finHM: '19:17', duree: 72, validee: true, ressenti: 'bonne énergie' }),
    J('2026-10-22', [E('Tractions', 'Dos', [S(null, 10), S(null, 8)]), E('Gainage', 'Abdos', [T(60), T(45)], { mode: 'temps' })],
      { debutHM: '07:30', finHM: '08:20', duree: 50 }),
    // Une semaine sans seance : 26 octobre.
    J('2026-11-02', [E('Squat', 'Jambes', [S(105, 5, { rpe: 8.5, repos: 180 })]), E('Squat', 'Jambes', [S(90, 8)])],
      { titre: 'Jambes', cycle: 'Force' }),
    J('2026-11-12', [E('Squat', 'Jambes', [S(110, 3, { type: 'top', rpe: 9 })]), E('Développé couché', 'Pectoraux', [S(82.5, 6)])])
  ],
  pesees: [{ date: '2026-08-01', poids: 80, taille: null, bras: null, cuisse: null }, { date: '2026-11-10', poids: 78.4, taille: 82, bras: null, cuisse: null }]
};

console.log('\n— L\'analyse');
const a = X.analyser(JSON.parse(JSON.stringify(modele)));
ok('quatre seances', a.nb === 4 && a.premier === '2026-10-19' && a.dernier === '2026-11-12');
ok('les semaines vont du 19 octobre au lundi d\'aujourd\'hui, vides comprises',
  a.semaines.map(w => w.lundi + ':' + w.seances).join(' ') === '2026-10-19:2 2026-10-26:0 2026-11-02:1 2026-11-09:1 2026-11-16:0',
  a.semaines.map(w => w.lundi + ':' + w.seances).join(' '));
const squat = a.exercices.find(x => x.nom === 'Squat');
ok('le squat d\'abord : le plus pratique', a.exercices[0].nom === 'Squat' && squat.fois === 3, a.exercices.map(x => x.nom + ' ' + x.fois).join(', '));
ok('deux squats le meme jour font une seance', squat.seances.find(s => s.date === '2026-11-02').series.length === 2);
ok('charge max hors echauffement, et sa date', squat.chargeMax === 110 && squat.chargeMaxDate === '2026-11-12');
ok('progression du 1RM estime : 100×5 -> 110×3', squat.progression && squat.progression.debut.rm === 116.67 && squat.progression.fin.rm === 121, JSON.stringify(squat.progression && [squat.progression.debut.rm, squat.progression.fin.rm]));
ok('le repos median ignore l\'echauffement et les repos absurdes', squat.reposMedian === 165, String(squat.reposMedian));
ok('un exercice au temps n\'a pas de 1RM, mais une meilleure duree', (() => {
  const g = a.exercices.find(x => x.nom === 'Gainage');
  return g && g.progression === null && g.meilleur && g.meilleur.valeur === 60;
})());
ok('le profil : rythme, duree, moments', a.profil.semaines === 5 && a.profil.dureeMoyenne === 61 && a.profil.moments.soir === 1 && a.profil.moments.matin === 1,
  JSON.stringify([a.profil.semaines, a.profil.dureeMoyenne, a.profil.moments]));
ok('les fourchettes de repetitions, sans echauffement ni poids du corps exclus a tort',
  a.profil.fourchettes.force === 4 && a.profil.fourchettes.hypertrophie === 6, JSON.stringify(a.profil.fourchettes));
ok('la regularite vient d\'intelligence.js', a.profil.regularite && a.profil.regularite.objectif === 2);
ok('le poids : derniere pesee et ecart a environ trois mois', a.poids && a.poids.dernier.poids === 78.4 && Math.abs(a.poids.ecart + 1.6) < 1e-9);
ok('une phrase de synthese', /séance.* par semaine/.test(a.synthese) && /jambes/.test(a.synthese), a.synthese);
ok('un carnet vide ne casse rien', X.analyser({ aujourdhui: '2026-11-16', jours: [], pesees: [] }).synthese.length > 0);

console.log('\n— Le classeur Excel');
const octets = X.xlsx(a, new Date(2026, 10, 16, 18, 0, 0));
ok('c\'est un zip', octets[0] === 0x50 && octets[1] === 0x4b && octets[2] === 3 && octets[3] === 4);
// Relire le zip comme un tableur : le repertoire central a la fin, puis
// chaque fichier par son en-tete local, et son CRC.
function lireZip(o) {
  const v = new DataView(o.buffer, o.byteOffset, o.byteLength);
  let fin = o.length - 22;
  while (fin >= 0 && v.getUint32(fin, true) !== 0x06054b50) fin--;
  if (fin < 0) throw new Error('pas de fin de repertoire');
  const nb = v.getUint16(fin + 10, true), debutCentral = v.getUint32(fin + 16, true);
  const fichiers = {};
  let p = debutCentral;
  for (let i = 0; i < nb; i++) {
    if (v.getUint32(p, true) !== 0x02014b50) throw new Error('entree centrale ' + i);
    const crc = v.getUint32(p + 16, true), taille = v.getUint32(p + 20, true), ln = v.getUint16(p + 28, true);
    const local = v.getUint32(p + 42, true);
    const nom = new TextDecoder().decode(o.subarray(p + 46, p + 46 + ln));
    if (v.getUint32(local, true) !== 0x04034b50) throw new Error('en-tete local ' + nom);
    const lnl = v.getUint16(local + 26, true), extra = v.getUint16(local + 28, true);
    const data = o.subarray(local + 30 + lnl + extra, local + 30 + lnl + extra + taille);
    if (X.crc32(data) !== crc) throw new Error('CRC faux : ' + nom);
    fichiers[nom] = new TextDecoder().decode(data);
    p += 46 + ln + v.getUint16(p + 30, true) + v.getUint16(p + 32, true);
  }
  return fichiers;
}
let zipLu = null;
try { zipLu = lireZip(octets); } catch (e) { ok('le zip se relit', false, e.message); }
ok('le zip se relit, CRC justes', !!zipLu);
ok('le CRC32 est le bon (« 123456789 » -> cbf43926)', X.crc32(new TextEncoder().encode('123456789')).toString(16) === 'cbf43926');
if (zipLu) {
  const noms = Object.keys(zipLu);
  ok('les fichiers d\'un classeur', ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/worksheets/sheet1.xml'].every(f => noms.includes(f)), noms.join(', '));
  // XML bien forme : chaque balise ouverte se referme, dans l'ordre.
  function bienForme(t) {
    const pile = [];
    const re = /<(\/?)([A-Za-z_][\w:.-]*)[^>]*?(\/?)>|<\?[^>]*\?>/g;
    let m;
    while ((m = re.exec(t))) {
      if (!m[2]) continue;
      if (m[3]) continue;
      if (m[1]) { if (pile.pop() !== m[2]) return false; } else pile.push(m[2]);
    }
    return pile.length === 0 && !/&(?!amp;|lt;|gt;|quot;|#)/.test(t);
  }
  ok('chaque XML est bien forme', noms.every(f => bienForme(zipLu[f])), noms.filter(f => !bienForme(zipLu[f])).join(', '));
  const wb = zipLu['xl/workbook.xml'];
  ok('les onglets, dans l\'ordre', /name="Séries"[\s\S]*name="Séances"[\s\S]*name="Semaines"[\s\S]*name="Exercices"[\s\S]*name="Poids du corps"[\s\S]*name="À lire"/.test(wb), wb.match(/name="[^"]+"/g).join(' '));
  const ct = zipLu['[Content_Types].xml'];
  ok('chaque onglet est declare', (ct.match(/worksheets\/sheet\d+\.xml/g) || []).length === 6);
  const s1 = zipLu['xl/worksheets/sheet1.xml'];
  const nbSeries = modele.jours.reduce((t, j) => t + j.exos.reduce((u, e) => u + e.series.length, 0), 0);
  ok('une ligne par serie, plus l\'en-tete', (s1.match(/<row /g) || []).length === nbSeries + 1, (s1.match(/<row /g) || []).length + ' / ' + (nbSeries + 1));
  ok('les dates sont de vraies dates Excel', X.outils.serieExcel('2026-01-01') === 46023 && s1.includes('<c r="A2" s="2"><v>' + X.outils.serieExcel('2026-10-19') + '</v></c>'));
  ok('les poids sont des nombres', /<c r="J3"><v>100<\/v><\/c>/.test(s1));
  ok('les accents passent tels quels', s1.includes('Développé couché'));
  const s2 = zipLu['xl/worksheets/sheet2.xml'];
  ok('les heures sont de vraies heures', s2.includes('<c r="E2" s="3"><v>' + (18 * 60 + 5) / 1440 + '</v></c>'), (s2.match(/<c r="E2"[^/]*\/c>/) || [''])[0]);
  const s3 = zipLu['xl/worksheets/sheet3.xml'];
  ok('les semaines vides sont dans le classeur', (s3.match(/<row /g) || []).length === 6);
  const s4 = zipLu['xl/worksheets/sheet4.xml'];
  ok('les exercices et leur progression', s4.includes('Squat') && /<v>3\.7<\/v>/.test(s4), (s4.match(/<v>[\d.]+<\/v>/g) || []).slice(0, 30).join(''));
  ok('l\'en-tete est fige et en gras', s1.includes('state="frozen"') && s1.includes('s="1"'));
  ok('un caractere de controle ne casse pas le XML', bienForme(X.classeur([{ nom: 'a', colonnes: [{ titre: 'x' }], lignes: [['a\u0001b<&>"']] }]).length > 0 ? lireZip(X.classeur([{ nom: 'a', colonnes: [{ titre: 'x' }], lignes: [['a\u0001b<&>"']] }]))['xl/worksheets/sheet1.xml'] : ''));
}
ok('un carnet vide fait un classeur valide', (() => {
  try { const z = lireZip(X.xlsx(X.analyser({ aujourdhui: '2026-11-16', jours: [], pesees: [], groupes: [] }))); return !!z['xl/worksheets/sheet1.xml']; } catch (e) { return false; }
})());

console.log('\n— Le texte pour une IA');
const txt = X.texteIA(a);
ok('la consigne d\'abord, puis la legende', txt.indexOf('## Ce que je te demande') > 0 && txt.indexOf('## Ce que je te demande') < txt.indexOf('## Comment lire les données'));
ok('elle demande repos, charges semaine par semaine, schemas et temps passe',
  /temps de repos/.test(txt) && /semaine après semaine/.test(txt) && /schémas d'entraînement/.test(txt) && /temps passé/.test(txt));
ok('le profil, les semaines, les exercices, les seances, les pesees', ['## Mon profil en bref', '## Semaine par semaine', '## Exercice par exercice', '## Toutes les séances', '## Pesées'].every(s => txt.includes(s)));
ok('une semaine sans seance est dite', /\| 2026-10-26 \| 0 \| 0 \|/.test(txt));
ok('une serie en quelques caracteres : charge, RPE, repos', txt.includes('100×5 @8 r150') && txt.includes('É 60×10 r60'));
ok('un top set declare porte sa lettre', txt.includes('T 110×3 @9'));
ok('la courbe des charges de chaque exercice', /Top sets : 2026-10-19 100×5 @8 · 2026-11-02 105×5 @8,5 · 2026-11-12 110×3 @9/.test(txt), (txt.match(/Top sets : .*/) || [''])[0]);
ok('horaires, duree, ressenti', txt.includes('18:05 → 19:17 (1 h 12)') && txt.includes('« bonne énergie »'));
ok('la note d\'une serie suit la serie', txt.includes('80×7 « dur »'));
ok('pas d\'email ni de cle dans le texte', !/@[a-z0-9-]+\.[a-z]{2,}|eyJ|anon/i.test(txt));
ok('un carnet vide donne quand meme la consigne', /Ce que je te demande/.test(X.texteIA(X.analyser({ aujourdhui: '2026-11-16', jours: [], pesees: [] }))));

console.log('\n— Le carnet PDF');
ok('la notation de salle : trois series identiques font « ×3 »', X.seriesSalle([S(100, 5), S(100, 5), S(100, 5)]) === '100×5×3');
ok('l echauffement reste a part, le RPE reste lu', X.seriesSalle([S(60, 10, { type: 'echauffement' }), S(100, 5), S(100, 5), S(100, 5, { rpe: 8 })]) === 'É 60×10 · 100×5×2 · 100×5 @8',
  X.seriesSalle([S(60, 10, { type: 'echauffement' }), S(100, 5), S(100, 5), S(100, 5, { rpe: 8 })]));
ok('deux series pareilles au RPE identique se regroupent, RPE a la fin', X.seriesSalle([S(80, 8, { rpe: 9 }), S(80, 8, { rpe: 9 })]) === '80×8×2 @9');
const JPEG = Uint8Array.from(atob('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAGAAQDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwC5RRRXxR+wH//Z'), c => c.charCodeAt(0));
const pdf = X.pdfDepuisImages([{ octets: JPEG, l: 4, h: 6 }, { octets: JPEG, l: 4, h: 6 }], { titre: 'Top Set — carnet de Léa', date: '20261116000000' });
const brut = new TextDecoder('latin1').decode(pdf);
ok('un PDF 1.4, qui finit par %%EOF', brut.startsWith('%PDF-1.4\n') && brut.endsWith('%%EOF\n'));
const sx = Number((/startxref\n(\d+)\n%%EOF\n$/.exec(brut) || [])[1]);
ok('startxref pointe sur la table', brut.slice(sx, sx + 5) === 'xref\n');
const lt = brut.slice(sx).split('\n'), nObj = Number(lt[1].split(' ')[1]);
let adressesJustes = nObj > 1;
for (let k = 1; k < nObj; k++) { const off = Number(lt[2 + k].slice(0, 10)); if (!brut.slice(off).startsWith(k + ' 0 obj')) adressesJustes = false; }
ok('chaque adresse de la table tombe sur son objet', adressesJustes && lt[2].startsWith('0000000000 65535 f'));
ok('chaque ligne de la table fait 20 octets', lt.slice(2, 2 + nObj).every(l => (l + '\n').length === 20));
ok('deux pages A4', /\/Count 2 /.test(brut) && (brut.match(/\/MediaBox \[0 0 595\.28 841\.89\]/g) || []).length === 2);
ok('chaque page porte son image JPEG intacte', (brut.match(/\/Filter \/DCTDecode \/Length 633 /g) || []).length === 2
  && brut.includes('/Width 4 /Height 6') && brut.split(new TextDecoder('latin1').decode(JPEG)).length === 3);
ok('le titre garde ses accents (UTF-16)', brut.includes('/Title <FEFF0054006F0070') && brut.includes('00E9') && brut.includes('/CreationDate (D:20261116000000)'));
ok('la longueur du flux de chaque page est juste', [...brut.matchAll(/<< \/Length (\d+) >>\nstream\n([^\n]*)\nendstream/g)].every(m => Number(m[1]) === m[2].length));
ok('la mise en page se verifie : un texte qui deborde ou en chevauche un autre est signale', (() => {
  const pb = X.verifierMiseEnPage({ cadre: { l: 595.28, h: 841.89, marge: 40 }, boites: [
    { page: 1, x: 40, y: 50, l: 100, h: 10, t: 'a' }, { page: 1, x: 120, y: 52, l: 60, h: 10, t: 'b' },
    { page: 1, x: 500, y: 90, l: 80, h: 10, t: 'c' }, { page: 2, x: 40, y: 50, l: 100, h: 10, t: 'd' }] });
  return pb.length === 2 && /chevauche p\.1/.test(pb.join()) && /déborde p\.1 : c/.test(pb.join());
})());

console.log('\n' + passes + ' reussis, ' + echecs.length + ' echoues');
if (echecs.length) { console.log(echecs.join('\n')); process.exit(1); }
