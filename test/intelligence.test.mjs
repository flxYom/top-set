/* Tests de la logique metier de Top Set.
 *
 *   node test/intelligence.test.mjs
 *
 * Aucune dependance : Node suffit. Les tests verifient le COMPORTEMENT
 * (« un echauffement plus lourd ne devient pas le top set »), pas la simple
 * existence des fonctions.
 */
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const ICI = dirname(fileURLToPath(import.meta.url));
const TS = createRequire(import.meta.url)(join(ICI, '..', 'intelligence.js'));

let passes = 0;
const echecs = [];
let section = '';

function titre(t) { section = t; console.log('\n— ' + t); }

function ok(nom, condition, detail) {
  if (condition) { passes++; console.log('  ok   ' + nom); }
  else { echecs.push(section + ' / ' + nom + (detail ? ' — ' + detail : '')); console.log('  FAIL ' + nom + (detail ? ' — ' + detail : '')); }
}

function egal(nom, obtenu, attendu) {
  const a = JSON.stringify(obtenu), b = JSON.stringify(attendu);
  ok(nom, a === b, a === b ? '' : 'obtenu ' + a + ', attendu ' + b);
}

const s = (poids, reps, opts = {}) => Object.assign({ poids, reps }, opts);

// ---------------------------------------------------------------- 1
titre('Lecture des repetitions (le champ est du texte libre)');
egal('un entier', TS.nombreReps('8'), 8);
egal('un nombre', TS.nombreReps(8), 8);
egal('une fourchette rend la borne basse', TS.nombreReps('8-10'), 8);
egal('un suffixe est ignore', TS.nombreReps('12+'), 12);
egal('une virgule decimale', TS.nombreReps('7,5'), 7.5);
egal('du texte sans chiffre', TS.nombreReps('AMRAP'), null);
egal('vide', TS.nombreReps(''), null);
egal('absent', TS.nombreReps(null), null);
egal('zero n est pas une performance', TS.nombreReps('0'), null);

// ---------------------------------------------------------------- 2
titre('Volume');
egal('poids x reps', TS.volumeSerie(s(70, '5')), 350);
egal('sans reps, rien', TS.volumeSerie(s(70, '')), 0);
egal('sans poids, rien', TS.volumeSerie(s(null, '10')), 0);
egal('poids du corps ne compte pas au volume', TS.volumeSerie(s(null, '20')), 0);
egal('total', TS.volumeTotal([s(70, '5'), s(60, '10'), s(null, '8')]), 950);
egal('liste vide', TS.volumeTotal([]), 0);

// ---------------------------------------------------------------- 3
titre('1RM estime (Epley)');
egal('une rep rend la charge elle-meme', TS.epley(100, '1'), 103.33);
egal('70 x 5', TS.epley(70, '5'), 81.67);
egal('au-dela de 12 reps on refuse', TS.epley(50, '20'), null);
egal('12 reps passe encore', TS.epley(50, '12'), 70);
egal('poids nul', TS.epley(0, '5'), null);
egal('poids absent', TS.epley(null, '5'), null);
egal('reps absentes', TS.epley(100, ''), null);

// ---------------------------------------------------------------- 4
titre('Top set — cas de base');
egal('aucune serie', TS.calculerTopSet([]), null);
egal('entree absente', TS.calculerTopSet(null), null);
egal('series vides ne comptent pas', TS.calculerTopSet([s(null, ''), s(null, '')]), null);
{
  const seule = s(70, '5');
  egal('une seule serie', TS.calculerTopSet([seule]), seule);
}
{
  const top = s(80, '3');
  egal('la plus lourde gagne', TS.calculerTopSet([s(70, '8'), top, s(75, '5')]), top);
}

// ---------------------------------------------------------------- 5
titre('Top set — departages');
{
  const plus = s(80, '5');
  egal('a poids egal, le plus de reps', TS.calculerTopSet([s(80, '3'), plus]), plus);
}
{
  const facile = s(80, '5', { rpe: 7 });
  egal('a reps egales, le RPE le plus bas', TS.calculerTopSet([s(80, '5', { rpe: 9 }), facile]), facile);
}
{
  const avec = s(80, '5', { rpe: 8 });
  egal('une serie avec RPE bat une serie sans', TS.calculerTopSet([s(80, '5'), avec]), avec);
}

// ---------------------------------------------------------------- 6
titre('Top set — types de serie');
{
  const T = TS.TYPES;
  const travail = s(70, '5', { type: T.TRAVAIL });
  egal('un echauffement plus lourd ne gagne pas',
    TS.calculerTopSet([s(90, '2', { type: T.ECHAUFFEMENT }), travail]), travail);
  egal('un back-off ne gagne pas',
    TS.calculerTopSet([s(90, '10', { type: T.BACKOFF }), travail]), travail);

  const declare = s(60, '5', { type: T.TOP });
  egal('l etiquette manuelle bat le calcul',
    TS.calculerTopSet([s(90, '3', { type: T.TRAVAIL }), declare]), declare);

  const lourd = s(85, '3', { type: T.TOP });
  egal('plusieurs top sets declares : le plus lourd',
    TS.calculerTopSet([s(70, '5', { type: T.TOP }), lourd]), lourd);

  egal('que des echauffements : pas de top set',
    TS.calculerTopSet([s(40, '10', { type: T.ECHAUFFEMENT }), s(50, '8', { type: T.ECHAUFFEMENT })]), null);

  const sansType = s(80, '5');
  egal('une serie sans type reste candidate',
    TS.calculerTopSet([s(40, '10', { type: T.ECHAUFFEMENT }), sansType]), sansType);
  egal('un type inconnu est traite comme charge de travail',
    TS.typeSerie({ type: 'nimportequoi' }), T.TRAVAIL);
}

// ---------------------------------------------------------------- 7
titre('Top set — poids du corps');
{
  const plus = s(null, '20');
  egal('sans poids, le plus de reps', TS.calculerTopSet([s(null, '12'), plus]), plus);
  const pese = s(10, '8');
  egal('une serie lestee bat une serie au poids du corps',
    TS.calculerTopSet([s(null, '30'), pese]), pese);
}

// ---------------------------------------------------------------- 8
titre('Records par fourchette de reps');
{
  const h = [
    { date: '2026-08-01', series: [s(60, '10'), s(80, '5')] },
    { date: '2026-08-08', series: [s(90, '3'), s(40, '12', { type: TS.TYPES.ECHAUFFEMENT })] },
    { date: '2026-08-15', series: [s(100, '1')] }
  ];
  const r = TS.recordsParReps(h);
  const par = Object.fromEntries(r.map(x => [x.reps, x.poids]));
  egal('1 rep', par[1], 100);
  egal('3 reps', par[3], 90);
  egal('5 reps', par[5], 80);
  egal('10 reps', par[10], 60);
  ok('12 reps : l echauffement ne fait pas record', par[12] === undefined, 'obtenu ' + par[12]);
  egal('aucun historique', TS.recordsParReps([]), []);
  egal('meilleur poids, echauffement exclu', TS.meilleurPoids(h), 100);
}

// ---------------------------------------------------------------- 9
titre('Performance precedente');
{
  const h = [
    { date: '2026-08-26', series: [s(65, '8')] },
    { date: '2026-09-02', series: [s(70, '5'), s(67.5, '7')] },
    { date: '2026-09-09', series: [s(72.5, '5')] }
  ];
  const p = TS.performancePrecedente(h, '2026-09-09');
  egal('prend la seance la plus recente avant la date', p.date, '2026-09-02');
  egal('rend toutes les series, pas la meilleure', p.series.length, 2);
  egal('top set de cette seance', p.topSet.poids, 70);
  egal('volume de la seance', p.volume, 70 * 5 + 67.5 * 7);
  egal('1RM estime du top set', p.rmEstime, TS.epley(70, '5'));

  egal('premiere seance : rien avant', TS.performancePrecedente(h, '2026-08-26'), null);
  egal('historique vide', TS.performancePrecedente([], '2026-09-09'), null);
  ok('les seances vides sont ignorees',
    TS.performancePrecedente([{ date: '2026-09-01', series: [s(null, '')] }, h[0]], '2026-09-09').date === '2026-08-26');
  ok('sans date de reference, la derniere de toutes',
    TS.performancePrecedente(h, null).date === '2026-09-09');
}

// ---------------------------------------------------------------- 10
titre('Signal d entrainement');
{
  const j = (date, poids, reps, opts) => ({ date, series: [s(poids, reps, opts)] });

  egal('aucune donnee', TS.detecterSignal([]).signal, 'insufficient_data');
  egal('une seance', TS.detecterSignal([j('2026-09-01', 70, '5')]).signal, 'insufficient_data');
  egal('deux seances', TS.detecterSignal([j('2026-09-01', 70, '5'), j('2026-09-08', 72.5, '5')]).signal, 'insufficient_data');
  egal('il manque une seance', TS.detecterSignal([j('2026-09-01', 70, '5')]).manquantes, 2);

  egal('trois hausses', TS.detecterSignal([
    j('2026-08-26', 70, '5'), j('2026-09-02', 72.5, '5'), j('2026-09-09', 75, '5')
  ]).signal, 'progressing');

  egal('trois baisses', TS.detecterSignal([
    j('2026-08-26', 80, '5'), j('2026-09-02', 75, '5'), j('2026-09-09', 70, '5')
  ]).signal, 'declining');

  egal('trois fois pareil', TS.detecterSignal([
    j('2026-08-26', 70, '5'), j('2026-09-02', 70, '5'), j('2026-09-09', 70, '5')
  ]).signal, 'stable');

  egal('quatre fois pareil, c est une stagnation', TS.detecterSignal([
    j('2026-08-19', 70, '5'), j('2026-08-26', 70, '5'), j('2026-09-02', 70, '5'), j('2026-09-09', 70, '5')
  ]).signal, 'stagnating');

  // Moins de poids mais plus de reps : le 1RM estime monte, donc c'est un
  // progres. Comparer les poids bruts aurait annonce une baisse.
  egal('plus de reps a charge plus basse reste un progres', TS.detecterSignal([
    j('2026-08-26', 75, '3'), j('2026-09-02', 72.5, '5'), j('2026-09-09', 70, '8')
  ]).signal, 'progressing');

  egal('une seance sans top set mesurable ne compte pas', TS.detecterSignal([
    j('2026-08-26', 70, '5'), { date: '2026-09-02', series: [s(null, '')] }, j('2026-09-09', 75, '5')
  ]).signal, 'insufficient_data');

  ok('le signal porte toujours sa raison',
    typeof TS.detecterSignal([j('2026-09-09', 70, '5')]).raison === 'string');

  ok('une seule mauvaise seance ne declenche pas d alerte',
    TS.detecterSignal([
      j('2026-08-12', 70, '5'), j('2026-08-19', 72.5, '5'),
      j('2026-08-26', 75, '5'), j('2026-09-02', 77.5, '5'), j('2026-09-09', 75, '5')
    ]).signal !== 'declining');
}

// ---------------------------------------------------------------- 11
titre('Cible suggeree');
{
  const j = (date, poids, reps, opts) => ({ date, series: [s(poids, reps, opts)] });

  egal('sans historique, aucune suggestion', TS.suggererCible([]), null);
  egal('sans poids, aucune suggestion', TS.suggererCible([{ date: '2026-09-09', series: [s(null, '20')] }]), null);

  const facile = TS.suggererCible([j('2026-09-09', 70, '5', { rpe: 7 })]);
  egal('RPE 7 : on monte', facile.poids, 72.5);
  egal('RPE 7 : memes reps', facile.reps, 5);
  ok('la suggestion porte sa raison', typeof facile.raison === 'string' && facile.raison.length > 0);
  egal('la suggestion cite la performance qui la fonde', facile.base.poids, 70);

  const limite = TS.suggererCible([j('2026-09-09', 70, '5', { rpe: 9 })]);
  egal('RPE 9 : on garde la charge', limite.poids, 70);

  const echec = TS.suggererCible([j('2026-09-09', 70, '5', { rpe: 10 })]);
  egal('RPE 10 : on garde la charge', echec.poids, 70);
  egal('RPE 10 : une rep de moins', echec.reps, 4);

  egal('sans RPE et sans tendance : rien', TS.suggererCible([j('2026-09-09', 70, '5')]), null);

  const tendance = TS.suggererCible([
    j('2026-08-26', 65, '5'), j('2026-09-02', 67.5, '5'), j('2026-09-09', 70, '5')
  ]);
  ok('sans RPE mais en progression : on monte', tendance !== null && tendance.poids === 72.5,
    tendance ? 'obtenu ' + tendance.poids : 'null');

  const pas5 = TS.suggererCible([j('2026-09-09', 70, '5', { rpe: 7 })], 5);
  egal('increment parametrable', pas5.poids, 75);

  // Le top set est calcule avant de suggerer : un echauffement lourd ne doit
  // pas faire proposer une cible absurde.
  const avecEchauffement = TS.suggererCible([{
    date: '2026-09-09',
    series: [s(90, '2', { type: TS.TYPES.ECHAUFFEMENT }), s(70, '5', { type: TS.TYPES.TRAVAIL, rpe: 7 })]
  }]);
  egal('la cible part du top set, pas de l echauffement', avecEchauffement.poids, 72.5);
}

// ---------------------------------------------------------------- 12
titre('Robustesse');
{
  egal('serie sans rien', TS.serieRemplie({}), false);
  egal('serie avec poids seul', TS.serieRemplie(s(70, '')), true);
  egal('serie avec reps seules', TS.serieRemplie(s(null, '10')), true);
egal('AMRAP au poids du corps compte comme faite', TS.serieRemplie(s(null, 'AMRAP')), true);
egal('des espaces ne font pas une serie', TS.serieRemplie(s(null, '   ')), false);
  ok('poids negatif ignore au top set',
    TS.calculerTopSet([s(-10, '5'), s(70, '5')]).poids === 70);
  ok('aucune fonction ne modifie son entree', (function () {
    const entree = [s(70, '5'), s(80, '3')];
    const copie = JSON.stringify(entree);
    TS.calculerTopSet(entree); TS.volumeTotal(entree); TS.recordsParReps([{ date: 'x', series: entree }]);
    return JSON.stringify(entree) === copie;
  })());
}

// ----------------------------------------------------------------
console.log('\n' + '='.repeat(52));
if (echecs.length) {
  console.log(passes + ' tests passes, ' + echecs.length + ' ECHEC(S) :');
  echecs.forEach(e => console.log('  - ' + e));
  process.exit(1);
}
console.log(passes + ' tests passes, 0 echec.');
