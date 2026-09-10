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
  // Exercices au temps : gainage, planche, chaise...
  // ------------------------------------------------------------------
  // Une serie tenue se mesure en secondes, pas en repetitions. La duree vit
  // dans le champ reps, ecrite avec son unite : « 45 s ». Le champ est deja
  // du texte libre, donc la base, la synchro, la sauvegarde et le tableur la
  // transportent sans qu'aucun format change — et « 45 s » se lit tel quel
  // partout, y compris sur un telephone qui n'a pas encore cette version.
  //
  // L'unite est obligatoire : « 45 » tout court reste 45 repetitions. Deviner
  // reinterpreterait des donnees existantes, et ce n'est pas a l'app de
  // decider apres coup qu'une serie de pompes etait un gainage.
  function positif(n) { return (isFinite(n) && n > 0) ? n : null; }

  function dureeSecondes(txt) {
    if (txt == null || typeof txt === 'number') return null;
    var t = String(txt).trim().toLowerCase();
    if (!t) return null;
    var m = t.match(/^(\d{1,4})\s*(?:s|sec|secs|seconde|secondes|")$/);
    if (m) return positif(+m[1]);
    // « 1:30 », comme sur un chronometre.
    m = t.match(/^(\d{1,3}):([0-5]\d)$/);
    if (m) return positif(+m[1] * 60 + +m[2]);
    // « 1 min 30 », « 2 min », « 1'30 ». Pas de « m » seul : c'est aussi
    // le metre d'une poussee de traineau.
    m = t.match(/^(\d{1,3})\s*(?:min|mn|')\s*(?:([0-5]?\d)\s*(?:s|sec|")?)?$/);
    if (m) return positif(+m[1] * 60 + (m[2] ? +m[2] : 0));
    return null;
  }

  function ecrireDuree(sec) {
    var n = Math.round(Number(sec));
    return (isFinite(n) && n > 0) ? n + ' s' : '';
  }

  // « 45 s », « 1 min 30 », « 2 min » : ce qu'on dirait a voix haute.
  function formatDuree(sec) {
    var n = Math.round(Number(sec));
    if (!isFinite(n) || n <= 0) return '';
    if (n < 60) return n + ' s';
    var reste = n % 60;
    return Math.floor(n / 60) + ' min' + (reste ? ' ' + (reste < 10 ? '0' : '') + reste : '');
  }

  function serieAuTemps(s) { return dureeSecondes(s && s.reps) !== null; }

  // ------------------------------------------------------------------
  // Lecture des valeurs saisies
  // ------------------------------------------------------------------
  // Le champ reps est du texte libre : « 8 », « 8-10 », « AMRAP », « 12+ ».
  // On lit le premier entier rencontre, c'est-a-dire la borne garantie d'une
  // fourchette. Mieux vaut sous-estimer une performance que la gonfler.
  //
  // Une duree n'est PAS un nombre de repetitions : sans cette exception,
  // « 45 s » compterait pour 45 reps dans le volume et le 1RM estime.
  function nombreReps(reps) {
    if (typeof reps === 'number') return isFinite(reps) && reps > 0 ? reps : null;
    if (dureeSecondes(reps) !== null) return null;
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
      // Au temps, la meilleure serie est celle qu'on a tenue le plus longtemps.
      var da = dureeSecondes(a.reps) || 0, db = dureeSecondes(b.reps) || 0;
      if (db !== da) return db > da ? b : a;
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

  // Au temps, la courbe suit la serie la plus longue de chaque seance. Le 1RM
  // n'a aucun sens pour une planche : on compare des secondes a des secondes.
  function pointsDuree(seances) {
    return (seances || [])
      .filter(function (j) { return j && j.date; })
      .slice()
      .sort(function (a, b) { return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); })
      .map(function (j) {
        var top = calculerTopSet((j.series || []).filter(serieAuTemps));
        var sec = top ? dureeSecondes(top.reps) : null;
        return sec === null ? null : { date: j.date, valeur: sec, topSet: top };
      })
      .filter(Boolean);
  }

  // Le plus long jamais tenu, echauffements exclus.
  function meilleureDuree(seances) {
    var best = null;
    (seances || []).forEach(function (j) {
      (j.series || []).forEach(function (s) {
        if (typeSerie(s) === TYPES.ECHAUFFEMENT) return;
        var d = dureeSecondes(s.reps);
        if (d !== null && (best === null || d > best)) best = d;
      });
    });
    return best;
  }

  // Le temps passe sous tension, toutes series comprises : l'equivalent du
  // volume pour un exercice ou rien ne se souleve.
  function dureeTotale(seances) {
    var t = 0;
    (seances || []).forEach(function (j) {
      (j.series || []).forEach(function (s) { t += dureeSecondes(s.reps) || 0; });
    });
    return t;
  }

  // mode 'temps' : meme regles, mesurees sur la duree plutot que sur le 1RM.
  function detecterSignal(seances, mode) {
    var auTemps = mode === 'temps';
    var pts = auTemps ? pointsDuree(seances) : pointsTopSet(seances);
    var quoi = auTemps ? 'Ton meilleur temps' : 'Ton top set';
    if (pts.length < SEANCES_MINI) {
      var mesure = auTemps ? ' avec un temps noté.' : ' avec un top set mesurable.';
      return {
        signal: 'insufficient_data',
        seances: pts.length,
        manquantes: SEANCES_MINI - pts.length,
        raison: pts.length
          ? 'Seulement ' + pts.length + ' séance' + (pts.length > 1 ? 's' : '') + mesure
          : 'Aucune séance' + mesure
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
      base.raison = quoi + ' a progressé sur les ' + recents.length + ' dernières séances.';
      return base;
    }
    if (variation < -TOLERANCE) {
      base.signal = 'declining';
      base.raison = quoi + ' baisse depuis ' + recents.length + ' séances.';
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
      ? quoi + ' n’a pas bougé depuis ' + fenetre.length + ' séances.'
      : quoi + ' est stable depuis ' + recents.length + ' séances.';
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

  // ------------------------------------------------------------------
  // Importer sans ecraser
  // ------------------------------------------------------------------
  // Un import AJOUTE ce qui manque et ne touche jamais a ce qui est deja la.
  // Ce qui est dans le carnet est, par definition, la version la plus
  // recente : le fichier est une photo plus ancienne, ou un autre appareil.
  //
  // Deux exercices sont « le meme » s'ils portent le meme identifiant, ou le
  // meme nom avec les memes series remplies (poids et reps). La seconde regle
  // rattrape le tableur, qui n'a pas d'identifiants : reimporter deux fois le
  // meme fichier ne doit rien doubler.
  //
  // `fabrique(prefixe)` rend un identifiant neuf. Un identifiant deja pris
  // ailleurs dans le carnet est remplace : en base, un exercice est unique
  // par personne, tous jours confondus — un doublon bloquerait la synchro de
  // la journee pour toujours.
  function cleNom(nom) {
    return String(nom == null ? '' : nom).replace(/\([^)]*\)/g, '')
      .replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function signatureExo(ex) {
    return cleNom(ex && ex.nom) + '#' + ((ex && ex.series) || [])
      .filter(serieRemplie)
      .map(function (s) {
        var p = poidsDe(s);
        return (p === null ? '' : Math.round(p * 100) / 100) + '/' +
               String(s.reps == null ? '' : s.reps).trim().toLowerCase();
      }).join('|');
  }

  // Cartes a cles venues de l'exterieur : sans prototype, une cle
  // « __proto__ » ou « constructor » reste une cle comme les autres.
  function carte() { return Object.create(null); }

  function fusionnerCarnets(local, entrant, fabrique) {
    var sortie = {};
    Object.keys(local || {}).forEach(function (ds) { sortie[ds] = local[ds]; });

    var idsExo = carte(), idsSerie = carte();
    Object.keys(sortie).forEach(function (ds) {
      ((sortie[ds] && sortie[ds].exercises) || []).forEach(function (e) {
        if (e && e.id) idsExo[e.id] = 1;
        ((e && e.series) || []).forEach(function (s) { if (s && s.id) idsSerie[s.id] = 1; });
      });
    });
    function neuf(prefixe, pris) {
      var id = fabrique(prefixe);
      while (pris[id]) id = fabrique(prefixe);
      pris[id] = 1;
      return id;
    }

    var bilan = { jours: 0, exercices: 0, series: 0, titres: 0, dates: [] };

    Object.keys(entrant || {}).sort().forEach(function (ds) {
      var jourIn = entrant[ds];
      if (!jourIn || typeof jourIn !== 'object') return;
      var exosIn = (jourIn.exercises || []).filter(function (e) {
        return e && ((e.nom && String(e.nom).trim()) || (e.series || []).some(serieRemplie));
      });
      var titreIn = (typeof jourIn.titre === 'string' && jourIn.titre.trim()) ? jourIn.titre.trim() : '';

      var jourLocal = sortie[ds];
      var exosLocaux = (jourLocal && jourLocal.exercises) || [];

      // Un multi-ensemble, pas un ensemble : deux cartes « Pompes × 20 » le
      // meme jour sont deux exercices faits, et le fichier qui les contient
      // tous les deux doit pouvoir les ajouter tous les deux.
      var parSig = carte(), sigDuLocal = carte();
      exosLocaux.forEach(function (e) {
        var sig = signatureExo(e);
        parSig[sig] = (parSig[sig] || 0) + 1;
        if (e && e.id) sigDuLocal[e.id] = sig;
      });
      // D'abord les identifiants : un exercice deja la sous le meme id est
      // CE exercice-la, meme si on l'a modifie depuis l'export.
      var restants = exosIn.filter(function (e) {
        if (e.id && sigDuLocal[e.id] !== undefined) {
          parSig[sigDuLocal[e.id]]--;
          return false;
        }
        return true;
      });

      var blocs = carte(), ajoutes = [];
      restants.forEach(function (e) {
        var sig = signatureExo(e);
        if (parSig[sig] > 0) { parSig[sig]--; return; }
        var copie = {};
        Object.keys(e).forEach(function (k) { copie[k] = e[k]; });
        if (!copie.id || idsExo[copie.id]) copie.id = neuf('x', idsExo);
        else idsExo[copie.id] = 1;
        // Un superset du fichier ne doit pas fusionner avec un superset du
        // carnet qui porterait par hasard le meme identifiant de bloc.
        if (copie.bloc) {
          if (!blocs[copie.bloc]) blocs[copie.bloc] = fabrique('x');
          copie.bloc = blocs[copie.bloc];
        }
        copie.series = (e.series || []).map(function (s) {
          var cs = {};
          Object.keys(s || {}).forEach(function (k) { cs[k] = s[k]; });
          if (!cs.id || idsSerie[cs.id]) cs.id = neuf('s', idsSerie);
          else idsSerie[cs.id] = 1;
          return cs;
        });
        ajoutes.push(copie);
        bilan.exercices++;
        bilan.series += copie.series.filter(serieRemplie).length;
      });

      var ajouterTitre = titreIn && !(jourLocal && typeof jourLocal.titre === 'string' && jourLocal.titre.trim());
      if (!ajoutes.length && !ajouterTitre) return;

      var jour = { date: ds, exercises: exosLocaux.concat(ajoutes) };
      if (jourLocal && jourLocal.titre) jour.titre = jourLocal.titre;
      if (ajouterTitre) { jour.titre = titreIn.slice(0, 60); bilan.titres++; }

      // Un superset dont un seul membre est arrive n'en est plus un.
      var compte = carte();
      jour.exercises.forEach(function (e) { if (e.bloc) compte[e.bloc] = (compte[e.bloc] || 0) + 1; });
      jour.exercises = jour.exercises.map(function (e) {
        if (!e.bloc || compte[e.bloc] > 1) return e;
        var c = {};
        Object.keys(e).forEach(function (k) { if (k !== 'bloc') c[k] = e[k]; });
        return c;
      });

      if (!jourLocal) bilan.jours++;
      sortie[ds] = jour;
      bilan.dates.push(ds);
    });

    return { sessions: sortie, bilan: bilan };
  }

  // ------------------------------------------------------------------
  // Relire le tableur exporte
  // ------------------------------------------------------------------
  // Le CSV sort de l'app avec des points-virgules, la virgule decimale et une
  // ligne par serie. Excel le reenregistre parfois a sa facon : dates en
  // JJ/MM/AAAA, virgules comme separateur. Les deux se relisent.
  //
  // Rend une carte date -> { date, exercises } SANS identifiants : c'est
  // l'app qui les fabrique, avec les memes regles que pour un fichier JSON.
  function decouperCsv(texte, sep) {
    var lignes = [], ligne = [], champ = '', entre = false;
    for (var i = 0; i < texte.length; i++) {
      var c = texte[i];
      if (entre) {
        if (c === '"') {
          if (texte[i + 1] === '"') { champ += '"'; i++; }
          else entre = false;
        } else champ += c;
      } else if (c === '"') entre = true;
      else if (c === sep) { ligne.push(champ); champ = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && texte[i + 1] === '\n') i++;
        ligne.push(champ); champ = '';
        lignes.push(ligne); ligne = [];
      } else champ += c;
    }
    if (champ !== '' || ligne.length) { ligne.push(champ); lignes.push(ligne); }
    return lignes.filter(function (l) { return l.some(function (x) { return String(x).trim() !== ''; }); });
  }

  function sansAccent(t) {
    return String(t || '').toLowerCase()
      .replace(/[àâä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[îï]/g, 'i')
      .replace(/[ôö]/g, 'o').replace(/[ùûü]/g, 'u').replace(/ç/g, 'c')
      .replace(/[^a-z]/g, '');
  }

  // L'export prefixe d'une apostrophe un texte qui commence par = + - @, pour
  // qu'un tableur ne le prenne pas pour une formule. On la retire au retour.
  function texteCsv(v) {
    var t = String(v == null ? '' : v).trim();
    return /^'[=+\-@\t\r]/.test(t) ? t.slice(1) : t;
  }

  function nombreCsv(v) {
    var t = String(v == null ? '' : v).trim().replace(/\s/g, '').replace(',', '.');
    if (t === '') return null;
    var n = Number(t);
    return isFinite(n) ? n : null;
  }

  function dateCsv(v) {
    var t = String(v == null ? '' : v).trim();
    var m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return t;
    m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (m) return m[3] + '-' + (m[2].length < 2 ? '0' : '') + m[2] + '-' + (m[1].length < 2 ? '0' : '') + m[1];
    return null;
  }

  function lireCsvCarnet(texte) {
    var t = String(texte || '').replace(/^\ufeff/, '');
    var premiere = t.split(/\r?\n/)[0] || '';
    var sep = premiere.indexOf(';') > -1 ? ';' : ',';
    var lignes = decouperCsv(t, sep);
    if (lignes.length < 2) return { erreur: 'Tableur vide : aucune ligne de série.' };

    var tete = lignes[0].map(sansAccent);
    function col() {
      for (var i = 0; i < arguments.length; i++) {
        var k = tete.indexOf(arguments[i]);
        if (k > -1) return k;
      }
      return -1;
    }
    var C = {
      date: col('date'), exo: col('exercice'), groupe: col('groupe'), serie: col('serie'),
      poids: col('poidskg', 'poids'), reps: col('repetitions', 'reps'), rpe: col('rpe'),
      repos: col('reposs', 'repos'), fait: col('fait')
    };
    if (C.date < 0 || C.exo < 0 || (C.poids < 0 && C.reps < 0)) {
      return { erreur: 'Ce tableur ne vient pas de Top Set : il faut au moins les colonnes Date, Exercice, et Poids ou Répétitions.' };
    }

    var sessions = {}, lues = 0, ignorees = 0, dernier = null;
    lignes.slice(1).forEach(function (l) {
      var ds = dateCsv(l[C.date]);
      var nom = texteCsv(l[C.exo]);
      var poids = C.poids > -1 ? nombreCsv(l[C.poids]) : null;
      var reps = C.reps > -1 ? texteCsv(l[C.reps]) : '';
      if (!ds || (poids === null && reps === '')) { ignorees++; return; }
      var num = C.serie > -1 ? nombreCsv(l[C.serie]) : null;
      var jour = sessions[ds] || (sessions[ds] = { date: ds, exercises: [] });
      // Une serie numerotee 1, ou un autre nom, ouvre un nouvel exercice :
      // c'est ainsi que l'export les ecrit, a la suite.
      var ex = dernier && dernier.ds === ds && dernier.nom === nom &&
               !(num !== null && dernier.num !== null && num <= dernier.num) ? dernier.ex : null;
      if (!ex) {
        ex = { nom: nom, groupe: C.groupe > -1 ? texteCsv(l[C.groupe]) : '', repos: '', series: [] };
        jour.exercises.push(ex);
      }
      var fait = C.fait > -1 ? String(l[C.fait] || '').trim().toLowerCase() : '';
      ex.series.push({
        poids: poids,
        reps: reps,
        rpe: C.rpe > -1 ? nombreCsv(l[C.rpe]) : null,
        repos: C.repos > -1 ? texteCsv(l[C.repos]) : '',
        fait: fait === 'oui' || fait === 'true' || fait === '1' || fait === 'x'
      });
      dernier = { ds: ds, nom: nom, num: num, ex: ex };
      lues++;
    });
    if (!lues) return { erreur: 'Aucune série lisible dans ce tableur.' };
    return { sessions: sessions, series: lues, ignorees: ignorees };
  }

  return {
    TYPES: TYPES,
    TYPES_VALIDES: TYPES_VALIDES,
    dureeSecondes: dureeSecondes,
    ecrireDuree: ecrireDuree,
    formatDuree: formatDuree,
    serieAuTemps: serieAuTemps,
    pointsDuree: pointsDuree,
    meilleureDuree: meilleureDuree,
    dureeTotale: dureeTotale,
    signatureExo: signatureExo,
    fusionnerCarnets: fusionnerCarnets,
    lireCsvCarnet: lireCsvCarnet,
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
