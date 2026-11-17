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
    return (p[2] === 1 ? '1er' : p[2]) + ' ' + MOIS_COURT[p[1] - 1];
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
    '- Les semaines vont du lundi au dimanche. Une ligne de semaine à 0 séance est une semaine sans entraînement.',
    '- Durée d\'une séance : de la première à la dernière série cochée. « ≈ » : une séance dont la fin n\'a pas été notée, durée estimée par ses repos (le repos de chaque série plus 40 s par série) ; une séance de plus de 8 h n\'a pas de durée.'
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
      if (j.debutHM || j.finHM) info.push((j.debutHM || '?') + ' → ' + (j.finHM || '?') + (j.duree ? ' (' + (j.dureeEstimee ? '≈ ' + dureeTexte(j.duree) + ', estimée' : dureeTexte(j.duree)) + ')' : ''));
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

  // ------------------------------------------------------------------
  // Le carnet PDF, pour un coach
  // ------------------------------------------------------------------
  // « Un carnet que tu regardes et tu dis : ok, ce mec fait ça, ça et ça. »
  // Page 1 : le profil d'un coup d'oeil (la phrase de synthese, le rythme,
  // ce qui est travaille, les habitudes, les exercices de base). Page 2 :
  // les records et la courbe des charges des exercices principaux. Page 3 :
  // le volume, la regularite et le temps passe. Ensuite : les huit
  // dernieres semaines, seance par seance, puis la legende.
  //
  // Chaque page est dessinee sur un canvas (les polices de l'app, des
  // graphiques nets), puis rangee dans le PDF en JPEG. Pas de bibliotheque :
  // le PDF n'est qu'une liste d'objets et une table d'adresses. Le dessin
  // note la boite de chaque texte pose : les tests verifient qu'aucun ne
  // chevauche un autre ni ne deborde de la page.
  var A4 = { l: 595.28, h: 841.89 };
  var ECH = 2.5;                  // 1 point = 2,5 pixels, environ 180 dpi
  var MARGE = 40;
  var COUL = {
    papier: '#ffffff', encre: '#17140f', encre2: '#57514a', encre3: '#8a8277', filet: '#e3ddd4',
    doux: '#f4f2ef', nuit: '#0c0b0a', nuitEncre: '#f5f2ec', nuitDim: '#a39b8f',
    orange: '#ff5c38', orangeFonce: '#c7401f', hausse: '#1c8a5a', baisse: '#c23b2a'
  };
  var SEMAINES_DETAIL = 8;

  // Les series d'un exercice, en notation de salle : trois series
  // identiques de suite s'ecrivent « 100×5×3 ».
  function seriesSalle(series) {
    var out = [];
    series.forEach(function (s) {
      var t = (s.type === TS.TYPES.ECHAUFFEMENT ? 'É ' : '') + (s.court || '') +
        (typeof s.rpe === 'number' ? ' @' + String(s.rpe).replace('.', ',') : '');
      var der = out[out.length - 1];
      if (der && der.t === t && s.type !== TS.TYPES.ECHAUFFEMENT && /×\d+$/.test(s.court || '')) der.n++;
      else out.push({ t: t, n: 1 });
    });
    return out.map(function (o) {
      if (o.n < 2) return o.t;
      var m = /^(.*?)( @[\d,]+)?$/.exec(o.t);
      return m[1] + '×' + o.n + (m[2] || '');
    }).join(' · ');
  }
  function tendance(p) {
    if (!p) return { t: '—', c: COUL.encre3 };
    if (p.gain >= 2) return { t: '+' + nombre(p.gain, 1) + ' %', c: COUL.hausse };
    if (p.gain <= -2) return { t: nombre(p.gain, 1) + ' %', c: COUL.baisse };
    return { t: 'stable', c: COUL.encre2 };
  }

  function octetsJpeg(cv, qualite) {
    var url = cv.toDataURL('image/jpeg', qualite || 0.88);
    var bin = atob(url.slice(url.indexOf(',') + 1));
    var o = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) o[i] = bin.charCodeAt(i);
    return o;
  }
  // Une chaine PDF en UTF-16 (les accents du titre).
  function chainePdf(t) {
    var h = 'FEFF';
    for (var i = 0; i < t.length; i++) h += ('000' + t.charCodeAt(i).toString(16)).slice(-4).toUpperCase();
    return '<' + h + '>';
  }
  // pages : [{ octets (JPEG), l, h (pixels) }] -> le PDF, une image par page A4.
  function pdfDepuisImages(pages, info) {
    var morceaux = [], decalages = [], taille = 0;
    function ajoute(o) { if (typeof o === 'string') o = utf8(o); morceaux.push(o); taille += o.length; }
    function objet(num, corps) { decalages[num] = taille; ajoute(num + ' 0 obj\n'); corps(); ajoute('\nendobj\n'); }
    ajoute('%PDF-1.4\n');
    ajoute(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));
    var n = pages.length, kids = [];
    for (var i = 0; i < n; i++) kids.push((4 + 3 * i) + ' 0 R');
    objet(1, function () { ajoute('<< /Type /Catalog /Pages 2 0 R >>'); });
    objet(2, function () { ajoute('<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>'); });
    objet(3, function () {
      ajoute('<< /Title ' + chainePdf(info.titre || 'Top Set') + ' /Producer (Top Set) /Creator (Top Set)' +
        (info.date ? ' /CreationDate (D:' + info.date + ')' : '') + ' >>');
    });
    pages.forEach(function (p, i) {
      var page = 4 + 3 * i, contenu = page + 1, image = page + 2;
      var flux = 'q ' + A4.l + ' 0 0 ' + A4.h + ' 0 0 cm /Im0 Do Q';
      objet(page, function () {
        ajoute('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + A4.l + ' ' + A4.h + '] ' +
          '/Resources << /XObject << /Im0 ' + image + ' 0 R >> /ProcSet [/PDF /ImageC] >> /Contents ' + contenu + ' 0 R >>');
      });
      objet(contenu, function () { ajoute('<< /Length ' + flux.length + ' >>\nstream\n' + flux + '\nendstream'); });
      objet(image, function () {
        ajoute('<< /Type /XObject /Subtype /Image /Width ' + p.l + ' /Height ' + p.h +
          ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.octets.length + ' >>\nstream\n');
        ajoute(p.octets);
        ajoute('\nendstream');
      });
    });
    var total = 4 + 3 * n, xref = taille;
    var table = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (var k = 1; k < total; k++) table += ('000000000' + decalages[k]).slice(-10) + ' 00000 n \n';
    ajoute(table + 'trailer\n<< /Size ' + total + ' /Root 1 0 R /Info 3 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    return concat(morceaux);
  }

  // opts : { creerCanvas: function () -> canvas, police: { titre, texte } }
  function carnetPdf(a, opts) {
    var P = (opts && opts.police) || {};
    var FT = P.titre || 'sans-serif', FX = P.texte || 'sans-serif';
    var cv = opts.creerCanvas();
    cv.width = Math.round(A4.l * ECH);
    cv.height = Math.round(A4.h * ECH);
    var x = cv.getContext('2d');
    var m = a.modele, p = a.profil;
    var L = A4.l - 2 * MARGE, BAS = A4.h - 52;
    var pages = [], boites = [], page = 0, y = 0, sectionCourante = '';

    // -------- les outils de dessin, en points
    function police(taille, graisse, famille) { x.font = (graisse || 400) + ' ' + taille + 'px ' + (famille || FX); }
    function largeur(t, taille, graisse, famille) { police(taille, graisse, famille); return x.measureText(String(t)).width; }
    function couper(s, max) {
      if (x.measureText(s).width <= max) return s;
      while (s.length > 1 && x.measureText(s + '…').width > max) s = s.slice(0, -1);
      return s.replace(/[\s·,]+$/, '') + '…';
    }
    // o : { taille, graisse, famille, couleur, align, max }
    function texte(t, px, py, o) {
      o = o || {};
      var taille = o.taille || 9;
      police(taille, o.graisse, o.famille);
      var s = String(t);
      if (o.max) s = couper(s, o.max);
      x.fillStyle = o.couleur || COUL.encre;
      x.textAlign = o.align || 'left';
      x.textBaseline = 'alphabetic';
      x.fillText(s, px, py);
      var w = x.measureText(s).width;
      var gx = o.align === 'right' ? px - w : o.align === 'center' ? px - w / 2 : px;
      if (!o.libre) boites.push({ page: page, x: gx, y: py - taille * 0.76, l: w, h: taille * 0.98, t: s });
      return w;
    }
    function lignes(t, max) {
      var mots = String(t).split(/\s+/), out = [], cur = '';
      mots.forEach(function (mo) {
        var essai = cur ? cur + ' ' + mo : mo;
        if (!cur || x.measureText(essai).width <= max) cur = essai;
        else { out.push(cur); cur = mo; }
      });
      if (cur) out.push(cur);
      return out;
    }
    function paragraphe(t, px, py, max, o) {
      police(o.taille, o.graisse, o.famille);
      var ls = lignes(t, max);
      ls.forEach(function (l, i) { texte(l, px, py + i * o.interligne, o); });
      return ls.length * o.interligne;
    }
    function rect(px, py, l, h, c) { x.fillStyle = c; x.fillRect(px, py, l, h); }
    function trait(x1, y1, x2, y2, c, ep, tirets) {
      x.strokeStyle = c || COUL.filet; x.lineWidth = ep || 0.5;
      x.setLineDash(tirets || []);
      x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke();
      x.setLineDash([]);
    }
    function rond(px, py, r, c) { x.fillStyle = c; x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill(); }
    function etiquette(t, px, py, c) {
      if ('letterSpacing' in x) x.letterSpacing = '0.9px';
      texte(String(t).toUpperCase(), px, py, { taille: 7, graisse: 700, couleur: c || COUL.encre3 });
      if ('letterSpacing' in x) x.letterSpacing = '0px';
    }

    // -------- les pages
    function debutPage() {
      page++;
      x.setTransform(ECH, 0, 0, ECH, 0, 0);
      rect(0, 0, A4.l, A4.h, COUL.papier);
      y = MARGE;
    }
    function piedDePage() {
      trait(MARGE, A4.h - 38, A4.l - MARGE, A4.h - 38, COUL.filet, 0.5);
      var qui = m.pseudo ? 'Carnet de ' + m.pseudo : 'Carnet d\'entraînement';
      texte('TOP SET · ' + qui + ' · édité le ' + dateLongue(a.aujourdhui), MARGE, A4.h - 26, { taille: 7, couleur: COUL.encre3, max: L - 60 });
      texte('page ' + page, A4.l - MARGE, A4.h - 26, { taille: 7, couleur: COUL.encre3, align: 'right' });
    }
    function finPage() {
      piedDePage();
      pages.push({ octets: octetsJpeg(cv), l: cv.width, h: cv.height });
    }
    function enTete(titre, sous, suite) {
      if (!suite) sectionCourante = titre;
      texte('TOP SET', MARGE, y + 8, { taille: 7.5, graisse: 800, famille: FT, couleur: COUL.orangeFonce });
      texte(titre, MARGE, y + 30, { taille: 20, graisse: 800, famille: FT });
      if (sous) texte(sous, A4.l - MARGE, y + 30, { taille: 8, couleur: COUL.encre2, align: 'right', max: L - largeur(titre, 20, 800, FT) - 20 });
      y += 40;
      trait(MARGE, y, A4.l - MARGE, y, COUL.encre, 1);
      y += 18;
    }
    // Il faut h points : sinon, page suivante, avec le meme titre.
    function place(h) {
      if (y + h <= BAS) return;
      finPage(); debutPage();
      enTete(sectionCourante + ' (suite)', '', true);
    }
    function titreBloc(t, sous) {
      place(40);
      etiquette(t, MARGE, y + 7);
      if (sous) texte(sous, A4.l - MARGE, y + 7, { taille: 7, couleur: COUL.encre3, align: 'right', max: L - largeur(t.toUpperCase(), 7, 700) - 30 });
      y += 13;
    }

    // -------- page 1 : le profil
    debutPage();
    var hBande = 128;
    rect(0, 0, A4.l, hBande, COUL.nuit);
    var wTop = texte('TOP', MARGE, 52, { taille: 26, graisse: 800, famille: FT, couleur: COUL.nuitEncre });
    var wSet = largeur('SET', 26, 800, FT);
    rect(MARGE + wTop + 4, 30, wSet + 10, 29, COUL.orange);
    texte('SET', MARGE + wTop + 9, 52, { taille: 26, graisse: 800, famille: FT, couleur: COUL.nuit });
    etiquette('Carnet d\'entraînement', MARGE, 84, COUL.nuitDim);
    texte(m.pseudo || 'Mon carnet', MARGE, 108, { taille: 18, graisse: 700, famille: FT, couleur: COUL.nuitEncre, max: L * 0.55 });
    if (a.nb) {
      texte('Du ' + dateLongue(a.premier), A4.l - MARGE, 84, { taille: 9, couleur: COUL.nuitEncre, align: 'right' });
      texte('au ' + dateLongue(a.dernier), A4.l - MARGE, 98, { taille: 9, couleur: COUL.nuitEncre, align: 'right' });
    }
    texte('édité le ' + dateLongue(a.aujourdhui), A4.l - MARGE, 112, { taille: 7.5, couleur: COUL.nuitDim, align: 'right' });
    y = hBande + 30;
    sectionCourante = 'Son profil';

    etiquette('En une phrase', MARGE, y);
    y += 20;
    y += paragraphe(a.synthese, MARGE, y, L, { taille: 15, graisse: 700, famille: FT, interligne: 20 });
    y += 6;

    // Les quatre chiffres.
    var tuiles = [
      { t: 'Séances', v: nombre(a.nb, 0), s: a.nb ? 'depuis le ' + dateCourteAn(a.premier) : '' },
      { t: 'Par semaine', v: nombre(p.semainesRecentes >= 4 ? p.parSemaineRecente : p.parSemaine, 1), s: p.semainesRecentes >= 4 ? 'sur les ' + p.semainesRecentes + ' dernières' : 'depuis le début' },
      { t: 'Durée moyenne', v: (p.dureeRecente || p.dureeMoyenne) ? dureeTexte(p.dureeRecente || p.dureeMoyenne) : '—', s: p.seancesChronometrees ? pluriel(p.seancesChronometrees, 'séance') + ' chronométrée' + (p.seancesChronometrees > 1 ? 's' : '') : 'durée non mesurée' },
      { t: 'Séries par séance', v: nombre(p.seriesParSeance, 0), s: pluriel(p.totalSeries, 'série') + ' en tout' }
    ];
    var gT = 8, lT = (L - 3 * gT) / 4, hT = 62;
    tuiles.forEach(function (tu, i) {
      var tx = MARGE + i * (lT + gT);
      rect(tx, y, lT, hT, COUL.doux);
      etiquette(tu.t, tx + 10, y + 15);
      texte(tu.v, tx + 10, y + 40, { taille: 21, graisse: 800, famille: FT, max: lT - 20 });
      texte(tu.s, tx + 10, y + 53, { taille: 7, couleur: COUL.encre2, max: lT - 20 });
    });
    y += hT + 22;

    // Le rythme : les douze dernieres semaines contre l'objectif.
    var r = p.regularite;
    titreBloc('Son rythme', 'objectif : ' + pluriel(r.objectif, 'séance') + ' par semaine · tenu ' + pluriel(r.serie, 'semaine') + ' d\'affilée, ' + r.meilleure + ' au mieux');
    grapheSemaines(MARGE, y, L, 78, a.semaines.slice(-RECENT), r.objectif, true);
    y += 78 + 18;

    // Ce qui est travaille / ses habitudes : deux colonnes.
    var lCol = (L - 24) / 2, yCol = y;
    var recents = Object.keys(p.groupesRecents).length && p.seancesRecentes >= 4;
    var gs = recents ? p.groupesRecents : p.groupes;
    var totG = Object.keys(gs).reduce(function (t, k) { return t + gs[k]; }, 0);
    etiquette('Ce qu\'il travaille', MARGE, y + 7);
    texte(recents ? 'séries, 12 dernières semaines' : 'séries, depuis le début', MARGE + lCol, y + 7, { taille: 7, couleur: COUL.encre3, align: 'right' });
    var yg = y + 22;
    trier(gs).slice(0, 7).forEach(function (g) {
      var part = totG ? gs[g] / totG : 0;
      texte(g, MARGE, yg + 7, { taille: 8.5, graisse: 600, max: 70 });
      var bx = MARGE + 74, bl = lCol - 74 - 58;
      rect(bx, yg, bl, 9, COUL.doux);
      rect(bx, yg, Math.max(1.5, bl * part), 9, (m.couleurs && m.couleurs[g]) || COUL.encre3);
      texte(Math.round(part * 100) + ' %', MARGE + lCol - 26, yg + 7.5, { taille: 8, graisse: 700, align: 'right' });
      texte(nombre(gs[g], 0), MARGE + lCol, yg + 7.5, { taille: 7, couleur: COUL.encre3, align: 'right' });
      yg += 16;
    });

    var xH = MARGE + lCol + 24;
    etiquette('Ses habitudes', xH, y + 7);
    var hab = [];
    var jOrd = [0, 1, 2, 3, 4, 5, 6].filter(function (i) { return p.joursSemaine[i] >= Math.max(1, a.nb * 0.12); })
      .sort(function (i, k) { return p.joursSemaine[k] - p.joursSemaine[i] || i - k; }).slice(0, 4).sort(function (i, k) { return i - k; });
    if (jOrd.length) hab.push(['Jours', jOrd.map(function (i) { return JOURS[i]; }).join(', ')]);
    var mo = p.moments, totM = mo.matin + mo.midi + mo.aprem + mo.soir;
    if (totM >= 3) {
      var dom = ['matin', 'midi', 'aprem', 'soir'].sort(function (u, v) { return mo[v] - mo[u]; })[0];
      hab.push(['Moment', { matin: 'le matin', midi: 'le midi', aprem: 'l\'après-midi', soir: 'le soir' }[dom] + ' (' + Math.round(100 * mo[dom] / totM) + ' %)']);
    }
    if (p.nbRepos >= 10) hab.push(['Repos', reposTexte(p.reposMedian) + ' entre deux séries (médiane)']);
    hab.push(['Intensité', p.nbRpe >= 10 ? 'RPE moyen ' + nombre(p.rpeMoyen, 1) + ' sur 10' : 'RPE peu ou pas noté']);
    var f = p.fourchettes, tf = f.force + f.hypertrophie + f.endurance;
    if (tf >= 10) hab.push(['Répétitions', Math.round(100 * f.hypertrophie / tf) + ' % à 6–12 · ' + Math.round(100 * f.force / tf) + ' % à 1–5 · ' + Math.round(100 * f.endurance / tf) + ' % au-delà']);
    if (p.seancesTypes.length) hab.push(['Séances types', p.seancesTypes.slice(0, 3).map(function (t) { return t.titre + ' (' + t.fois + ')'; }).join(' · ')]);
    if (a.poids) {
      var po = a.poids;
      hab.push(['Poids du corps', nombre(po.dernier.poids, 1) + ' kg' + (po.reference ? ' (' + (po.ecart >= 0 ? '+' : '') + nombre(po.ecart, 1) + ' kg depuis le ' + dateCourte(po.reference.date) + ')' : '')]);
    }
    if (p.heuresTotales >= 1) hab.push(['Temps passé', nombre(p.heuresTotales, 0) + ' h chronométrées']);
    var yh = y + 22;
    hab.forEach(function (h) {
      texte(h[0], xH, yh + 7, { taille: 7.5, couleur: COUL.encre3, max: 66 });
      police(8.5, 400);
      var ls = lignes(h[1], lCol - 70);
      ls.slice(0, 2).forEach(function (l, i) { texte(l, xH + 70, yh + 7 + i * 11, { taille: 8.5, max: lCol - 70 }); });
      yh += 6 + 11 * Math.min(2, ls.length);
    });
    y = Math.max(yg, yh) + 14;

    // Ses exercices de base.
    var base = a.exercices.filter(function (e) { return e.mode === 'reps'; })
      .sort(function (u, v) { return v.recentes - u.recentes || v.fois - u.fois; }).slice(0, 8);
    if (base.length) {
      titreBloc('Ses exercices de base', 'séances sur 12 semaines · dernier top set · tendance du 1RM estimé sur 12 semaines');
      var cols = [MARGE, MARGE + 190, MARGE + 250, MARGE + 380, A4.l - MARGE];
      base.forEach(function (e, i) {
        place(16);
        if (i % 2 === 0) rect(MARGE, y - 1, L, 15, COUL.doux);
        rond(MARGE + 5, y + 6.5, 2.6, (m.couleurs && m.couleurs[e.groupe]) || COUL.encre3);
        texte(e.nom, MARGE + 12, y + 9.5, { taille: 8.5, graisse: 600, max: 172 });
        texte(e.recentes ? nombre(e.recentes, 0) : '—', cols[1] + 30, y + 9.5, { taille: 8.5, align: 'right' });
        var der = e.points[e.points.length - 1];
        texte(der ? der.topSet.court + ' le ' + dateCourte(der.date) : '—', cols[2] + 10, y + 9.5, { taille: 8.5, couleur: COUL.encre2, max: 120 });
        var tdc = tendance(e.progressionRecente);
        texte(tdc.t, cols[4] - 6, y + 9.5, { taille: 8.5, graisse: 700, couleur: tdc.c, align: 'right' });
        y += 15;
      });
      y += 6;
    }
    finPage();

    // -------- page 2 : records et progression
    debutPage();
    enTete('Records et progression', a.nb ? pluriel(p.exercicesDifferents, 'exercice') + ' différents' : '');
    var parFois = a.exercices.filter(function (e) { return e.mode === 'reps' && e.fois >= 2; }).slice(0, 18);
    if (parFois.length) {
      titreBloc('Ses meilleures séries', 'du plus pratiqué au moins pratiqué');
      var c = { nom: MARGE + 12, fois: MARGE + 192, max: MARGE + 252, best: MARGE + 264, rm: MARGE + 410, evo: A4.l - MARGE - 6 };
      etiquette('Exercice', c.nom, y + 7);
      texte('SÉANCES', c.fois, y + 7, { taille: 7, graisse: 700, couleur: COUL.encre3, align: 'right' });
      texte('CHARGE MAX', c.max, y + 7, { taille: 7, graisse: 700, couleur: COUL.encre3, align: 'right' });
      etiquette('Meilleure série', c.best, y + 7);
      texte('1RM EST.', c.rm, y + 7, { taille: 7, graisse: 700, couleur: COUL.encre3, align: 'right' });
      texte('DÉBUT → FIN', c.evo, y + 7, { taille: 7, graisse: 700, couleur: COUL.encre3, align: 'right' });
      y += 14;
      parFois.forEach(function (e, i) {
        place(16);
        if (i % 2 === 0) rect(MARGE, y - 1, L, 15, COUL.doux);
        rond(MARGE + 5, y + 6.5, 2.6, (m.couleurs && m.couleurs[e.groupe]) || COUL.encre3);
        texte(e.nom, c.nom, y + 9.5, { taille: 8.5, graisse: 600, max: c.fois - c.nom - 34 });
        texte(nombre(e.fois, 0), c.fois, y + 9.5, { taille: 8.5, align: 'right' });
        texte(e.chargeMax ? nombre(e.chargeMax, 2) + ' kg' : '—', c.max, y + 9.5, { taille: 8.5, graisse: 700, align: 'right' });
        texte(e.meilleur ? e.meilleur.topSet.court + ' · ' + dateCourteAn(e.meilleur.date) : '—', c.best, y + 9.5, { taille: 8.5, couleur: COUL.encre2, max: c.rm - c.best - 40 });
        texte(e.meilleur ? nombre(e.meilleur.valeur, 1) : '—', c.rm, y + 9.5, { taille: 8.5, align: 'right' });
        var td = tendance(e.progression);
        var evo = e.progression ? nombre(e.progression.debut.rm, 0) + ' → ' + nombre(e.progression.fin.rm, 0) + '  ' + td.t : '—';
        texte(evo, c.evo, y + 9.5, { taille: 8.5, graisse: 600, couleur: td.c, align: 'right' });
        y += 15;
      });
      y += 18;
    }
    if (!parFois.length) {
      texte('Pas encore de record à montrer : il faut au moins deux séances d\'un même exercice.', MARGE, y + 10, { taille: 9, couleur: COUL.encre2, max: L });
      y += 28;
    }
    var aTemps = a.exercices.filter(function (e) { return e.mode !== 'reps' && e.meilleur; }).slice(0, 6);
    if (aTemps.length) {
      titreBloc('Au temps', 'meilleure série');
      aTemps.forEach(function (e) {
        place(14);
        texte(e.nom, MARGE + 12, y + 9, { taille: 8.5, graisse: 600, max: 200 });
        texte(e.meilleur.topSet.court + ' · ' + dateCourteAn(e.meilleur.date) + ' · ' + pluriel(e.fois, 'séance'), MARGE + 220, y + 9, { taille: 8.5, couleur: COUL.encre2, max: L - 220 });
        y += 14;
      });
      y += 14;
    }
    // La courbe des charges : le 1RM estime de chaque seance.
    var courbes = a.exercices.filter(function (e) { return e.mode === 'reps' && e.points.length >= 3; }).slice(0, 6);
    if (courbes.length) {
      titreBloc('La courbe des charges', '1RM estimé du top set, séance par séance (kg)');
      var gC = 14, lC = (L - 2 * gC) / 3, hC = 96;
      for (var ci = 0; ci < courbes.length; ci += 3) {
        place(hC + 10);
        courbes.slice(ci, ci + 3).forEach(function (e, k) { miniCourbe(MARGE + k * (lC + gC), y, lC, hC, e); });
        y += hC + 12;
      }
    }
    finPage();

    // -------- page 3 : volume, regularite, temps passe
    debutPage();
    enTete('Volume et régularité', a.nb ? pluriel(p.semainesActives, 'semaine') + ' actives sur ' + p.semaines : '');
    var sem52 = a.semaines.slice(-52);
    titreBloc('Séances par semaine', sem52.length < a.semaines.length ? 'les 52 dernières semaines' : 'depuis le début');
    grapheSemaines(MARGE, y, L, 96, sem52, r.objectif, false);
    y += 96 + 20;
    var sem16 = a.semaines.slice(-16);
    titreBloc('Séries par semaine et par groupe', 'les ' + sem16.length + ' dernières semaines');
    grapheGroupes(MARGE, y, L, 100, sem16);
    y += 100 + 34;
    var chronos = a.jours.filter(function (j) { return j.duree > 0; }).slice(-80);
    if (chronos.length >= 3) {
      titreBloc('Durée des séances', 'moyenne ' + dureeTexte(moyenne(chronos.map(function (j) { return j.duree; }))) + ' sur les ' + chronos.length + ' dernières séances chronométrées');
      grapheDurees(MARGE, y, L, 80, chronos);
      y += 80 + 20;
    }
    var repEx = a.exercices.filter(function (e) { return e.repos.length >= 5; }).slice(0, 6);
    if (repEx.length) {
      titreBloc('Repos par exercice', 'médiane des repos mesurés ou notés, échauffements exclus');
      var maxR = Math.max.apply(null, repEx.map(function (e) { return e.reposMedian; }));
      repEx.forEach(function (e) {
        place(14);
        texte(e.nom, MARGE, y + 8.5, { taille: 8.5, graisse: 600, max: 170 });
        var bl = L - 180 - 70;
        rect(MARGE + 180, y + 1.5, bl, 8, COUL.doux);
        rect(MARGE + 180, y + 1.5, Math.max(2, bl * e.reposMedian / maxR), 8, COUL.encre2);
        texte(reposTexte(e.reposMedian), A4.l - MARGE, y + 8.5, { taille: 8.5, graisse: 700, align: 'right' });
        y += 14;
      });
      y += 14;
    }
    var mois12 = a.mois.slice(-8).reverse();
    if (mois12.length) {
      titreBloc('Mois par mois', 'les ' + mois12.length + ' derniers, du plus récent au plus ancien');
      var cm = { mois: MARGE, sea: MARGE + 165, ser: MARGE + 228, tps: MARGE + 290, grp: MARGE + 306 };
      mois12.forEach(function (mo2, i) {
        place(15);
        if (i % 2 === 0) rect(MARGE, y - 1, L, 14, COUL.doux);
        texte(moisTexte(mo2.mois), cm.mois + 6, y + 9, { taille: 8.5, graisse: 600 });
        texte(pluriel(mo2.seances, 'séance'), cm.sea, y + 9, { taille: 8.5, align: 'right' });
        texte(pluriel(mo2.series, 'série'), cm.ser, y + 9, { taille: 8.5, align: 'right', couleur: COUL.encre2 });
        texte(mo2.duree ? dureeTexte(mo2.duree) : '', cm.tps, y + 9, { taille: 8.5, align: 'right', couleur: COUL.encre2 });
        texte(trier(mo2.groupes).slice(0, 3).join(', '), cm.grp, y + 9, { taille: 8.5, couleur: COUL.encre2, max: A4.l - MARGE - cm.grp - 6 });
        y += 14;
      });
    }
    finPage();

    // -------- pages suivantes : les dernieres semaines, seance par seance
    debutPage();
    enTete('Séance par séance', 'les ' + SEMAINES_DETAIL + ' dernières semaines, de la plus récente à la plus ancienne');
    var depuis = dateDe(epoque(lundiDe(a.aujourdhui)) - 7 * (SEMAINES_DETAIL - 1));
    var recentesJ = a.jours.filter(function (j) { return j.date >= depuis; }).reverse();
    if (!recentesJ.length) {
      texte('Aucune séance sur les ' + SEMAINES_DETAIL + ' dernières semaines.', MARGE, y + 10, { taille: 9, couleur: COUL.encre2 });
      y += 24;
    }
    var semaineEnCours = null;
    recentesJ.forEach(function (j) {
      var lu = lundiDe(j.date);
      if (lu !== semaineEnCours) {
        semaineEnCours = lu;
        var w = a.semaines.filter(function (s) { return s.lundi === lu; })[0];
        place(64);
        y += 4;
        etiquette('Semaine du ' + dateCourte(lu), MARGE, y + 7, COUL.orangeFonce);
        if (w) texte(pluriel(w.seances, 'séance') + ' · ' + pluriel(w.series, 'série') + (w.duree ? ' · ' + dureeTexte(w.duree) : ''), A4.l - MARGE, y + 7, { taille: 7, couleur: COUL.encre3, align: 'right' });
        y += 11;
        trait(MARGE, y, A4.l - MARGE, y, COUL.filet, 0.5);
        y += 6;
      }
      // La hauteur de la seance, pour ne pas la couper entre deux pages.
      var lNom = 150, lSer = L - lNom - 8;
      police(8, 400);
      var blocs = j.exos.map(function (e) { return { e: e, ls: lignes(seriesSalle(e.series), lSer) }; });
      var hSeance = 16 + blocs.reduce(function (t, b) { return t + 11 * b.ls.length + 1; }, 0) + (j.ressenti ? 11 : 0) + 8;
      place(Math.min(hSeance, BAS - MARGE - 80));
      var jour = JOURS[jourSemaine(j.date)];
      texte(jour.charAt(0).toUpperCase() + jour.slice(1) + ' ' + dateCourte(j.date) + ' — ' + j.titre, MARGE, y + 9, { taille: 9.5, graisse: 700, max: L - 130 });
      texte([j.duree ? dureeTexte(j.duree) : '', pluriel(j.stats.series, 'série')].filter(Boolean).join(' · '), A4.l - MARGE, y + 9, { taille: 8, couleur: COUL.encre2, align: 'right' });
      y += 16;
      blocs.forEach(function (b) {
        place(11 * b.ls.length + 2);
        rond(MARGE + 3, y + 5, 2, (m.couleurs && m.couleurs[b.e.groupe]) || COUL.encre3);
        texte(b.e.nom, MARGE + 9, y + 7.5, { taille: 8, graisse: 600, max: lNom - 12 });
        b.ls.forEach(function (l, i) { texte(l, MARGE + lNom, y + 7.5 + 11 * i, { taille: 8, couleur: COUL.encre2, max: lSer }); });
        y += 11 * b.ls.length + 1;
      });
      if (j.ressenti) {
        place(12);
        texte('« ' + j.ressenti.replace(/\s+/g, ' ') + ' »', MARGE + 9, y + 8, { taille: 7.5, couleur: COUL.encre3, max: L - 9 });
        y += 11;
      }
      y += 8;
    });

    // La legende, a la fin.
    var leg = [
      '100×5 : 5 répétitions à 100 kg. 100×5×3 : trois séries de 5 à 100 kg. PDC×12 : 12 répétitions au poids du corps.',
      '@8 : RPE 8 sur 10, l\'effort ressenti (10 = à l\'échec). É : série d\'échauffement.',
      'Top set : la série la plus lourde de la séance, hors échauffement et back-off.',
      '1RM estimé : formule d\'Epley, poids × (1 + reps / 30), jusqu\'à 12 répétitions. Une estimation, pas une charge soulevée.',
      'Tendance : écart du 1RM estimé entre la première et la dernière séance de la période ; « stable » à moins de 2 %.',
      'Repos : secondes entre deux séries, mesurées par l\'app ou notées. Semaines du lundi au dimanche.'
    ];
    place(30 + leg.length * 11);
    y += 6;
    trait(MARGE, y, A4.l - MARGE, y, COUL.filet, 0.5);
    y += 14;
    etiquette('Comment lire ce carnet', MARGE, y);
    y += 12;
    leg.forEach(function (l) { y += paragraphe(l, MARGE, y, L, { taille: 7.5, couleur: COUL.encre2, interligne: 10.5 }); });
    finPage();

    // -------- les graphiques
    function grapheSemaines(px, py, l, h, sem, obj, avecNombres) {
      if (!sem.length) return;
      var max = Math.max(obj + 1, Math.max.apply(null, sem.map(function (w) { return w.seances; })));
      var gauche = px + 16, base = py + h - 12, haut = py + (avecNombres ? 13 : 4), eY = (base - haut) / max;
      var pas = max > 6 ? 2 : 1;
      for (var v = 0; v <= max; v += pas) {
        var yy = base - v * eY;
        trait(gauche, yy, px + l, yy, COUL.filet, 0.5);
        texte(v, gauche - 5, yy + 2.5, { taille: 6.5, couleur: COUL.encre3, align: 'right' });
      }
      var n = sem.length, slot = (px + l - gauche) / n, bl = Math.max(1.5, slot * (n > 30 ? 0.72 : 0.58));
      var dernierLabel = -99;
      sem.forEach(function (w, i) {
        var bx = gauche + i * slot + (slot - bl) / 2, bh = w.seances * eY;
        if (w.seances) rect(bx, base - bh, bl, bh, w.seances >= obj ? COUL.orange : COUL.encre3);
        if (avecNombres && w.seances) texte(w.seances, bx + bl / 2, base - bh - 3, { taille: 7, graisse: 700, align: 'center', couleur: COUL.encre2 });
        var pa = parties(w.lundi);
        var debutMois = pa[2] <= 7;
        var cx = gauche + i * slot + slot / 2;
        if ((avecNombres || debutMois) && cx - dernierLabel > (avecNombres ? 26 : 22)) {
          var lab = avecNombres ? dateCourte(w.lundi) : MOIS_COURT[pa[1] - 1];
          if (cx + largeur(lab, 6.5) / 2 <= px + l) {
            texte(lab, cx, base + 9, { taille: 6.5, couleur: COUL.encre3, align: 'center' });
            dernierLabel = cx;
          }
        }
      });
      var yo = base - obj * eY;
      trait(gauche, yo, px + l, yo, COUL.orangeFonce, 0.8, [3, 2]);
    }
    function grapheGroupes(px, py, l, h, sem) {
      if (!sem.length) return;
      var ordre = (m.groupes || []).filter(function (g) { return sem.some(function (w) { return w.groupes[g]; }); });
      var max = Math.max(1, Math.max.apply(null, sem.map(function (w) { return w.series; })));
      var pasG = max > 60 ? 20 : max > 30 ? 10 : 5;
      max = Math.ceil(max / pasG) * pasG;
      var gauche = px + 20, base = py + h - 12, haut = py + 4, eY = (base - haut) / max;
      for (var v = 0; v <= max; v += pasG) {
        var yy = base - v * eY;
        trait(gauche, yy, px + l, yy, COUL.filet, 0.5);
        texte(v, gauche - 5, yy + 2.5, { taille: 6.5, couleur: COUL.encre3, align: 'right' });
      }
      var n = sem.length, slot = (px + l - gauche) / n, bl = slot * 0.62;
      var dernier = -99;
      sem.forEach(function (w, i) {
        var bx = gauche + i * slot + (slot - bl) / 2, yb = base;
        ordre.forEach(function (g) {
          var v2 = w.groupes[g] || 0;
          if (!v2) return;
          rect(bx, yb - v2 * eY, bl, v2 * eY, (m.couleurs && m.couleurs[g]) || COUL.encre3);
          yb -= v2 * eY;
        });
        var cx = gauche + i * slot + slot / 2;
        if (cx - dernier > 30) { texte(dateCourte(w.lundi), cx, base + 9, { taille: 6.5, couleur: COUL.encre3, align: 'center' }); dernier = cx; }
      });
      // La legende des couleurs, sous le graphique.
      var lx = gauche, ly = py + h + 12;
      ordre.forEach(function (g) {
        var w2 = largeur(g, 7.5) + 22;
        if (lx + w2 > px + l) { lx = gauche; ly += 11; }
        rect(lx, ly - 6, 7, 7, (m.couleurs && m.couleurs[g]) || COUL.encre3);
        texte(g, lx + 10, ly, { taille: 7.5, couleur: COUL.encre2 });
        lx += w2;
      });
    }
    function grapheDurees(px, py, l, h, js) {
      var max = Math.max(30, Math.max.apply(null, js.map(function (j) { return j.duree; })));
      var pasD = max > 120 ? 60 : 30;
      max = Math.ceil(max / pasD) * pasD;
      var gauche = px + 30, base = py + h - 12, haut = py + 4, eY = (base - haut) / max;
      for (var v = 0; v <= max; v += pasD) {
        var yy = base - v * eY;
        trait(gauche, yy, px + l, yy, COUL.filet, 0.5);
        texte(v ? dureeTexte(v) : '0', gauche - 5, yy + 2.5, { taille: 6.5, couleur: COUL.encre3, align: 'right' });
      }
      var e0 = epoque(js[0].date), e1 = epoque(js[js.length - 1].date), span = Math.max(1, e1 - e0);
      var moy = moyenne(js.map(function (j) { return j.duree; }));
      trait(gauche, base - moy * eY, px + l, base - moy * eY, COUL.orangeFonce, 0.8, [3, 2]);
      js.forEach(function (j) {
        var cx = gauche + 4 + (px + l - gauche - 8) * (epoque(j.date) - e0) / span;
        rond(cx, base - j.duree * eY, 2.1, COUL.encre);
      });
      texte(dateCourteAn(js[0].date), gauche, base + 9, { taille: 6.5, couleur: COUL.encre3 });
      texte(dateCourteAn(js[js.length - 1].date), px + l, base + 9, { taille: 6.5, couleur: COUL.encre3, align: 'right' });
    }
    function miniCourbe(px, py, l, h, e) {
      rect(px, py, l, h, COUL.doux);
      var td = tendance(e.progression);
      var wTd = largeur(td.t, 7.5, 700);
      texte(e.nom, px + 8, py + 13, { taille: 8.5, graisse: 700, max: l - 16 - wTd - 8 });
      var pts = e.points, vals = pts.map(function (pt) { return pt.valeur; });
      var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
      if (mx - mn < 2) { mn -= 1; mx += 1; }
      var marge = (mx - mn) * 0.12; mn -= marge; mx += marge;
      var gx = px + 8, gl = l - 16, top = py + 24, gb = py + h - 20;
      var e0 = epoque(pts[0].date), e1 = epoque(pts[pts.length - 1].date), span = Math.max(1, e1 - e0);
      var X0 = function (pt) { return gx + gl * (epoque(pt.date) - e0) / span; };
      var Y0 = function (v) { return gb - (gb - top) * (v - mn) / (mx - mn); };
      trait(gx, gb, gx + gl, gb, COUL.filet, 0.5);
      x.strokeStyle = COUL.encre; x.lineWidth = 1.1; x.lineJoin = 'round';
      x.beginPath();
      pts.forEach(function (pt, i) { var X1 = X0(pt), Y1 = Y0(pt.valeur); if (i) x.lineTo(X1, Y1); else x.moveTo(X1, Y1); });
      x.stroke();
      if (pts.length <= 40) pts.forEach(function (pt) { rond(X0(pt), Y0(pt.valeur), 1.4, COUL.encre); });
      var der = pts[pts.length - 1];
      rond(X0(der), Y0(der.valeur), 2.6, COUL.orange);
      texte(nombre(pts[0].valeur, 0), gx, gb + 11, { taille: 7, couleur: COUL.encre2 });
      texte(nombre(der.valeur, 0) + ' kg', gx + gl, gb + 11, { taille: 7.5, graisse: 700, align: 'right' });
      texte(td.t, px + l - 8, py + 13, { taille: 7.5, graisse: 700, couleur: td.c, align: 'right' });
    }

    return {
      octets: pdfDepuisImages(pages, { titre: 'Top Set — ' + (m.pseudo ? 'carnet de ' + m.pseudo : 'carnet d\'entraînement'), date: String(a.aujourdhui).replace(/-/g, '') + '000000' }),
      pages: pages.length,
      boites: boites,
      cadre: { l: A4.l, h: A4.h, marge: MARGE }
    };
  }

  // Ce que les tests regardent : aucun texte ne chevauche un autre, et tout
  // tient dans la page (marges comprises).
  function verifierMiseEnPage(res) {
    var pb = [], c = res.cadre;
    res.boites.forEach(function (b) {
      if (b.x < c.marge - 0.6 || b.x + b.l > c.l - c.marge + 0.6 || b.y < 0 || b.y + b.h > c.h) pb.push('déborde p.' + b.page + ' : ' + b.t);
    });
    var parPage = {};
    res.boites.forEach(function (b) { (parPage[b.page] = parPage[b.page] || []).push(b); });
    Object.keys(parPage).forEach(function (k) {
      var l = parPage[k];
      for (var i = 0; i < l.length; i++) {
        for (var j = i + 1; j < l.length; j++) {
          var u = l[i], v = l[j];
          var ix = Math.min(u.x + u.l, v.x + v.l) - Math.max(u.x, v.x);
          var iy = Math.min(u.y + u.h, v.y + v.h) - Math.max(u.y, v.y);
          if (ix > 0.8 && iy > 0.8) pb.push('chevauche p.' + k + ' : « ' + u.t + ' » / « ' + v.t + ' »');
        }
      }
    });
    return pb;
  }

  return {
    analyser: analyser,
    xlsx: xlsx,
    feuillesExcel: feuillesExcel,
    classeur: classeur,
    zip: zip,
    crc32: crc32,
    texteIA: texteIA,
    carnetPdf: carnetPdf,
    pdfDepuisImages: pdfDepuisImages,
    verifierMiseEnPage: verifierMiseEnPage,
    seriesSalle: seriesSalle,
    // Pour les tests et pour le carnet PDF.
    outils: {
      lundiDe: lundiDe, jourSemaine: jourSemaine, dateLongue: dateLongue, dateCourte: dateCourte,
      dateCourteAn: dateCourteAn, moisTexte: moisTexte, nombre: nombre, dureeTexte: dureeTexte,
      reposTexte: reposTexte, mediane: mediane, moyenne: moyenne, pluriel: pluriel, serieExcel: serieExcel
    }
  };
});
