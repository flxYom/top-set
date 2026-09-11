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

  // Le commentaire : derniere colonne de l'export, repetee sur chaque serie.
  const avecNote = 'Date;Exercice;Serie;Poids (kg);Repetitions;Fait;Commentaire\r\n'
    + '2026-09-03;Squat;1;100;5;oui;Dernière assistée\r\n'
    + '2026-09-03;Squat;2;100;5;oui;Dernière assistée\r\n'
    + '2026-09-03;Curl;1;12;10;oui;\r\n'
    + '2026-09-03;Rowing;1;60;8;oui;\r\n'
    + "2026-09-03;Rowing;2;60;8;oui;'-10 % de charge, fatigué\r\n";
  const rn = TS.lireCsvCarnet(avecNote).sessions['2026-09-03'].exercises;
  egal('le commentaire est relu, une fois par exercice', rn[0].note, 'Dernière assistée');
  ok('un exercice sans commentaire n en porte pas', !('note' in rn[1]));
  egal('un commentaire ecrit sur une seule serie suffit, et perd son apostrophe', rn[2].note, '-10 % de charge, fatigué');
  ok('un ancien export, sans la colonne, se relit sans commentaire',
     r.sessions['2026-09-01'].exercises.every(e => !('note' in e)));
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
  egal('le commentaire de l exemple est relu', lundi[1].note, 'Dernière série assistée');
  // « Exactement le format de l'export » : les colonnes sont relues dans
  // app.js, pas recopiees ici — sinon le test suivrait le modele, pas l'app.
  const src = readFileSync(join(ICI, '..', 'app.js'), 'utf8');
  const colonnes = JSON.parse(src.match(/var CSV_COLONNES = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
  for (const f of ['modele-carnet-musculation.csv', 'exemple-carnet-musculation.csv']) {
    const entete = lire(f).replace(/^﻿/, '').split(/\r?\n/)[0];
    egal(f + ' a les colonnes de l export, dans l ordre', entete, colonnes.join(';'));
  }
  const vierge = TS.lireCsvCarnet(lire('modele-carnet-musculation.csv'));
  ok('le modele vierge a les colonnes attendues (vide, donc refuse avec une raison)',
     typeof vierge.erreur === 'string' && /vide/i.test(vierge.erreur), vierge.erreur);
}

// ----------------------------------------------------------------
console.log('\n' + '='.repeat(52));
if (echecs.length) {
  console.log(passes + ' tests passes, ' + echecs.length + ' ECHEC(S) :');
  echecs.forEach(e => console.log('  - ' + e));
  process.exit(1);
}
console.log(passes + ' tests passes, 0 echec.');
