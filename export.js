/* Top Set — les exports (16/11/2026).
 *
 * « Remplace le bouton synchroniser par exporter mes donnees » : trois
 * fichiers, fabriques dans le telephone, qui ne passent par aucun serveur.
 *   - le classeur Excel : tout le carnet, une ligne par serie, et les
 *     seances, les semaines, les exercices et les pesees sur leurs onglets ;
 *     de quoi tout garder si on quitte l'app ;
 *   - le texte pour une IA : tout l'historique, mis en forme, avec la
 *     question a poser (repos, charges semaine par semaine, schemas, temps) ;
 *   - le carnet PDF pour un coach (plus bas).
 *
 * Ce fichier ne lit ni le stockage ni l'ecran : app.js lui passe un
 * « modele » (des dates, des nombres et des textes, deja ranges) et il rend
 * des octets ou du texte. Il est charge a la demande, a l'ouverture de
 * l'ecran d'export : l'app ne demarre pas plus lentement. Les regles
 * (top set, 1RM estime, records, regularite) restent celles
 * d'intelligence.js : une seule definition de chaque mesure.
 *
 * Les tests Node le chargent tel quel (test/export.test.mjs).
 */
(function (racine, fabrique) {
  if (typeof module === 'object' && module && module.exports) module.exports = fabrique(require('./intelligence.js'));
  else racine.TopSetExport = fabrique(racine.TS);
})(typeof self !== 'undefined' ? self : this, function (TS) {
  'use strict';

  // ------------------------------------------------------------------
  // Dates et nombres, a la francaise
  // ------------------------------------------------------------------
  var JOURS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var MOIS_COURT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  var JOUR_MS = 86400000;
  // Les douze dernieres semaines : ce qu'un coach regarde d'abord.
  var RECENT = 12;
  // Un repos plus court ou plus long ne dit rien de l'entrainement : une
  // pastille oubliee, ou deux series cochees d'un coup.
  var REPOS_MIN = 15, REPOS_MAX = 900;

  function deux(n) { return (n < 10 ? '0' : '') + n; }
  function epoque(ds) {
    var p = String(ds).split('-').map(Number);
    return Math.floor(Date.UTC(p[0], p[1] - 1, p[2]) / JOUR_MS);
  }
  function dateDe(j) {
    var d = new Date(j * JOUR_MS);
    return d.getUTCFullYear() + '-' + deux(d.getUTCMonth() + 1) + '-' + deux(d.getUTCDate());
  }
  // 0 = lundi.
  function jourSemaine(ds) { var j = epoque(ds); return (((j + 3) % 7) + 7) % 7; }
  function lundiDe(ds) { return dateDe(epoque(ds) - jourSemaine(ds)); }
  function parties(ds) { return String(ds).split('-').map(Number); }
  function dateLongue(ds) {
    var p = parties(ds);
    return (p[2] === 1 ? '1er' : p[2]) + ' ' + MOIS[p[1] - 1] + ' ' + p[0];
  }
  function dateCourte(ds) {
    var p = parties(ds);
    return p[2] + ' ' + MOIS_COURT[p[1] - 1];
  }
  function dateCourteAn(ds) { return dateCourte(ds) + ' ' + parties(ds)[0]; }
  function jourLong(ds) { return JOURS[jourSemaine(ds)] + ' ' + dateLongue(ds); }
  function moisDe(ds) { return String(ds).slice(0, 7); }
  function moisTexte(m) {
    var p = String(m).split('-').map(Number);
    return MOIS[p[1] - 1].charAt(0).toUpperCase() + MOIS[p[1] - 1].slice(1) + ' ' + p[0];
  }
  // « 1 234,5 » : virgule, et une espace fine entre les milliers.
  function nombre(n, dec) {
    if (typeof n !== 'number' || !isFinite(n)) return '';
    var f = Math.pow(10, dec == null ? 1 : dec);
    var r = Math.round(n * f) / f;
    var s = String(Math.abs(r)).split('.');
    s[0] = s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (r < 0 ? '−' : '') + s.join(',');
  }
  function pluriel(n, mot, pl) { return nombre(n, 0) + ' ' + (n > 1 ? (pl || mot + 's') : mot); }
  function dureeTexte(min) {
    if (!(min > 0)) return '';
    min = Math.round(min);
    return min < 60 ? min + ' min' : Math.floor(min / 60) + ' h ' + deux(min % 60);
  }
  function reposTexte(sec) {
    if (!(sec > 0)) return '';
    sec = Math.round(sec);
    return sec < 60 ? sec + ' s' : Math.floor(sec / 60) + ' min ' + deux(sec % 60);
  }
  function moyenne(l) { return l.length ? l.reduce(function (a, b) { return a + b; }, 0) / l.length : null; }
  function mediane(l) {
    if (!l.length) return null;
    var t = l.slice().sort(function (a, b) { return a - b; }), m = Math.floor(t.length / 2);
    return t.length % 2 ? t[m] : (t[m - 1] + t[m]) / 2;
  }
  function reposValable(s) {
    return typeof s.repos === 'number' && s.repos >= REPOS_MIN && s.repos <= REPOS_MAX && s.type !== TS.TYPES.ECHAUFFEMENT;
  }
  function trier(o) {
    return Object.keys(o).sort(function (a, b) { return o[b] - o[a] || (a < b ? -1 : 1); });
  }

  // ------------------------------------------------------------------
  // L'analyse : une seule lecture du carnet pour les trois exports
  // ------------------------------------------------------------------
  // Le modele (fabrique par app.js) :
  //   { aujourdhui, genere, pseudo, objectifSemaine, couleurs:{groupe:#hex},
  //     jours:[{ date, titre, titreChoisi, cycle, debut, fin, debutHM, finHM,
  //              duree (min ou null), validee, ressenti,
  //              exos:[{ nom, ecrit, groupe, sous, mode ('reps'|'temps'|'cardio'),
  //                      note, series:[{ n, type, poids, reps, nbReps, duree,
  //                      rpe, repos, fait, note, vitesse, inclinaison,
  //                      volume, e1rm, texte, court }] }] }],
  //     pesees:[{ date, poids, taille, bras, cuisse }] }
  function analyser(m) {
    var jours = (m.jours || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var auj = m.aujourdhui || (jours.length ? jours[jours.length - 1].date : dateDe(Math.floor(Date.now() / JOUR_MS)));
    var a = {
      modele: m, jours: jours, nb: jours.length, aujourdhui: auj,
      premier: jours.length ? jours[0].date : null,
      dernier: jours.length ? jours[jours.length - 1].date : null
    };

    // Chaque seance : ses series, son volume, ses groupes, ses repos.
    jours.forEach(function (j) {
      var st = { series: 0, volume: 0, groupes: {}, repos: [], rpe: [] };
      j.exos.forEach(function (e) {
        e.series.forEach(function (s) {
          st.series++;
          st.volume += s.volume || 0;
          if (reposValable(s)) st.repos.push(s.repos);
          if (typeof s.rpe === 'number') st.rpe.push(s.rpe);
        });
        st.groupes[e.groupe] = (st.groupes[e.groupe] || 0) + e.series.length;
      });
      j.stats = st;
    });

    // Les semaines, du lundi de la premiere seance a celui d'aujourd'hui,
    // vides comprises : une semaine sans seance est une information.
    var semaines = [], parLundi = {};
    if (a.premier) {
      var fin = epoque(lundiDe(auj > a.dernier ? auj : a.dernier));
      for (var l = epoque(lundiDe(a.premier)); l <= fin; l += 7) {
        var w = { lundi: dateDe(l), seances: 0, series: 0, volume: 0, duree: 0, nbDuree: 0, repos: [], rpe: [], groupes: {}, jours: [] };
        parLundi[w.lundi] = w;
        semaines.push(w);
      }
    }
    var mois = [], parMois = {};
    jours.forEach(function (j) {
      var w = parLundi[lundiDe(j.date)];
      var k = moisDe(j.date), mo = parMois[k];
      if (!mo) { mo = parMois[k] = { mois: k, seances: 0, series: 0, volume: 0, duree: 0, nbDuree: 0, groupes: {}, repos: [] }; mois.push(mo); }
      [w, mo].forEach(function (x) {
        if (!x) return;
        x.seances++;
        x.series += j.stats.series;
        x.volume += j.stats.volume;
        if (j.duree > 0) { x.duree += j.duree; x.nbDuree++; }
        x.repos = x.repos.concat(j.stats.repos);
        Object.keys(j.stats.groupes).forEach(function (g) { x.groupes[g] = (x.groupes[g] || 0) + j.stats.groupes[g]; });
      });
      if (w) { w.jours.push(j.date); w.rpe = w.rpe.concat(j.stats.rpe); }
    });
    a.semaines = semaines;
    a.mois = mois;

    // Les exercices : toutes leurs seances, sous la forme qu'attend
    // intelligence.js ({ date, series }).
    var parNom = {}, exos = [];
    jours.forEach(function (j) {
      j.exos.forEach(function (e) {
        var x = parNom[e.nom];
        if (!x) {
          x = parNom[e.nom] = { nom: e.nom, groupe: e.groupe, sous: e.sous, mode: e.mode, seances: [], nbSeries: 0, repos: [], rpe: [], reps: [] };
          exos.push(x);
        }
        var der = x.seances[x.seances.length - 1];
        if (der && der.date === j.date) der.series = der.series.concat(e.series);
        else x.seances.push({ date: j.date, series: e.series.slice() });
        x.nbSeries += e.series.length;
        e.series.forEach(function (s) {
          if (reposValable(s)) x.repos.push(s.repos);
          if (typeof s.rpe === 'number') x.rpe.push(s.rpe);
          if (typeof s.nbReps === 'number' && s.type !== TS.TYPES.ECHAUFFEMENT) x.reps.push(s.nbReps);
        });
      });
    });
    var debutRecent = dateDe(epoque(lundiDe(auj)) - 7 * (RECENT - 1));
    exos.forEach(function (x) {
      x.fois = x.seances.length;
      x.premiere = x.seances[0].date;
      x.derniere = x.seances[x.seances.length - 1].date;
      x.recentes = x.seances.filter(function (se) { return se.date >= debutRecent; }).length;
      x.reposMedian = mediane(x.repos);
      x.rpeMoyen = moyenne(x.rpe);
      x.chargeMax = TS.meilleurPoids(x.seances);
      x.chargeMaxDate = null;
      if (x.chargeMax) {
        x.seances.some(function (se) {
          var ok = se.series.some(function (s) { return s.poids === x.chargeMax && s.type !== TS.TYPES.ECHAUFFEMENT; });
          if (ok) x.chargeMaxDate = se.date;
          return ok;
        });
      }
      if (x.mode === 'reps') {
        x.points = TS.pointsTopSet(x.seances);
        x.meilleur = x.points.reduce(function (b, p) { return !b || p.valeur > b.valeur ? p : b; }, null);
        x.progression = TS.progressionTopSet(x.seances);
        x.progressionRecente = TS.progressionTopSet(x.seances.filter(function (se) { return se.date >= debutRecent; }));
      } else {
        x.points = TS.pointsDuree(x.seances);
        x.meilleur = x.points.reduce(function (b, p) { return !b || p.valeur > b.valeur ? p : b; }, null);
        x.progression = null;
        x.progressionRecente = null;
      }
    });
    exos.sort(function (p, q) { return q.fois - p.fois || q.nbSeries - p.nbSeries || (p.nom < q.nom ? -1 : 1); });
    a.exercices = exos;

    // Le profil : le rythme, ce qui est travaille, comment.
    var recentes = semaines.slice(-RECENT);
    var joursRecents = jours.filter(function (j) { return j.date >= debutRecent; });
    var g = {}, gRecent = {}, js = [0, 0, 0, 0, 0, 0, 0], moments = { matin: 0, midi: 0, aprem: 0, soir: 0 };
    var durees = [], dureesRecentes = [], repos = [], rpe = [], fourchettes = { force: 0, hypertrophie: 0, endurance: 0 }, titres = {};
    jours.forEach(function (j) {
      var recent = j.date >= debutRecent;
      Object.keys(j.stats.groupes).forEach(function (k) {
        g[k] = (g[k] || 0) + j.stats.groupes[k];
        if (recent) gRecent[k] = (gRecent[k] || 0) + j.stats.groupes[k];
      });
      js[jourSemaine(j.date)]++;
      var h = /^(\d{1,2}):/.exec(j.debutHM || '');
      if (h) {
        var hh = Number(h[1]);
        moments[hh < 11 ? 'matin' : hh < 14 ? 'midi' : hh < 18 ? 'aprem' : 'soir']++;
      }
      if (j.duree > 0) { durees.push(j.duree); if (recent) dureesRecentes.push(j.duree); }
      repos = repos.concat(j.stats.repos);
      rpe = rpe.concat(j.stats.rpe);
      if (recent) titres[j.titre] = (titres[j.titre] || 0) + 1;
      j.exos.forEach(function (e) {
        if (e.mode !== 'reps') return;
        e.series.forEach(function (s) {
          if (s.type === TS.TYPES.ECHAUFFEMENT || typeof s.nbReps !== 'number') return;
          fourchettes[s.nbReps <= 5 ? 'force' : s.nbReps <= 12 ? 'hypertrophie' : 'endurance']++;
        });
      });
    });
    var totalSeries = jours.reduce(function (t, j) { return t + j.stats.series; }, 0);
    a.profil = {
      semaines: semaines.length,
      semainesActives: semaines.filter(function (w) { return w.seances; }).length,
      parSemaine: semaines.length ? jours.length / semaines.length : 0,
      semainesRecentes: recentes.length,
      seancesRecentes: joursRecents.length,
      parSemaineRecente: recentes.length ? joursRecents.length / recentes.length : 0,
      totalSeries: totalSeries,
      totalVolume: jours.reduce(function (t, j) { return t + j.stats.volume; }, 0),
      seriesParSeance: jours.length ? totalSeries / jours.length : 0,
      dureeMoyenne: moyenne(durees),
      dureeRecente: moyenne(dureesRecentes),
      heuresTotales: durees.reduce(function (t, d) { return t + d; }, 0) / 60,
      seancesChronometrees: durees.length,
      reposMedian: mediane(repos),
      nbRepos: repos.length,
      rpeMoyen: moyenne(rpe),
      nbRpe: rpe.length,
      groupes: g,
      groupesRecents: gRecent,
      ordreGroupes: trier(Object.keys(gRecent).length ? gRecent : g),
      joursSemaine: js,
      moments: moments,
      fourchettes: fourchettes,
      seancesTypes: trier(titres).slice(0, 4).map(function (t) { return { titre: t, fois: titres[t] }; }),
      exercicesDifferents: exos.length,
      regularite: TS.regularite(jours.map(function (j) { return j.date; }), m.objectifSemaine, auj, RECENT)
    };

    // Le poids du corps : la derniere pesee, et l'ecart avec celle d'environ
    // trois mois plus tot.
    var pes = (m.pesees || []).filter(function (p) { return typeof p.poids === 'number'; })
      .sort(function (p, q) { return p.date < q.date ? -1 : 1; });
    a.pesees = pes;
    if (pes.length) {
      var der = pes[pes.length - 1], cible = epoque(der.date) - 90;
      var ref = pes.filter(function (p) { return epoque(p.date) <= cible; }).pop() || pes[0];
      a.poids = { dernier: der, reference: ref !== der ? ref : null, ecart: ref !== der ? der.poids - ref.poids : null };
    } else a.poids = null;

    a.synthese = synthese(a);
    return a;
  }

  // La phrase qu'un coach lit en premier.
  function synthese(a) {
    if (!a.nb) return 'Aucune séance notée pour l\'instant.';
    var p = a.profil, bouts = [];
    var rythme = p.semainesRecentes >= 4 ? p.parSemaineRecente : p.parSemaine;
    var quand = p.semainesRecentes >= 4 ? 'sur les ' + p.semainesRecentes + ' dernières semaines' : 'depuis le début';
    bouts.push(nombre(rythme, 1) + ' séance' + (rythme >= 2 ? 's' : '') + ' par semaine ' + quand);
    var gs = p.ordreGroupes.filter(function (x) { return x !== 'Autre'; }).slice(0, 3);
    if (gs.length) bouts[0] += ', surtout ' + listeEt(gs.map(function (x) { return x.toLowerCase(); }));
    var d = p.dureeRecente || p.dureeMoyenne;
    var phrase2 = [];
    if (d) phrase2.push('des séances de ' + dureeTexte(d) + ' en moyenne');
    phrase2.push(nombre(p.seriesParSeance, 0) + ' séries chacune');
    var f = p.fourchettes, tf = f.force + f.hypertrophie + f.endurance;
    if (tf >= 20) {
      var dom = ['hypertrophie', 'force', 'endurance'].sort(function (x, y) { return f[y] - f[x]; })[0];
      var part = Math.round(100 * f[dom] / tf);
      phrase2.push(part + ' % des séries de travail ' + (dom === 'force' ? 'à 5 répétitions ou moins' : dom === 'hypertrophie' ? 'entre 6 et 12 répétitions' : 'au-delà de 12 répétitions'));
    }
    var s = bouts[0] + '. ' + cap(listeEt(phrase2)) + '.';
    return s;
  }
  function cap(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; }
  function listeEt(l) {
    if (l.length < 2) return l.join('');
    return l.slice(0, -1).join(', ') + ' et ' + l[l.length - 1];
  }

  // ------------------------------------------------------------------
  // Le classeur Excel (.xlsx)
  // ------------------------------------------------------------------
  // Un .xlsx est un zip de quelques fichiers XML. On l'ecrit a la main, sans
  // bibliotheque : stocke sans compression (Excel, Numbers et Google Sheets
  // le lisent), textes en ligne (pas de table de chaines partagees), dates en
  // vraies dates. Une feuille = { nom, colonnes:[{ titre, largeur, type }],
  // lignes:[[valeurs]] } ; type 'date' (« 2026-11-16 »), 'heure' (« 18:05 »),
  // sinon la valeur dit son type (nombre ou texte).
  var CRC = (function () {
    var t = [];
    for (var n = 0; n < 256; n++) {
      var c = n;
      for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(o) {
    var c = 0xffffffff;
    for (var i = 0; i < o.length; i++) c = CRC[(c ^ o[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function utf8(t) { return new TextEncoder().encode(t); }
  // fichiers : [{ nom, octets }] -> le zip, sans compression.
  function zip(fichiers, quand) {
    var d = quand || new Date();
    var heure = (d.getHours() << 11) | (d.getMinutes() << 5) | (Math.floor(d.getSeconds() / 2));
    var jour = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    var morceaux = [], central = [], decalage = 0;
    function entete(taille) { return new DataView(new ArrayBuffer(taille)); }
    fichiers.forEach(function (f) {
      var nom = utf8(f.nom), crc = crc32(f.octets), n = f.octets.length;
      var h = entete(30);
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
      h.setUint16(8, 0, true); h.setUint16(10, heure, true); h.setUint16(12, jour, true);
      h.setUint32(14, crc, true); h.setUint32(18, n, true); h.setUint32(22, n, true);
      h.setUint16(26, nom.length, true); h.setUint16(28, 0, true);
      var c = entete(46);
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true);
      c.setUint16(8, 0x0800, true); c.setUint16(10, 0, true); c.setUint16(12, heure, true);
      c.setUint16(14, jour, true); c.setUint32(16, crc, true); c.setUint32(20, n, true);
      c.setUint32(24, n, true); c.setUint16(28, nom.length, true); c.setUint32(42, decalage, true);
      morceaux.push(new Uint8Array(h.buffer), nom, f.octets);
      central.push(new Uint8Array(c.buffer), nom);
      decalage += 30 + nom.length + n;
    });
    var tailleCentral = central.reduce(function (t, o) { return t + o.length; }, 0);
    var fin = entete(22);
    fin.setUint32(0, 0x06054b50, true); fin.setUint16(8, fichiers.length, true);
    fin.setUint16(10, fichiers.length, true); fin.setUint32(12, tailleCentral, true);
    fin.setUint32(16, decalage, true);
    return concat(morceaux.concat(central, [new Uint8Array(fin.buffer)]));
  }
  function concat(l) {
    var n = l.reduce(function (t, o) { return t + o.length; }, 0), r = new Uint8Array(n), p = 0;
    l.forEach(function (o) { r.set(o, p); p += o.length; });
    return r;
  }
  function xml(t) {
    return String(t).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function colonne(i) {
    var s = '';
    for (i++; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + (i - 1) % 26) + s;
    return s;
  }
  // Excel compte les jours depuis le 30 decembre 1899 ; le 1er janvier 1970
  // est le jour 25569.
  function serieExcel(ds) { return epoque(ds) + 25569; }
  function heureExcel(hm) {
    var x = /^(\d{1,2}):(\d{2})$/.exec(String(hm || ''));
    return x ? (Number(x[1]) * 60 + Number(x[2])) / 1440 : null;
  }
  var STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
    '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' +
    '<fill><patternFill patternType="solid"><fgColor rgb="FFF1ECE4"/><bgColor indexed="64"/></patternFill></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="4">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>' +
    '<xf numFmtId="14" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="20" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
    '</styleSheet>';
  function feuilleXml(f) {
    var cols = '<cols>' + f.colonnes.map(function (c, i) {
      return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (c.largeur || 12) + '" customWidth="1"/>';
    }).join('') + '</cols>';
    var lignes = [f.colonnes.map(function (c) { return c.titre; })].concat(f.lignes);
    var data = lignes.map(function (l, r) {
      return '<row r="' + (r + 1) + '">' + l.map(function (v, i) {
        var ref = colonne(i) + (r + 1), type = r ? f.colonnes[i].type : null;
        if (v === null || v === undefined || v === '') return '';
        if (r === 0) return '<c r="' + ref + '" t="inlineStr" s="1"><is><t>' + xml(v) + '</t></is></c>';
        if (type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return '<c r="' + ref + '" s="2"><v>' + serieExcel(v) + '</v></c>';
        if (type === 'heure' && heureExcel(v) !== null) return '<c r="' + ref + '" s="3"><v>' + heureExcel(v) + '</v></c>';
        if (typeof v === 'number' && isFinite(v)) return '<c r="' + ref + '"><v>' + (Math.round(v * 1000) / 1000) + '</v></c>';
        return '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + xml(v) + '</t></is></c>';
      }).join('') + '</row>';
    }).join('');
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>' +
      cols + '<sheetData>' + data + '</sheetData></worksheet>';
  }
  function nomFeuille(n) { return String(n).replace(/[\[\]:*?\/\\]/g, ' ').slice(0, 31); }
  function classeur(feuilles, quand) {
    var ns = 'http://schemas.openxmlformats.org/';
    var types = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="' + ns + 'package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      feuilles.map(function (f, i) {
        return '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
      }).join('') + '</Types>';
    var rels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="' + ns + 'package/2006/relationships">' +
      '<Relationship Id="rId1" Type="' + ns + 'officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>';
    var wb = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="' + ns + 'spreadsheetml/2006/main" xmlns:r="' + ns + 'officeDocument/2006/relationships"><sheets>' +
      feuilles.map(function (f, i) {
        return '<sheet name="' + xml(nomFeuille(f.nom)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>';
      }).join('') + '</sheets></workbook>';
    var wbRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="' + ns + 'package/2006/relationships">' +
      feuilles.map(function (f, i) {
        return '<Relationship Id="rId' + (i + 1) + '" Type="' + ns + 'officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>';
      }).join('') +
      '<Relationship Id="rId' + (feuilles.length + 1) + '" Type="' + ns + 'officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
    var fichiers = [
      { nom: '[Content_Types].xml', octets: utf8(types) },
      { nom: '_rels/.rels', octets: utf8(rels) },
      { nom: 'xl/workbook.xml', octets: utf8(wb) },
      { nom: 'xl/_rels/workbook.xml.rels', octets: utf8(wbRels) },
      { nom: 'xl/styles.xml', octets: utf8(STYLES) }
    ].concat(feuilles.map(function (f, i) {
      return { nom: 'xl/worksheets/sheet' + (i + 1) + '.xml', octets: utf8(feuilleXml(f)) };
    }));
    return zip(fichiers, quand);
  }

  var TYPE_TEXTE = { echauffement: 'Échauffement', top: 'Top set', backoff: 'Back-off', travail: 'Travail' };
  function arrondi(n, d) { return typeof n === 'number' && isFinite(n) ? Math.round(n * Math.pow(10, d)) / Math.pow(10, d) : null; }

  // Les feuilles du classeur, depuis l'analyse.
  function feuillesExcel(a) {
    var groupes = (a.modele.groupes || []).filter(function (g) { return a.profil.groupes[g]; });
    var C = function (titre, largeur, type) { return { titre: titre, largeur: largeur, type: type }; };
    var series = { nom: 'Séries', colonnes: [
      C('Date', 11, 'date'), C('Jour', 10), C('Séance', 22), C('Exercice', 28), C('Nom noté', 22), C('Groupe', 11),
      C('Sous-groupe', 13), C('Série', 7), C('Type', 12), C('Poids (kg)', 10), C('Reps', 7), C('Durée (s)', 9),
      C('RPE', 6), C('Repos (s)', 9), C('Volume (kg)', 11), C('1RM estimé (kg)', 14), C('Faite', 7),
      C('Commentaire', 30), C('Vitesse (km/h)', 13), C('Inclinaison (%)', 14)
    ], lignes: [] };
    a.jours.forEach(function (j) {
      j.exos.forEach(function (e) {
        e.series.forEach(function (s) {
          series.lignes.push([
            j.date, JOURS[jourSemaine(j.date)], j.titre, e.nom, e.ecrit !== e.nom ? e.ecrit : '', e.groupe, e.sous, s.n,
            TYPE_TEXTE[s.type] || '', s.poids, typeof s.nbReps === 'number' ? s.nbReps : (s.duree === null ? s.reps : null),
            s.duree, s.rpe, s.repos, s.volume || null, arrondi(s.e1rm, 1), s.fait ? 'oui' : 'non', s.note,
            s.vitesse, s.inclinaison
          ]);
        });
      });
    });
    var seances = { nom: 'Séances', colonnes: [
      C('Date', 11, 'date'), C('Jour', 10), C('Titre', 24), C('Cycle', 12), C('Début', 8, 'heure'), C('Fin', 8, 'heure'),
      C('Durée (min)', 11), C('Exercices', 10), C('Séries', 8), C('Volume (kg)', 12), C('Repos médian (s)', 15),
      C('RPE moyen', 10), C('Groupes (séries)', 34), C('Validée', 8), C('Ressenti', 40)
    ], lignes: a.jours.map(function (j) {
      return [j.date, JOURS[jourSemaine(j.date)], j.titre, j.cycle, j.debutHM, j.finHM, j.duree, j.exos.length,
        j.stats.series, Math.round(j.stats.volume) || null, arrondi(mediane(j.stats.repos), 0), arrondi(moyenne(j.stats.rpe), 1),
        trier(j.stats.groupes).map(function (g) { return g + ' ' + j.stats.groupes[g]; }).join(', '),
        j.validee ? 'oui' : 'non', j.ressenti];
    }) };
    var semaines = { nom: 'Semaines', colonnes: [
      C('Semaine du', 12, 'date'), C('Séances', 8), C('Séries', 8), C('Volume (kg)', 12), C('Temps total (min)', 15),
      C('Durée moyenne (min)', 17), C('Repos médian (s)', 15), C('RPE moyen', 10)
    ].concat(groupes.map(function (g) { return C(g + ' (séries)', 14); })),
    lignes: a.semaines.map(function (w) {
      return [w.lundi, w.seances, w.series, Math.round(w.volume) || null, w.duree || null,
        w.nbDuree ? Math.round(w.duree / w.nbDuree) : null, arrondi(mediane(w.repos), 0), arrondi(moyenne(w.rpe), 1)]
        .concat(groupes.map(function (g) { return w.groupes[g] || null; }));
    }) };
    var exercices = { nom: 'Exercices', colonnes: [
      C('Exercice', 28), C('Groupe', 11), C('Sous-groupe', 13), C('Mesure', 9), C('Séances', 8), C('Séries', 8),
      C('Première fois', 13, 'date'), C('Dernière fois', 13, 'date'), C('Charge max (kg)', 14), C('Le', 11, 'date'),
      C('Meilleure série', 18), C('Meilleur 1RM estimé (kg)', 21), C('Le', 11, 'date'), C('1RM estimé au début (kg)', 21),
      C('1RM estimé à la fin (kg)', 21), C('Progression (%)', 14), C('Repos médian (s)', 15), C('RPE moyen', 10)
    ], lignes: a.exercices.map(function (x) {
      var b = x.meilleur, p = x.progression;
      return [x.nom, x.groupe, x.sous, x.mode === 'reps' ? 'reps' : x.mode === 'cardio' ? 'cardio' : 'temps', x.fois, x.nbSeries,
        x.premiere, x.derniere, x.chargeMax, x.chargeMaxDate, b ? b.topSet.texte : '',
        x.mode === 'reps' && b ? arrondi(b.valeur, 1) : null, b ? b.date : null,
        p ? arrondi(p.debut.rm, 1) : null, p ? arrondi(p.fin.rm, 1) : null, p ? p.gain : null,
        arrondi(x.reposMedian, 0), arrondi(x.rpeMoyen, 1)];
    }) };
    var feuilles = [series, seances, semaines, exercices];
    if (a.pesees.length) {
      feuilles.push({ nom: 'Poids du corps', colonnes: [
        C('Date', 11, 'date'), C('Poids (kg)', 10), C('Tour de taille (cm)', 17), C('Tour de bras (cm)', 16), C('Tour de cuisse (cm)', 18)
      ], lignes: a.pesees.map(function (p) { return [p.date, p.poids, p.taille, p.bras, p.cuisse]; }) });
    }
    feuilles.push({ nom: 'À lire', colonnes: [C('Top Set — export du carnet', 70)], lignes: [
      ['Exporté le ' + dateLongue(a.aujourdhui) + (a.modele.pseudo ? ' par ' + a.modele.pseudo : '') + '.'],
      [a.nb ? 'Du ' + dateLongue(a.premier) + ' au ' + dateLongue(a.dernier) + ' : ' + pluriel(a.nb, 'séance') + ', ' + pluriel(a.profil.totalSeries, 'série') + '.' : 'Aucune séance.'],
      [''],
      ['Séries : une ligne par série notée. Reps = répétitions ; Durée = secondes tenues (gainage, cardio).'],
      ['RPE : effort ressenti sur 10 (10 = à l\'échec). Repos : secondes avant la série suivante, mesurées ou notées.'],
      ['Volume = poids × répétitions. 1RM estimé : formule d\'Epley, seulement jusqu\'à 12 répétitions.'],
      ['Top set : la série la plus lourde de la séance, hors échauffement et back-off.'],
      ['Semaines : du lundi au dimanche, semaines sans séance comprises.'],
      ['Ce fichier est à toi : il a été fabriqué dans ton téléphone, sans passer par un serveur.']
    ] });
    return feuilles;
  }
  function xlsx(a, quand) { return classeur(feuillesExcel(a), quand); }

  // ------------------------------------------------------------------
  // Le texte pour une IA
  // ------------------------------------------------------------------
  // Une IA lit mieux un texte range qu'un tableur : la consigne d'abord, la
  // legende des notations, le profil, les semaines, chaque exercice avec son
  // top set seance par seance (la courbe des charges), puis toutes les
  // seances. Une serie s'ecrit en quelques caracteres : « 100×5 @8 r150 ».
  var CONSIGNE = [
    'Tu es un coach de musculation et préparateur physique expérimenté. Voici tout mon carnet d\'entraînement, exporté de l\'app Top Set. Analyse-le de fond en comble et dis-moi clairement ce qui va et ce qui ne va pas. Appuie chaque constat sur des chiffres précis du carnet (dates, charges, séries), et dis quand les données ne permettent pas de conclure.',
    '',
    'Regarde en particulier :',
    '1. La régularité : séances par semaine, semaines creuses, coupures, évolution dans le temps.',
    '2. Les charges : pour chaque exercice principal, l\'évolution semaine après semaine du top set et du 1RM estimé. Ce qui progresse, ce qui stagne et depuis quand, ce qui régresse.',
    '3. Les temps de repos : ce que montrent mes repos mesurés, par exercice et selon les charges, et s\'ils collent à ce que je cherche.',
    '4. Les schémas d\'entraînement : mon découpage (split), les jours, l\'ordre des exercices, les fourchettes de répétitions, l\'intensité (RPE), les cycles.',
    '5. Le volume : séries par semaine et par groupe musculaire, l\'équilibre poussée / tirage et haut / bas du corps, les groupes négligés ou trop chargés.',
    '6. Le temps passé : la durée des séances, son évolution, la densité (séries par heure).',
    '7. Le poids du corps et la force relative, s\'il y a des pesées.',
    '',
    'Termine par : mes 3 points forts, les 3 problèmes à corriger en priorité, et un plan concret pour les 4 prochaines semaines (exercices, séries, répétitions, repos). Réponds en français.'
  ];
  var LEGENDE = [
    '- « 100×5 » : 5 répétitions à 100 kg. « PDC×12 » : 12 répétitions au poids du corps. « 45 s » : une série tenue 45 secondes.',
    '- « @8 » : RPE 8 sur 10 (10 = à l\'échec, 9 = une répétition en réserve).',
    '- « r150 » : 150 secondes de repos avant la série suivante (mesurées par l\'app ou notées).',
    '- « É » : échauffement ; « T » : top set déclaré ; « B » : back-off. Sans lettre : série de travail.',
    '- 1RM estimé : formule d\'Epley (poids × (1 + reps / 30)), seulement jusqu\'à 12 répétitions.',
    '- Top set : la série la plus lourde de la séance, hors échauffement et back-off.',
    '- Les semaines vont du lundi au dimanche. Une ligne de semaine à 0 séance est une semaine sans entraînement.'
  ];
  function serieCourte(s) {
    var t = s.court || '';
    if (s.type === TS.TYPES.ECHAUFFEMENT) t = 'É ' + t;
    else if (s.type === TS.TYPES.TOP) t = 'T ' + t;
    else if (s.type === TS.TYPES.BACKOFF) t = 'B ' + t;
    if (typeof s.rpe === 'number') t += ' @' + String(s.rpe).replace('.', ',');
    if (typeof s.repos === 'number' && s.repos > 0) t += ' r' + Math.round(s.repos);
    if (s.note) t += ' « ' + s.note.replace(/\s+/g, ' ') + ' »';
    return t;
  }
  function groupesTexte(o) {
    return trier(o).map(function (g) { return g + ' ' + o[g]; }).join(', ');
  }
  function texteIA(a) {
    var m = a.modele, p = a.profil, L = [];
    L.push('# Mon carnet de musculation (Top Set)', '');
    L.push('Exporté le ' + dateLongue(a.aujourdhui) + '. ' + (a.nb
      ? 'Du ' + jourLong(a.premier) + ' au ' + jourLong(a.dernier) + ' : ' + pluriel(a.nb, 'séance') + ', ' + pluriel(p.totalSeries, 'série') + ', ' + pluriel(p.exercicesDifferents, 'exercice') + ' différents.'
      : 'Aucune séance notée.'));
    L.push('', '## Ce que je te demande', '');
    L = L.concat(CONSIGNE);
    L.push('', '## Comment lire les données', '');
    L = L.concat(LEGENDE);
    if (!a.nb) return L.join('\n') + '\n';

    L.push('', '## Mon profil en bref', '');
    L.push('- En une phrase : ' + a.synthese);
    L.push('- Rythme : ' + nombre(p.parSemaine, 1) + ' séance(s) par semaine en moyenne depuis le début (' + p.semainesActives + ' semaines actives sur ' + p.semaines + ') ; ' +
      nombre(p.parSemaineRecente, 1) + ' sur les ' + p.semainesRecentes + ' dernières semaines.');
    var r = p.regularite;
    L.push('- Objectif que je me suis fixé : ' + pluriel(r.objectif, 'séance') + ' par semaine. Tenu ' + pluriel(r.serie, 'semaine') + ' d\'affilée en ce moment, ' + r.meilleure + ' au mieux.');
    L.push('- Séances : ' + nombre(p.seriesParSeance, 1) + ' séries en moyenne' +
      (p.dureeMoyenne ? ', ' + dureeTexte(p.dureeMoyenne) + ' en moyenne (' + p.seancesChronometrees + ' séances chronométrées, ' + nombre(p.heuresTotales, 0) + ' h au total)' : ', durée non mesurée') + '.');
    L.push('- Repos : ' + (p.nbRepos ? 'médiane ' + reposTexte(p.reposMedian) + ' sur ' + p.nbRepos + ' repos mesurés ou notés (échauffements exclus).' : 'aucun repos mesuré.'));
    L.push('- RPE : ' + (p.nbRpe ? 'moyenne ' + nombre(p.rpeMoyen, 1) + ' sur ' + p.nbRpe + ' séries notées.' : 'jamais noté.'));
    var f = p.fourchettes, tf = f.force + f.hypertrophie + f.endurance;
    if (tf) L.push('- Répétitions des séries de travail : ' + Math.round(100 * f.force / tf) + ' % à 1–5, ' + Math.round(100 * f.hypertrophie / tf) + ' % à 6–12, ' + Math.round(100 * f.endurance / tf) + ' % au-delà.');
    L.push('- Jours : ' + JOURS.map(function (j, i) { return j + ' ' + p.joursSemaine[i]; }).join(', ') + '.');
    var mo = p.moments;
    if (mo.matin + mo.midi + mo.aprem + mo.soir) L.push('- Heure de début : matin ' + mo.matin + ', midi ' + mo.midi + ', après-midi ' + mo.aprem + ', soir ' + mo.soir + '.');
    if (p.seancesTypes.length) L.push('- Séances types (12 dernières semaines) : ' + p.seancesTypes.map(function (t) { return t.titre + ' (' + t.fois + ')'; }).join(', ') + '.');
    L.push('- Séries par groupe, depuis le début : ' + groupesTexte(p.groupes) + '.');
    if (Object.keys(p.groupesRecents).length) L.push('- Séries par groupe, 12 dernières semaines : ' + groupesTexte(p.groupesRecents) + '.');
    if (a.poids) {
      var po = a.poids;
      L.push('- Poids du corps : ' + nombre(po.dernier.poids, 1) + ' kg le ' + dateLongue(po.dernier.date) +
        (po.reference ? ' (' + (po.ecart >= 0 ? '+' : '') + nombre(po.ecart, 1) + ' kg depuis le ' + dateLongue(po.reference.date) + ')' : '') + '.');
    }

    L.push('', '## Semaine par semaine', '');
    L.push('| Semaine du | Séances | Séries | Volume (kg) | Temps total | Repos médian | Séries par groupe |');
    L.push('|---|---|---|---|---|---|---|');
    a.semaines.forEach(function (w) {
      L.push('| ' + w.lundi + ' | ' + w.seances + ' | ' + w.series + ' | ' + (w.volume ? Math.round(w.volume) : 0) + ' | ' +
        (w.duree ? dureeTexte(w.duree) : '—') + ' | ' + (w.repos.length ? Math.round(mediane(w.repos)) + ' s' : '—') + ' | ' +
        (w.seances ? groupesTexte(w.groupes) : '—') + ' |');
    });

    L.push('', '## Exercice par exercice', '', 'Du plus pratiqué au moins pratiqué. La ligne « Top sets » donne, séance par séance, la série la plus lourde : c\'est la courbe des charges.');
    a.exercices.forEach(function (x) {
      L.push('', '### ' + x.nom + ' — ' + x.groupe + (x.sous ? ' · ' + x.sous : ''));
      var bits = [pluriel(x.fois, 'séance') + ', ' + pluriel(x.nbSeries, 'série'), 'du ' + x.premiere + ' au ' + x.derniere];
      if (x.chargeMax) bits.push('charge max ' + nombre(x.chargeMax, 2) + ' kg (' + x.chargeMaxDate + ')');
      if (x.meilleur && x.mode === 'reps') bits.push('meilleur 1RM estimé ' + nombre(x.meilleur.valeur, 1) + ' kg (' + x.meilleur.topSet.court + ', ' + x.meilleur.date + ')');
      if (x.meilleur && x.mode !== 'reps') bits.push('meilleure série ' + x.meilleur.topSet.court + ' (' + x.meilleur.date + ')');
      if (x.progression) bits.push('1RM estimé ' + nombre(x.progression.debut.rm, 1) + ' → ' + nombre(x.progression.fin.rm, 1) + ' kg (' + (x.progression.gain >= 0 ? '+' : '') + nombre(x.progression.gain, 1) + ' %)');
      if (x.reposMedian) bits.push('repos médian ' + Math.round(x.reposMedian) + ' s');
      if (x.rpeMoyen) bits.push('RPE moyen ' + nombre(x.rpeMoyen, 1));
      L.push(bits.join(' ; ') + '.');
      if (x.points.length) {
        L.push('Top sets : ' + x.points.map(function (pt) {
          return pt.date + ' ' + pt.topSet.court + (typeof pt.topSet.rpe === 'number' ? ' @' + String(pt.topSet.rpe).replace('.', ',') : '');
        }).join(' · '));
      }
    });

    L.push('', '## Toutes les séances', '');
    a.jours.forEach(function (j) {
      var tete = '### ' + j.date + ' (' + JOURS[jourSemaine(j.date)] + ') — ' + j.titre;
      var info = [];
      if (j.cycle) info.push('cycle ' + j.cycle.toLowerCase());
      if (j.debutHM || j.finHM) info.push((j.debutHM || '?') + ' → ' + (j.finHM || '?') + (j.duree ? ' (' + dureeTexte(j.duree) + ')' : ''));
      info.push(pluriel(j.stats.series, 'série'));
      if (j.validee) info.push('validée');
      L.push('', tete, info.join(' · '));
      if (j.ressenti) L.push('Ressenti : « ' + j.ressenti.replace(/\s+/g, ' ') + ' »');
      j.exos.forEach(function (e) {
        L.push('- ' + e.nom + ' [' + e.groupe + (e.sous ? ' · ' + e.sous : '') + '] : ' + e.series.map(serieCourte).join(' · ') +
          (e.note ? ' — note : « ' + e.note.replace(/\s+/g, ' ') + ' »' : ''));
      });
    });

    if (a.pesees.length) {
      L.push('', '## Pesées', '');
      a.pesees.forEach(function (pe) {
        var t = [nombre(pe.poids, 1) + ' kg'];
        if (pe.taille) t.push('taille ' + nombre(pe.taille, 1) + ' cm');
        if (pe.bras) t.push('bras ' + nombre(pe.bras, 1) + ' cm');
        if (pe.cuisse) t.push('cuisse ' + nombre(pe.cuisse, 1) + ' cm');
        L.push('- ' + pe.date + ' : ' + t.join(', '));
      });
    }
    L.push('', 'Fin du carnet.');
    return L.join('\n') + '\n';
  }

  return {
    analyser: analyser,
    xlsx: xlsx,
    feuillesExcel: feuillesExcel,
    classeur: classeur,
    zip: zip,
    crc32: crc32,
    texteIA: texteIA,
    // Pour les tests et pour le carnet PDF.
    outils: {
      lundiDe: lundiDe, jourSemaine: jourSemaine, dateLongue: dateLongue, dateCourte: dateCourte,
      dateCourteAn: dateCourteAn, moisTexte: moisTexte, nombre: nombre, dureeTexte: dureeTexte,
      reposTexte: reposTexte, mediane: mediane, moyenne: moyenne, pluriel: pluriel, serieExcel: serieExcel
    }
  };
});
