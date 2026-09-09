/* Top Set — logique metier.
 *
 * Ce fichier ne connait ni le DOM, ni localStorage, ni Supabase. Toutes les
 * fonctions sont pures : memes entrees, memes sorties, aucun effet de bord.
 * C'est la seule facon de les tester ailleurs que dans un navigateur — le
 * reste de l'application vit dans une balise <script> et n'est pas importable.
 *
 * Charge par index.html (global TS) et par les tests Node (module.exports).
 */
(function (racine, fabrique) {
  var api = fabrique();
  if (typeof module === 'object' && module && module.exports) module.exports = api;
  else racine.TS = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ------------------------------------------------------------------
  // Types de serie
  // ------------------------------------------------------------------
  // Les quatre valeurs viennent du vocabulaire reel de la salle. Une serie
  // sans type est traitee comme une charge de travail : c'est le cas le plus
  // frequent, et surtout c'est l'etat de toutes les series enregistrees avant
  // l'existence de ce champ. Aucune donnee ancienne n'est reinterpretee a la
  // baisse.
  var TYPES = {
    ECHAUFFEMENT: 'echauffement',
    TOP: 'top',
    TRAVAIL: 'travail',
    BACKOFF: 'backoff'
  };
  var TYPES_VALIDES = [TYPES.ECHAUFFEMENT, TYPES.TOP, TYPES.TRAVAIL, TYPES.BACKOFF];

  function typeSerie(s) {
    var t = s && s.type;
    return TYPES_VALIDES.indexOf(t) > -1 ? t : TYPES.TRAVAIL;
  }

  // ------------------------------------------------------------------
  // Lecture des valeurs saisies
  // ------------------------------------------------------------------
  // Le champ reps est du texte libre : « 8 », « 8-10 », « AMRAP », « 12+ ».
  // On lit le premier entier rencontre, c'est-a-dire la borne garantie d'une
  // fourchette. Mieux vaut sous-estimer une performance que la gonfler.
  function nombreReps(reps) {
    if (typeof reps === 'number') return isFinite(reps) && reps > 0 ? reps : null;
    var m = String(reps == null ? '' : reps).match(/\d+([.,]\d+)?/);
    if (!m) return null;
    var n = parseFloat(m[0].replace(',', '.'));
    return isFinite(n) && n > 0 ? n : null;
  }

  function poidsDe(s) {
    var p = s && s.poids;
    return (typeof p === 'number' && isFinite(p)) ? p : null;
  }

  // Une serie compte des qu'un poids OU des reps sont saisis. Une serie
  // ajoutee puis jamais remplie ne doit rien changer aux statistiques.
  // On teste le TEXTE des reps, pas sa valeur numerique : « AMRAP » au poids
  // du corps est une serie faite, et la faire disparaitre des statistiques
  // serait un mensonge.
  function serieRemplie(s) {
    if (poidsDe(s) !== null) return true;
    var r = s && s.reps;
    return r != null && String(r).trim() !== '';
  }

  function rpeDe(s) {
    var r = s && s.rpe;
    return (typeof r === 'number' && isFinite(r)) ? r : null;
  }

  // ------------------------------------------------------------------
  // Volume
  // ------------------------------------------------------------------
  // Definition deja en place dans l'application : poids x reps, et seulement
  // quand les deux sont renseignes. On ne devine pas une valeur manquante, et
  // on ne cree surtout pas une deuxieme definition du volume.
  function volumeSerie(s) {
    var p = poidsDe(s), r = nombreReps(s && s.reps);
    if (p === null || r === null) return 0;
    return p * r;
  }

  function volumeTotal(series) {
    return (series || []).reduce(function (t, s) { return t + volumeSerie(s); }, 0);
  }

  // ------------------------------------------------------------------
  // 1RM estime — formule d'Epley
  // ------------------------------------------------------------------
  // 1RM = poids x (1 + reps / 30). C'est une ESTIMATION, jamais une charge
  // reellement soulevee : l'interface doit toujours ecrire « 1RM estime ».
  // Au-dela d'une dizaine de repetitions la formule derive nettement, donc on
  // refuse de repondre plutot que de rendre un chiffre trompeur.
  var REPS_MAX_FIABLE = 12;

  function epley(poids, reps) {
    if (typeof poids !== 'number' || !isFinite(poids) || poids <= 0) return null;
    var r = nombreReps(reps);
    if (r === null || r > REPS_MAX_FIABLE) return null;
    return Math.round(poids * (1 + r / 30) * 100) / 100;
  }

  function epleySerie(s) {
    return s ? epley(poidsDe(s), s.reps) : null;
  }

  // ------------------------------------------------------------------
  // Top set
  // ------------------------------------------------------------------
  // Definition retenue, conforme a l'usage courant en force athletique : le
  // top set est la serie la plus lourde de la journee sur cet exercice, hors
  // echauffement et hors back-off — un back-off est par definition une serie
  // allegee EFFECTUEE APRES le top set, il ne peut donc pas en etre un.
  //
  // Trois departages, dans cet ordre :
  //   1. le poids le plus eleve ;
  //   2. a poids egal, le plus de repetitions ;
  //   3. a repetitions egales, le RPE le plus bas — meme performance pour
  //      moins d'effort, c'est la meilleure des deux.
  //
  // Une serie explicitement etiquetee « top set » par l'utilisateur l'emporte
  // toujours sur le calcul : c'est lui qui sait ce qu'il a voulu faire. S'il
  // en a etiquete plusieurs, on departage entre elles avec les memes regles.
  //
  // Sans aucun poids (poids du corps), on retombe sur le plus grand nombre de
  // repetitions.
  function meilleureSerie(candidates) {
    var pesees = candidates.filter(function (s) { return poidsDe(s) !== null && poidsDe(s) > 0; });
    var lot = pesees.length ? pesees : candidates;
    return lot.reduce(function (a, b) {
      var pa = poidsDe(a) || 0, pb = poidsDe(b) || 0;
      if (pb !== pa) return pb > pa ? b : a;
      var ra = nombreReps(a.reps) || 0, rb = nombreReps(b.reps) || 0;
      if (rb !== ra) return rb > ra ? b : a;
      var ea = rpeDe(a), eb = rpeDe(b);
      if (ea === null && eb === null) return a;
      if (ea === null) return b;
      if (eb === null) return a;
      return eb < ea ? b : a;
    });
  }

  function calculerTopSet(series) {
    var remplies = (series || []).filter(serieRemplie);
    if (!remplies.length) return null;

    var declares = remplies.filter(function (s) { return typeSerie(s) === TYPES.TOP; });
    if (declares.length) return meilleureSerie(declares);

    var candidates = remplies.filter(function (s) {
      var t = typeSerie(s);
      return t !== TYPES.ECHAUFFEMENT && t !== TYPES.BACKOFF;
    });
    // Une seance entierement etiquetee echauffement ou back-off n'a pas de top
    // set. Repondre « null » est plus honnete que de designer un echauffement.
    if (!candidates.length) return null;
    return meilleureSerie(candidates);
  }

  // ------------------------------------------------------------------
  // Records personnels
  // ------------------------------------------------------------------
  // Un record est un poids strictement superieur a tout autre poids logue sur
  // cet exercice, echauffements exclus — soulever 40 kg en echauffement n'est
  // pas une performance.
  function meilleurPoids(seances) {
    var best = null;
    (seances || []).forEach(function (j) {
      (j.series || []).forEach(function (s) {
        if (typeSerie(s) === TYPES.ECHAUFFEMENT) return;
        var p = poidsDe(s);
        if (p !== null && p > 0 && (best === null || p > best)) best = p;
      });
    });
    return best;
  }

  // Records par fourchette de repetitions : le poids le plus lourd jamais
  // souleve pour AU MOINS n repetitions. « Au moins » et non « exactement » :
  // une serie de 8 prouve qu'on sait faire 5, l'inverse est faux.
  var FOURCHETTES = [1, 3, 5, 8, 10, 12];

  function recordsParReps(seances, fourchettes) {
    var seuils = fourchettes || FOURCHETTES;
    var out = [];
    seuils.forEach(function (n) {
      var best = null, quand = null;
      (seances || []).forEach(function (j) {
        (j.series || []).forEach(function (s) {
          if (typeSerie(s) === TYPES.ECHAUFFEMENT) return;
          var p = poidsDe(s), r = nombreReps(s.reps);
          if (p === null || p <= 0 || r === null || r < n) return;
          if (best === null || p > best) { best = p; quand = j.date || null; }
        });
      });
      if (best !== null) out.push({ reps: n, poids: best, date: quand });
    });
    return out;
  }

  // ------------------------------------------------------------------
  // Performance precedente
  // ------------------------------------------------------------------
  // `seances` : [{ date:'YYYY-MM-DD', series:[...] }], dans n'importe quel
  // ordre. On rend la derniere seance strictement anterieure a `avant` qui
  // contienne au moins une serie remplie — avec TOUTES ses series, pas
  // seulement la meilleure : l'utilisateur veut revoir sa progression serie
  // par serie, pas un resume.
  function performancePrecedente(seances, avant) {
    var candidates = (seances || []).filter(function (j) {
      if (!j || !j.date) return false;
      if (avant && j.date >= avant) return false;
      return (j.series || []).some(serieRemplie);
    });
    if (!candidates.length) return null;
    var j = candidates.reduce(function (a, b) { return b.date > a.date ? b : a; });
    var series = (j.series || []).filter(serieRemplie);
    var top = calculerTopSet(series);
    return {
      date: j.date,
      series: series,
      topSet: top,
      volume: volumeTotal(series),
      rmEstime: epleySerie(top)
    };
  }

  // ------------------------------------------------------------------
  // Signal d'entrainement
  // ------------------------------------------------------------------
  // On compare le 1RM estime du top set d'une seance a l'autre : c'est la
  // seule mesure qui reste comparable quand le nombre de repetitions change
  // d'une fois sur l'autre. Comparer les poids bruts ferait passer
  // « 70 x 8 » pour un recul apres « 75 x 3 », alors que c'est un progres.
  //
  // Trois seances minimum : une mauvaise journee ne doit jamais declencher
  // une alerte. La tolerance de 1 % absorbe le bruit de la formule.
  var SEANCES_MINI = 3;
  var TOLERANCE = 0.01;
  var SEANCES_STAGNATION = 4;

  function pointsTopSet(seances) {
    return (seances || [])
      .filter(function (j) { return j && j.date; })
      .slice()
      .sort(function (a, b) { return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); })
      .map(function (j) {
        var top = calculerTopSet(j.series || []);
        var rm = epleySerie(top);
        return rm === null ? null : { date: j.date, valeur: rm, topSet: top };
      })
      .filter(Boolean);
  }

  function detecterSignal(seances) {
    var pts = pointsTopSet(seances);
    if (pts.length < SEANCES_MINI) {
      return {
        signal: 'insufficient_data',
        seances: pts.length,
        manquantes: SEANCES_MINI - pts.length,
        raison: pts.length
          ? 'Seulement ' + pts.length + ' séance' + (pts.length > 1 ? 's' : '') + ' avec un top set mesurable.'
          : 'Aucune séance avec un top set mesurable.'
      };
    }
    var fenetre = pts.slice(-SEANCES_STAGNATION);
    var recents = pts.slice(-SEANCES_MINI);
    var debut = recents[0].valeur, fin = recents[recents.length - 1].valeur;
    var variation = debut > 0 ? (fin - debut) / debut : 0;
    var base = {
      seances: recents.length,
      debut: debut,
      fin: fin,
      variation: Math.round(variation * 1000) / 10,
      du: recents[0].date,
      au: recents[recents.length - 1].date
    };

    if (variation > TOLERANCE) {
      base.signal = 'progressing';
      base.raison = 'Ton top set a progressé sur les ' + recents.length + ' dernières séances.';
      return base;
    }
    if (variation < -TOLERANCE) {
      base.signal = 'declining';
      base.raison = 'Ton top set baisse depuis ' + recents.length + ' séances.';
      return base;
    }
    // Plat depuis longtemps, ou simplement plat : ce n'est pas la meme
    // information, et « stagnation » est un mot trop lourd pour trois seances.
    var platLong = fenetre.length >= SEANCES_STAGNATION && (function () {
      var d = fenetre[0].valeur, f = fenetre[fenetre.length - 1].valeur;
      var v = d > 0 ? (f - d) / d : 0;
      return Math.abs(v) <= TOLERANCE;
    })();
    base.signal = platLong ? 'stagnating' : 'stable';
    base.seances = platLong ? fenetre.length : recents.length;
    base.raison = platLong
      ? 'Ton top set n’a pas bougé depuis ' + fenetre.length + ' séances.'
      : 'Ton top set est stable depuis ' + recents.length + ' séances.';
    return base;
  }

  // ------------------------------------------------------------------
  // Cible suggeree
  // ------------------------------------------------------------------
  // Une suggestion, jamais une consigne. Elle n'apparait que si les donnees
  // la justifient, et elle porte toujours la raison qui l'a produite.
  //
  // Regles, lues sur le RPE du dernier top set :
  //   RPE <= 8    la serie restait accessible  -> +1 increment
  //   RPE 8.5-9   proche de la limite          -> on repete pour consolider
  //   RPE >= 9.5  effort maximal               -> meme charge, une rep de moins
  //   pas de RPE  on s'appuie sur la tendance  -> +1 increment si ca progresse
  var INCREMENT = 2.5;

  function suggererCible(seances, increment) {
    var pas = (typeof increment === 'number' && increment > 0) ? increment : INCREMENT;
    var prec = performancePrecedente(seances, null);
    if (!prec || !prec.topSet) return null;

    var top = prec.topSet;
    var poids = poidsDe(top);
    var reps = nombreReps(top.reps);
    if (poids === null || poids <= 0 || reps === null) return null;

    var rpe = rpeDe(top);
    var sig = detecterSignal(seances);

    if (rpe === null) {
      if (sig.signal !== 'progressing') return null;
      return {
        poids: Math.round((poids + pas) * 100) / 100,
        reps: reps,
        base: { poids: poids, reps: reps, rpe: null, date: prec.date },
        raison: 'Pas de RPE noté, mais ton top set progresse : une petite hausse est raisonnable.'
      };
    }
    if (rpe <= 8) {
      return {
        poids: Math.round((poids + pas) * 100) / 100,
        reps: reps,
        base: { poids: poids, reps: reps, rpe: rpe, date: prec.date },
        raison: 'RPE ' + rpe + ' la dernière fois : il restait de la marge.'
      };
    }
    if (rpe <= 9) {
      return {
        poids: poids,
        reps: reps,
        base: { poids: poids, reps: reps, rpe: rpe, date: prec.date },
        raison: 'RPE ' + rpe + ' la dernière fois : même charge pour consolider.'
      };
    }
    return {
      poids: poids,
      reps: Math.max(1, reps - 1),
      repsHaut: reps,
      base: { poids: poids, reps: reps, rpe: rpe, date: prec.date },
      raison: 'RPE ' + rpe + ' la dernière fois : on ne monte pas après un effort maximal.'
    };
  }

  return {
    TYPES: TYPES,
    TYPES_VALIDES: TYPES_VALIDES,
    FOURCHETTES: FOURCHETTES,
    INCREMENT: INCREMENT,
    typeSerie: typeSerie,
    nombreReps: nombreReps,
    serieRemplie: serieRemplie,
    volumeSerie: volumeSerie,
    volumeTotal: volumeTotal,
    epley: epley,
    epleySerie: epleySerie,
    calculerTopSet: calculerTopSet,
    meilleurPoids: meilleurPoids,
    recordsParReps: recordsParReps,
    performancePrecedente: performancePrecedente,
    pointsTopSet: pointsTopSet,
    detecterSignal: detecterSignal,
    suggererCible: suggererCible
  };
});
