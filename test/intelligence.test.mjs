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
import { readFileSync } from 'fs';

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

  // Sans RPE (14/11/2026) : sous 6 reps, lineaire ; au-dessus, double progression.
  const lin = TS.suggererCible([j('2026-09-09', 70, '5')]);
  egal('sans RPE, 70 x 5 : un cran de plus a reps egales (lineaire)', [lin.poids, lin.reps, lin.methode], [72.5, 5, 'lineaire']);
  const dbl = TS.suggererCible([j('2026-09-09', 60, '10')]);
  egal('sans RPE, 60 x 10 : meme charge, une rep de plus (double progression)', [dbl.poids, dbl.reps, dbl.methode], [60, 11, 'double']);
  const haut = TS.suggererCible([j('2026-09-09', 60, '12')]);
  egal('sans RPE, 60 x 12 : haut de la fourchette, on monte et on repart de 8', [haut.poids, haut.reps], [62.5, 8]);
  const endu = TS.suggererCible([j('2026-09-09', 40, '20')]);
  egal('sans RPE, 40 x 20 : haut de l endurance, on monte et on repart de 15', [endu.poids, endu.reps], [42.5, 15]);
  const cyF = TS.suggererCible([j('2026-09-09', 80, '8')], undefined, 'Force');
  egal('en cycle force, 80 x 8 reste lineaire', [cyF.poids, cyF.reps], [82.5, 8]);
  const cyH = TS.suggererCible([j('2026-09-09', 70, '5')], undefined, 'Hypertrophie');
  egal('en cycle hypertrophie, 70 x 5 : une rep de plus vers la fourchette', [cyH.poids, cyH.reps], [70, 6]);
  ok('la raison nomme la double progression', /[Dd]ouble progression/.test(dbl.raison) && /[Dd]ouble progression/.test(haut.raison));
  egal('sans RPE et en baisse depuis trois seances : rien, le signal parle',
       TS.suggererCible([j('2026-08-26', 80, '5'), j('2026-09-02', 75, '5'), j('2026-09-09', 70, '5')]), null);

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
titre('Exercices au temps (gainage, planche)');
{
  egal('« 45 s » est une duree', TS.dureeSecondes('45 s'), 45);
  egal('« 45s » colle aussi', TS.dureeSecondes('45s'), 45);
  egal('« 1:30 » comme un chrono', TS.dureeSecondes('1:30'), 90);
  egal('« 1 min 30 »', TS.dureeSecondes('1 min 30'), 90);
  egal('« 2 min »', TS.dureeSecondes('2 min'), 120);
  egal("« 1'30 »", TS.dureeSecondes("1'30"), 90);
  egal('« 45 » sans unite reste des reps', TS.dureeSecondes('45'), null);
  egal('« 8-10 » reste des reps', TS.dureeSecondes('8-10'), null);
  egal('« 20 m » (metres) n est pas une duree', TS.dureeSecondes('20 m'), null);
  egal('« 0 s » ne compte pas', TS.dureeSecondes('0 s'), null);
  egal('un nombre brut n est pas une duree', TS.dureeSecondes(45), null);
  egal('ecrire 90 secondes', TS.ecrireDuree(90), '90 s');
  egal('ecrire rien', TS.ecrireDuree(0), '');
  egal('lire 45 s', TS.formatDuree(45), '45 s');
  egal('lire 90 s', TS.formatDuree(90), '1 min 30');
  egal('lire 125 s', TS.formatDuree(125), '2 min 05');
  egal('lire 120 s', TS.formatDuree(120), '2 min');
  egal('aller-retour ecrire puis relire', TS.dureeSecondes(TS.ecrireDuree(75)), 75);

  // Le piege : une duree lue comme des reps gonflerait volume et 1RM.
  egal('une duree n est pas un nombre de reps', TS.nombreReps('45 s'), null);
  egal('pas de volume pour une planche lestee', TS.volumeSerie(s(10, '60 s')), 0);
  egal('pas de 1RM pour une planche lestee', TS.epleySerie(s(10, '60 s')), null);
  egal('pas de record par reps', TS.recordsParReps([{ date: 'x', series: [s(10, '60 s')] }]), []);
  egal('pas de cible suggeree', TS.suggererCible([{ date: '2026-09-01', series: [s(null, '60 s', { rpe: 6 })] }]), null);
  egal('une serie au temps est une serie faite', TS.serieRemplie(s(null, '45 s')), true);

  const series = [s(null, '45 s'), s(null, '70 s'), s(null, '60 s')];
  egal('la meilleure serie est la plus longue', TS.calculerTopSet(series).reps, '70 s');
  ok('un echauffement long ne fait pas le top', TS.calculerTopSet([
    s(null, '90 s', { type: 'echauffement' }), s(null, '60 s')]).reps === '60 s');
  const jours = [
    { date: '2026-09-01', series: [s(null, '45 s'), s(null, '50 s')] },
    { date: '2026-09-04', series: [s(null, '60 s')] },
    { date: '2026-09-08', series: [s(null, '75 s'), s(null, '120 s', { type: 'echauffement' })] }
  ];
  egal('meilleur temps, echauffement exclu', TS.meilleureDuree(jours), 75);
  egal('temps total sous tension', TS.dureeTotale(jours), 45 + 50 + 60 + 75 + 120);
  egal('la courbe suit le plus long de chaque seance',
    TS.pointsDuree(jours).map(p => p.valeur), [50, 60, 75]);
  const sig = TS.detecterSignal(jours, 'temps');
  egal('trois seances qui montent : en progression', sig.signal, 'progressing');
  ok('et la raison parle de temps, pas de top set', /meilleur temps/.test(sig.raison), sig.raison);
  egal('en mode reps, une planche n a aucun top set mesurable',
    TS.detecterSignal(jours).signal, 'insufficient_data');
}

// ----------------------------------------------------------------
titre('Importer sans ecraser');
{
  let n = 0;
  const fab = p => p + 'neuf' + (++n);
  const ex = (id, nom, series, extra = {}) => Object.assign({ id, nom, groupe: 'Autre', series }, extra);
  const se = (id, poids, reps) => ({ id, poids, reps, rpe: null, repos: '', fait: true });

  const local = {
    '2026-09-01': { date: '2026-09-01', exercises: [ex('x1', 'Squat', [se('s1', 100, '5')])] }
  };
  const avant = JSON.stringify(local);

  // Le meme fichier, mais la seance a ete modifiee depuis l'export.
  const fichier = {
    '2026-09-01': { date: '2026-09-01', titre: 'Jambes lourdes',
      exercises: [ex('x1', 'Squat', [se('s1', 90, '5')]), ex('x2', 'Fentes', [se('s2', 20, '10')])] },
    '2026-09-03': { date: '2026-09-03', exercises: [ex('x3', 'Tractions', [se('s3', null, '8')])] }
  };
  const r = TS.fusionnerCarnets(local, fichier, fab);
  egal('le carnet d origine n est pas modifie', JSON.stringify(local), avant);
  egal('le squat deja la garde SA valeur, pas celle du fichier',
    r.sessions['2026-09-01'].exercises[0].series[0].poids, 100);
  egal('les fentes absentes sont ajoutees',
    r.sessions['2026-09-01'].exercises.map(e => e.nom), ['Squat', 'Fentes']);
  egal('le jour absent est ajoute', !!r.sessions['2026-09-03'], true);
  egal('le titre manquant est repris', r.sessions['2026-09-01'].titre, 'Jambes lourdes');
  egal('bilan : 1 jour, 2 exercices, 2 series, 1 titre',
    [r.bilan.jours, r.bilan.exercices, r.bilan.series, r.bilan.titres], [1, 2, 2, 1]);

  const r2 = TS.fusionnerCarnets(r.sessions, fichier, fab);
  egal('reimporter le meme fichier n ajoute rien',
    [r2.bilan.jours, r2.bilan.exercices, r2.bilan.titres], [0, 0, 0]);

  // Le tableur n'a pas d'identifiants : c'est le contenu qui reconnait.
  const sansId = { '2026-09-01': { date: '2026-09-01', exercises: [
    { nom: 'squat', series: [{ poids: 100, reps: '5' }] }] } };
  egal('sans identifiant, le meme contenu est reconnu',
    TS.fusionnerCarnets(local, sansId, fab).bilan.exercices, 0);

  const deuxFois = { '2026-09-05': { date: '2026-09-05', exercises: [
    ex('p1', 'Pompes', [se('q1', null, '20')]), ex('p2', 'Pompes', [se('q2', null, '20')])] } };
  egal('deux cartes identiques le meme jour sont deux exercices',
    TS.fusionnerCarnets(local, deuxFois, fab).bilan.exercices, 2);
  const unDeja = { '2026-09-05': { date: '2026-09-05', exercises: [
    { id: 'autre', nom: 'Pompes', groupe: 'Autre', series: [{ id: 'z', poids: null, reps: '20' }] }] } };
  egal('et si une seule est deja la, l autre arrive',
    TS.fusionnerCarnets(unDeja, deuxFois, fab).bilan.exercices, 1);

  // En base, un exercice est unique tous jours confondus.
  const collision = { '2026-09-07': { date: '2026-09-07', exercises: [ex('x1', 'Dips', [se('s1', null, '12')])] } };
  const rc = TS.fusionnerCarnets(local, collision, fab);
  const dips = rc.sessions['2026-09-07'].exercises[0];
  ok('un id deja pris ailleurs est remplace', dips.id !== 'x1' && dips.series[0].id !== 's1',
    dips.id + ' / ' + dips.series[0].id);

  const hostile = { '2026-09-08': { date: '2026-09-08', exercises: [ex('__proto__', 'Curl', [se('constructor', 10, '10')])] } };
  ok('un id « __proto__ » ne casse rien',
    TS.fusionnerCarnets(local, hostile, fab).bilan.exercices === 1);

  const superset = { '2026-09-09': { date: '2026-09-09', exercises: [
    ex('a', 'Curl', [se('sa', 10, '10')], { bloc: 'b1' }),
    ex('b', 'Triceps', [se('sb', 10, '10')], { bloc: 'b1' })] } };
  const rs = TS.fusionnerCarnets(local, superset, fab).sessions['2026-09-09'].exercises;
  ok('un superset arrive entier, sous un bloc neuf',
    rs[0].bloc && rs[0].bloc === rs[1].bloc && rs[0].bloc !== 'b1');
  const moitie = { '2026-09-09': { date: '2026-09-09', exercises: [
    { id: 'a', nom: 'Curl', groupe: 'Bras', series: [{ id: 'sa', poids: 10, reps: '10' }] }] } };
  const rm = TS.fusionnerCarnets(moitie, superset, fab).sessions['2026-09-09'].exercises;
  ok('un superset dont un seul membre arrive n en est plus un', rm.every(e => !e.bloc));

  // Deux pages de l'app sur le meme telephone : aucune n'est « plus
  // ancienne », donc une serie notee dans l'une doit survivre a la
  // sauvegarde de l'autre — ce qu'un import, lui, refuse de faire.
  // (14/10/2026)
  const voisine = {
    '2026-09-01': { date: '2026-09-01', exercises: [
      ex('x1', 'Squat', [se('s1', 100, '5'), se('s9', 105, '3')]),
      ex('x7', 'Presse', [se('s7', 150, '10')])] }
  };
  const avantV = JSON.stringify(local);
  const rv = TS.fusionnerEcritures(local, voisine, fab);
  egal('fusionnerEcritures ne modifie pas le carnet d origine', JSON.stringify(local), avantV);
  egal('fusionnerEcritures reprend la serie ajoutee a un exercice connu',
    rv.sessions['2026-09-01'].exercises[0].series.map(s => s.poids), [100, 105]);
  egal('et l exercice entier note par l autre page',
    rv.sessions['2026-09-01'].exercises.map(e => e.nom), ['Squat', 'Presse']);
  egal('bilan : 2 series reprises, et la date est signalee une seule fois',
    [rv.bilan.series, rv.bilan.dates.length], [2, 1]);
  egal('un import, lui, ne touche pas a un exercice deja la',
    TS.fusionnerCarnets(local, voisine, fab).sessions['2026-09-01'].exercises[0].series.length, 1);
  egal('refusionner deux fois n ajoute rien', TS.fusionnerEcritures(rv.sessions, voisine, fab).bilan.series, 0);
  // Une carte vide ouverte dans l'autre page n'est pas une serie notee.
  const vide = { '2026-09-01': { date: '2026-09-01', exercises: [
    ex('x1', 'Squat', [se('s1', 100, '5'), { id: 'sv', poids: null, reps: '', rpe: null, repos: '' }])] } };
  egal('une serie vide de l autre page n est pas reprise',
    TS.fusionnerEcritures(local, vide, fab).bilan.series, 0);

  // La fusion reconstruisait la journee avec le titre pour seul bagage :
  // ajouter un exercice a une journee faisait tomber son cycle, son mot et sa
  // validation. Une fusion AJOUTE. (22/10/2026)
  const garni = {
    '2026-09-01': { date: '2026-09-01', titre: 'Jambes', cycle: 'Prise de masse',
      commentaire: 'Mal dormi', termine: '2026-09-01T19:30:00.000Z',
      debut: '2026-09-01T17:00:00.000Z', fin: '2026-09-01T19:30:00.000Z',
      exercises: [ex('x1', 'Squat', [se('s1', 100, '5')])] }
  };
  const apres = TS.fusionnerCarnets(garni, voisine, fab).sessions['2026-09-01'];
  ok('une journee fusionnee garde son cycle, son mot et sa validation',
    apres.cycle === 'Prise de masse' && apres.commentaire === 'Mal dormi'
    && apres.termine === '2026-09-01T19:30:00.000Z');
  ok('elle garde aussi ses horaires',
    apres.debut === '2026-09-01T17:00:00.000Z' && apres.fin === '2026-09-01T19:30:00.000Z');
  ok('et son titre, comme avant', apres.titre === 'Jambes');

  // L'inverse : une journee que le carnet n'a pas encore arrive avec les
  // siens. Un import ne doit pas les laisser au bord de la route.
  const neuve = { '2026-09-20': { date: '2026-09-20', cycle: 'Sèche',
    commentaire: 'Court mais propre', termine: '2026-09-20T20:00:00.000Z',
    exercises: [ex('x9', 'Tractions', [se('s9', 0, '8')])] } };
  const imp = TS.fusionnerCarnets({}, neuve, fab).sessions['2026-09-20'];
  ok('une journee importee arrive avec son cycle, son mot et sa validation',
    imp.cycle === 'Sèche' && imp.commentaire === 'Court mais propre'
    && imp.termine === '2026-09-20T20:00:00.000Z');
  // Et le local garde la main quand les deux ont quelque chose a dire.
  const conflit = { '2026-09-20': { date: '2026-09-20', cycle: 'Force',
    exercises: [ex('x9', 'Tractions', [se('s9', 0, '8')])] } };
  egal('ce qui est deja ecrit ici n est jamais remplace',
    TS.fusionnerCarnets(conflit, neuve, fab).sessions['2026-09-20'].cycle, 'Force');
}

// ----------------------------------------------------------------
titre('Series d echauffement');
{
  const e = (c, b, p) => TS.seriesEchauffement(c, b, p).map(s => s.poids + 'x' + s.reps);
  egal('100 kg : barre vide, 50, 70, 85 %', e(100, 20), ['20x8', '50x5', '70x3', '85x2']);
  egal('82,5 kg : chaque marche tombe sur le pas de 2,5 kg, en dessous', e(82.5, 20), ['20x8', '40x5', '57.5x3', '70x2']);
  egal('30 kg : les marches sous la barre sont deja faites par la barre vide', e(30, 20), ['20x8', '25x2']);
  // 20 kg sur une barre de 20, c est la barre vide — mais c est surtout un
  // haltere de 20 kg, bien plus courant : les pourcentages.
  egal('20 kg : lu comme un haltere, les pourcentages seuls', e(20, 20), ['10x5', '12.5x3', '15x2']);
  egal('un haltere de 15 kg : pas de barre vide, les pourcentages seuls', e(15, 20), ['7.5x5', '10x3', '12.5x2']);
  egal('une barre de 15 kg (42 kg tombe a 40, jamais a 42,5)', e(60, 15), ['15x8', '30x5', '40x3', '50x2']);
  egal('un pas de 5 kg (salle sans petits disques)', e(100, 20, 5), ['20x8', '50x5', '70x3', '85x2']);
  egal('un pas de 5 kg arrondit en dessous, jamais au-dessus', e(82.5, 20, 5), ['20x8', '40x5', '55x3', '70x2']);
  egal('sans charge, rien', e(null, 20), []);
  egal('une charge illisible, rien', e('abc', 20), []);
  egal('une charge negative, rien', e(-50, 20), []);
  ok('aucune marche n atteint la charge de travail', TS.seriesEchauffement(22.5, 20).every(s => s.poids < 22.5));
  ok('jamais deux marches au meme poids', (() => { const l = e(27.5, 20); return new Set(l.map(x => x.split('x')[0])).size === l.length; })());
  ok('le pas par defaut est l increment du carnet (2,5 kg)',
     TS.seriesEchauffement(81, 20).every(s => Math.abs(s.poids / 2.5 - Math.round(s.poids / 2.5)) < 1e-9));
}

// ---------------------------------------------------------------- 25
titre('Charger la barre');
{
  const cote = (c, b) => TS.chargerBarre(c, b).parCote;
  egal('100 kg sur une barre olympique : 25 + 15 de chaque cote', cote(100, 20), [25, 15]);
  egal('82,5 kg descend jusqu au 1,25', cote(82.5, 20), [25, 5, 1.25]);
  egal('140 kg empile deux 25', cote(140, 20), [25, 25, 10]);
  egal('la barre seule ne demande aucun disque', cote(20, 20), []);
  egal('une barre de 15 kg change tout le calcul', cote(47.5, 15), [15, 1.25]);
  // Le minimum de disques, pas n importe quelle combinaison juste : c est ce
  // qu on porte a la main.
  ok('le glouton prend le moins de disques possible', cote(60, 20).length === 1);
  // Ce qui ne se charge pas doit etre DIT, pas arrondi en silence.
  const sous = TS.chargerBarre(15, 20);
  ok('une cible sous la barre est declaree impossible', sous.impossible && sous.total === 20);
  const impair = TS.chargerBarre(21.25, 20);
  egal('une cible infaisable rend l ecart, pas un faux resultat', impair.ecart, -1.25);
  egal('et elle ne sort pas un demi-disque', impair.parCote, []);
  // La virgule flottante : 2,5 + 1,25 additionnes vingt fois doivent rester
  // justes, sinon le calculateur annonce 82,4999.
  egal('les totaux restent justes au centieme', TS.chargerBarre(77.5, 20).total, 77.5);
  egal('et le detail avec', TS.chargerBarre(77.5, 20).parCote, [25, 2.5, 1.25]);
  // Un pas de 2,5 kg au total : 78,75 n existe pas avec des disques par paire.
  egal('une cible entre deux pas est annoncee en dessous', TS.chargerBarre(78.75, 20).ecart, -1.25);
  // Un jeu de disques reduit — une petite salle, des disques pris.
  egal('on peut lui donner les disques qu on a vraiment',
    TS.chargerBarre(100, 20, [20, 10, 5]).parCote, [20, 20]);
  egal('et il dit alors ce qui manque', TS.chargerBarre(100, 20, [20, 10, 5]).ecart, 0);
  egal('les disques sont tries meme donnes en desordre',
    TS.chargerBarre(100, 20, [5, 20, 10]).parCote, [20, 20]);
}

// ----------------------------------------------------------------
titre('Relire le tableur exporte');
{
  const csv = '\ufeffDate;Jour;Exercice;Groupe;Serie;Poids (kg);Repetitions;RPE;Repos (s);Volume (kg);Fait\r\n'
    + '2026-09-01;Lundi;Développé couché;Pectoraux;1;82,5;6;8;120;495;oui\r\n'
    + '2026-09-01;Lundi;Développé couché;Pectoraux;2;82,5;5;9,5;120;412,5;non\r\n'
    + '2026-09-01;Lundi;Planche;Abdos;1;;45 s;7;60;;oui\r\n'
    + "2026-09-02;Mardi;'-Poulie basse;Dos;1;40;12;;;480;oui\r\n"
    + '2026-09-02;Mardi;"Curl ""marteau""";Bras;1;14;10;;;140;oui\r\n';
  const r = TS.lireCsvCarnet(csv);
  egal('deux jours lus', Object.keys(r.sessions), ['2026-09-01', '2026-09-02']);
  const j1 = r.sessions['2026-09-01'].exercises;
  egal('deux series du meme exercice restent ensemble', j1.map(e => e.series.length), [2, 1]);
  egal('la virgule decimale est lue', j1[0].series[0].poids, 82.5);
  egal('le RPE decimal aussi', j1[0].series[1].rpe, 9.5);
  egal('fait oui/non', j1[0].series.map(x => x.fait), [true, false]);
  egal('une planche garde sa duree', j1[1].series[0].reps, '45 s');
  egal('l apostrophe anti-formule est retiree', r.sessions['2026-09-02'].exercises[0].nom, '-Poulie basse');
  egal('les guillemets doubles sont relus', r.sessions['2026-09-02'].exercises[1].nom, 'Curl "marteau"');
  egal('cinq series en tout', r.series, 5);

  const excel = 'Date,Exercice,Serie,Poids (kg),Repetitions\n10/09/2026,Squat,1,100,5\n10/09/2026,Squat,1,100,5\n';
  const rx = TS.lireCsvCarnet(excel);
  egal('Excel : virgules et dates JJ/MM/AAAA', Object.keys(rx.sessions), ['2026-09-10']);
  egal('une serie qui repart a 1 ouvre un nouvel exercice',
    rx.sessions['2026-09-10'].exercises.length, 2);
  ok('un tableur etranger est refuse avec une raison',
    typeof TS.lireCsvCarnet('Nom;Age\nPaul;30\n').erreur === 'string');
  ok('un tableur vide aussi', typeof TS.lireCsvCarnet('').erreur === 'string');

  // Le commentaire : derniere colonne de l'export, celui de la serie de la ligne.
  const avecNote = 'Date;Exercice;Serie;Poids (kg);Repetitions;Fait;Commentaire\r\n'
    + '2026-09-03;Squat;1;100;5;oui;\r\n'
    + '2026-09-03;Squat;2;100;5;oui;Assistée\r\n'
    + '2026-09-03;Curl;1;12;10;oui;\r\n'
    + '2026-09-03;Rowing;1;60;8;oui;\r\n'
    + "2026-09-03;Rowing;2;60;8;oui;'-10 % de charge, fatigué\r\n";
  const rn = TS.lireCsvCarnet(avecNote).sessions['2026-09-03'].exercises;
  egal('le commentaire est relu sur sa serie', rn[0].series.map(s => s.note), [undefined, 'Assistée']);
  ok('une serie sans commentaire n en porte pas', !('note' in rn[0].series[0]) && !('note' in rn[1].series[0]));
  ok('l exercice lui-meme n en porte plus', rn.every(e => !('note' in e)));
  egal('le commentaire perd son apostrophe de protection', rn[2].series[1].note, '-10 % de charge, fatigué');
  ok('un ancien export, sans la colonne, se relit sans commentaire',
     r.sessions['2026-09-01'].exercises.every(e => e.series.every(s => !('note' in s))));
}

// ----------------------------------------------------------------
titre('Les modeles de carnet publies sur /outils se reimportent');
{
  // La page /outils/modele-carnet-musculation promet qu'un tableur rempli se
  // réimporte dans Top Set : on relit les fichiers réellement publiés.
  const lire = f => readFileSync(join(ICI, '..', 'outils', f), 'utf8');
  const exemple = TS.lireCsvCarnet(lire('exemple-carnet-musculation.csv'));
  ok('l exemple se lit sans erreur', !exemple.erreur, exemple.erreur);
  egal('deux seances', Object.keys(exemple.sessions || {}), ['2026-09-07', '2026-09-10']);
  egal('dix-neuf series', exemple.series, 19);
  const lundi = exemple.sessions['2026-09-07'].exercises;
  egal('trois exercices le lundi, dans l ordre', lundi.map(e => e.nom), ['Squat', 'Développé couché', 'Planche']);
  egal('le groupe musculaire est reconnu', lundi.map(e => e.groupe), ['Jambes', 'Pectoraux', 'Abdos']);
  egal('le RPE a demi-point est lu', lundi[0].series[2].rpe, 7.5);
  egal('la planche garde sa duree', lundi[2].series[0].reps, '60 s');
  egal('le commentaire de l exemple est relu, sur la derniere serie',
       lundi[1].series.map(s => s.note || ''), ['', '', '', 'Dernière série assistée']);
  // « Exactement le format de l'export » : les colonnes sont relues dans
  // app.js, pas recopiees ici — sinon le test suivrait le modele, pas l'app.
  const src = readFileSync(join(ICI, '..', 'app.js'), 'utf8');
  const colonnes = JSON.parse(src.match(/var CSV_COLONNES = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
  for (const f of ['modele-carnet-musculation.csv', 'exemple-carnet-musculation.csv']) {
    const entete = lire(f).replace(/^﻿/, '').split(/\r?\n/)[0];
    egal(f + ' a les colonnes de l export, dans l ordre', entete, colonnes.join(';'));
  }
  const cardio = TS.lireCsvCarnet('Date;Exercice;Serie;Poids (kg);Repetitions;Fait;Commentaire;Vitesse (km/h);Inclinaison (%)\r\n'
    + '2026-09-14;Tapis de course;1;;1500 s;oui;;10,5;6\r\n2026-09-14;Tapis de course;2;;600 s;oui;;;\r\n');
  const sc = cardio.sessions['2026-09-14'].exercises[0].series;
  egal('le cardio relit sa duree', sc[0].reps, '1500 s');
  egal('la vitesse moyenne est relue, virgule comprise', sc[0].vitesse, 10.5);
  egal('l inclinaison moyenne est relue', sc[0].inclinaison, 6);
  ok('une serie sans vitesse n en porte pas', !('vitesse' in sc[1]) && !('inclinaison' in sc[1]));
  egal('le tableur d exemple garde ses dix-neuf series avec les colonnes du cardio',
       TS.lireCsvCarnet(lire('exemple-carnet-musculation.csv')).series, 19);
  const vierge = TS.lireCsvCarnet(lire('modele-carnet-musculation.csv'));
  ok('le modele vierge a les colonnes attendues (vide, donc refuse avec une raison)',
     typeof vierge.erreur === 'string' && /vide/i.test(vierge.erreur), vierge.erreur);
}

// ----------------------------------------------------------------
titre('Regularite, comptee en semaines (16/11/2026)');
{
  const AUJ = '2026-11-18'; // un mercredi : la semaine va du 16 au 22
  const deuxTenues = ['2026-11-02', '2026-11-04', '2026-11-06', '2026-11-09', '2026-11-11', '2026-11-13', '2026-11-16'];
  const r = TS.regularite(deuxTenues, 3, AUJ);
  egal('une seance cette semaine, deux a faire', [r.cetteSemaine, r.reste], [1, 2]);
  egal('la semaine en cours ne casse pas la serie', r.serie, 2);
  egal('huit semaines, la derniere en cours, du lundi', [r.semaines.length, r.semaines[7].lundi, r.semaines[7].enCours, r.semaines[6].tenue], [8, '2026-11-16', true, true]);
  const tenue = TS.regularite(deuxTenues.concat(['2026-11-17', '2026-11-18']), 3, AUJ);
  egal('la semaine en cours compte des qu elle est tenue', [tenue.serie, tenue.reste], [3, 0]);
  const ratee = TS.regularite(['2026-10-26', '2026-10-28', '2026-10-30', '2026-11-02', '2026-11-04', '2026-11-06', '2026-11-09', '2026-11-11'], 3, AUJ);
  egal('une semaine ratee remet la serie a zero, la meilleure reste', [ratee.serie, ratee.meilleure], [0, 2]);
  egal('un jour en double, une date future ou illisible ne comptent pas',
       TS.regularite(['2026-11-16', '2026-11-16', '2026-11-20', 'hier', null], 3, AUJ).cetteSemaine, 1);
  egal('l objectif reste entre 1 et 7', [TS.regularite([], 9, AUJ).objectif, TS.regularite([], 0, AUJ).objectif, TS.regularite([], '2', AUJ).objectif], [7, 3, 2]);
  egal('sans seance, tout est a zero', (({ cetteSemaine, serie, meilleure }) => [cetteSemaine, serie, meilleure])(TS.regularite([], 3, AUJ)), [0, 0, 0]);
  egal('le 31 decembre et le 1er janvier sont dans la meme semaine',
       TS.regularite(['2026-12-31', '2027-01-01'], 2, '2027-01-02').semaines[7], { lundi: '2026-12-28', seances: 2, tenue: true, enCours: true });
  egal('un objectif d une seance : chaque semaine faite compte',
       TS.regularite(['2026-11-03', '2026-11-12'], 1, AUJ).serie, 2);
}

// ----------------------------------------------------------------
titre('Sur une periode : progression et records battus (16/11/2026)');
{
  const jj = (date, ...series) => ({ date, series });
  const dc = [jj('2026-03-01', s(80, '10')), jj('2026-01-10', s(40, '10', { type: 'echauffement' }), s(80, '8')), jj('2026-11-18', s(90, '8'))];
  const p = TS.progressionTopSet(dc);
  egal('la premiere et la derniere seance, dans l ordre des dates', [p.debut.date, p.fin.date], ['2026-01-10', '2026-11-18']);
  egal('le gain se lit sur le 1RM estime', p.gain, 12.5);
  egal('une seule seance chiffree : pas de progression', TS.progressionTopSet([jj('2026-01-10', s(80, '8')), jj('2026-02-10', s(null, '12'))]), null);
  egal('au temps : pas de progression', TS.progressionTopSet([jj('2026-01-10', s(null, '1:00')), jj('2026-02-10', s(null, '1:30'))]), null);
  const sq = [jj('2025-12-20', s(100, '5')), jj('2026-01-05', s(60, '5', { type: 'echauffement' }), s(102.5, '5'), s(105, '3')),
              jj('2026-02-01', s(105, '5')), jj('2026-03-01', s(140, '1', { type: 'echauffement' }), s(100, '5')), jj('2026-04-01', s(110, '3'))];
  egal('deux seances battent le record en 2026 ; une seance compte une fois ; l echauffement et l egalite ne comptent pas',
       TS.recordsBattus(sq, '2026-01-01', '2026-12-31'), 2);
  egal('la toute premiere fois n est pas un record', TS.recordsBattus([jj('2026-01-05', s(100, '5'))], '2026-01-01', '2026-12-31'), 0);
  egal('un record d avant la periode ne compte pas, mais sert de reference',
       TS.recordsBattus([jj('2025-05-01', s(90, '5')), jj('2025-06-01', s(95, '5')), jj('2026-02-01', s(94, '5'))], '2026-01-01', '2026-12-31'), 0);
}

// ----------------------------------------------------------------
console.log('\n== Poids du corps (16/11/2026) ==');
{
  const P = [{ date: '2026-09-01', poids: 84 }, { date: '2026-10-01', poids: 82.6 }, { date: '2026-10-20', poids: 82 },
             { date: '2026-11-03', poids: 81.4 }, { date: '2026-11-10', poids: 81.9 },
             { date: '2026-11-12', poids: 0 }, { date: 'hier', poids: 80 }, { date: '2026-11-13', poids: 81, supprime: true }];
  egal('la pesee la plus proche, apres comme avant', TS.peseeProche(P, '2026-11-05').date, '2026-11-03');
  egal('a egalite de distance, celle d avant', TS.peseeProche([{ date: '2026-11-01', poids: 80 }, { date: '2026-11-05', poids: 82 }], '2026-11-03').poids, 80);
  egal('rien a moins de 90 jours : pas de pesee', TS.peseeProche(P, '2027-06-01'), null);
  egal('la limite se regle', TS.peseeProche(P, '2026-11-20', 5), null);
  egal('un poids nul, une date illisible, une pierre tombale sont ignores', TS.peseeProche(P, '2026-11-13').date, '2026-11-10');
  egal('120 kg pour 80 kg : 1,5 fois', TS.forceRelative(120, 80), 1.5);
  egal('arrondi au centieme', TS.forceRelative(100, 81.4), 1.23);
  egal('sans poids du corps : rien', TS.forceRelative(100, null), null);
  const e = TS.evolutionPoids(P, '2026-11-01', '2026-11-30');
  egal('le dernier de la periode', e.dernier.poids, 81.9);
  egal('compare au dernier d avant la periode', e.reference.date, '2026-10-20');
  egal('l ecart au dixieme', e.ecart, -0.1);
  egal('les points de la periode, dans l ordre', e.points.join(','), '81.4,81.9');
  const vide = TS.evolutionPoids(P, '2026-12-01', '2026-12-31');
  egal('une periode sans pesee n a ni dernier ni ecart', vide.dernier === null && vide.ecart === null, true);
  egal('mais garde la derniere connue', vide.dernierConnu.poids, 81.9);
  const debut = TS.evolutionPoids(P.slice(0, 2), '2026-01-01', '2026-12-31');
  egal('sans rien avant : compare a la premiere de la periode', debut.ecart, -1.4);
  egal('une seule pesee : pas d ecart', TS.evolutionPoids([{ date: '2026-11-03', poids: 81 }], '2026-11-01', '2026-11-30').ecart, null);
}
// ----------------------------------------------------------------
console.log('\n== Le materiel d un exercice (16/11/2026) ==');
{
  const o = n => TS.outilParDefaut(n).outil;
  egal('un developpe couche est a la barre, de 20 kg', JSON.stringify(TS.outilParDefaut('Développé couché')), '{"outil":"barre","barre":20}');
  egal('aux halteres des que le nom le dit', o('Développé incliné haltères'), 'halteres');
  egal('le curl marteau et les elevations laterales aussi', o('Curl marteau') + ' ' + o('Élévations latérales'), 'halteres halteres');
  egal('un seul haltere pour le goblet squat', o('Goblet squat'), 'haltere');
  egal('l ecarte a la poulie est un vis-a-vis, pas une poulie', o('Écarté à la poulie') + ' ' + o('Cable crossover'), 'visavis visavis');
  egal('les poulies et les machines a pile', [o('Tirage vertical'), o('Extension triceps poulie haute'), o('Leg curl'), o('Adducteurs à la machine'), o('Pec deck')].join(' '), 'pile pile pile pile pile');
  egal('le smith reste une barre, malgre « machine »', o('Développé couché Smith machine'), 'barre');
  egal('la presse et le hack squat sont des machines a disques', o('Presse à cuisses') + ' ' + o('Hack squat'), 'machine machine');
  egal('dips et tractions : au poids du corps, avec ou sans lest', o('Dips') + ' ' + o('Tractions lestées'), 'lest lest');
  egal('la barre EZ part a 10 kg', TS.outilParDefaut('Curl barre EZ').barre + ' ' + TS.outilParDefaut('Barre au front').barre, '10 10');
  egal('un nom inconnu reste a la barre', o('Mon exercice maison'), 'barre');
  egal('la barre : les disques par cote, comme avant', TS.chargerOutil(100, 'barre', 20).parCote.join('+'), '25+15');
  const h = TS.chargerOutil(20, 'halteres');
  egal('20 kg aux halteres : deux de 10', h.nombre + 'x' + h.parUnite, '2x10');
  egal('note par main : deux de 20, 40 en tout', TS.chargerOutil(20, 'halteres-main').total, 40);
  egal('5 kg au vis-a-vis : 2,5 de chaque cote', TS.chargerOutil(5, 'visavis').parUnite, 2.5);
  egal('par bras : 5 de chaque cote, 10 en tout', TS.chargerOutil(5, 'visavis-bras').total, 10);
  egal('une machine a disques n a pas de barre a retirer', TS.chargerOutil(100, 'machine').parCote.join('+'), '25+25');
  const l = TS.chargerOutil(17.5, 'lest');
  egal('17,5 kg de lest : 15 + 2,5 a la ceinture', l.disques.join('+') + ' ' + l.ecart, '15+2.5 0');
  egal('le lest qui ne se fait pas pile le dit', TS.chargerOutil(1, 'lest').ecart, -1);
  egal('sans lest : au poids du corps', TS.chargerOutil(0, 'lest').disques.length, 0);
  egal('la pile : rien a calculer, le poids tel quel', TS.chargerOutil(35, 'pile').total, 35);
  egal('un outil inconnu retombe sur la barre', TS.chargerOutil(60, 'trampoline', 20).outil, 'barre');
}
// ----------------------------------------------------------------
console.log('\n' + '='.repeat(52));
if (echecs.length) {
  console.log(passes + ' tests passes, ' + echecs.length + ' ECHEC(S) :');
  echecs.forEach(e => console.log('  - ' + e));
  process.exit(1);
}
console.log(passes + ' tests passes, 0 echec.');
