/* Top Set — les calculateurs des pages /outils.
 *
 * Fichier externe et non script en ligne : la CSP du site (script-src 'self')
 * refuse tout code ecrit dans la page. La formule vient de intelligence.js
 * (global TS), celle que le carnet utilise et que les tests couvrent : la page
 * et l'app donnent toujours le meme chiffre, limite de 12 repetitions comprise.
 *
 * Sans JavaScript, la page montre un exemple calcule d'avance (100 kg x 5).
 */
(function () {
  'use strict';
  var bloc = document.getElementById('calc1rm');
  if (!bloc || !window.TS) return;

  function $(id) { return document.getElementById(id); }
  var poids = $('c-poids'), reps = $('c-reps'), rpe = $('c-rpe'), pdc = $('c-pdc');
  var sortie = $('c-rm'), detail = $('c-detail'), alerte = $('c-alerte');
  var tReps = $('c-table-reps'), tPct = $('c-table-pct');

  // Une virgule tapee au clavier francais doit compter comme un point.
  function nombre(champ) {
    var v = parseFloat(String(champ.value).replace(',', '.'));
    return isFinite(v) ? v : null;
  }
  // Au demi-kilo : la plus petite difference qu'on charge sur une barre.
  function kg(x) { return (Math.round(x * 2) / 2).toLocaleString('fr-FR'); }
  function brzycki(charge, r) { return charge * 36 / (37 - r); }

  function lignes(corps, rangs) {
    corps.textContent = '';
    rangs.forEach(function (r) {
      var tr = document.createElement('tr');
      var a = document.createElement('td'); a.textContent = r[0];
      var b = document.createElement('td'); b.className = 'n'; b.textContent = r[1];
      tr.appendChild(a); tr.appendChild(b); corps.appendChild(tr);
    });
  }

  function vider(message) {
    sortie.textContent = '—';
    detail.textContent = '';
    alerte.textContent = message;
    alerte.hidden = false;
    lignes(tReps, []); lignes(tPct, []);
  }

  function calculer() {
    var p = nombre(poids), r = nombre(reps), e = rpe.value === '' ? null : parseFloat(rpe.value);
    var corps = nombre(pdc);
    if (p === null || p < 0 || r === null || r < 1 || Math.floor(r) !== r) {
      return vider('Entre une charge et un nombre entier de répétitions.');
    }
    var charge = p + (corps && corps > 0 ? corps : 0);
    if (charge <= 0) return vider('La charge doit être supérieure à zéro.');
    var possibles = r + (e === null ? 0 : 10 - e);
    var rm = TS.epley(charge, possibles);
    if (rm === null) {
      return vider("Au-delà de 12 répétitions possibles, l'estimation n'est plus fiable : le carnet Top Set refuse aussi de répondre.");
    }
    alerte.hidden = true;
    sortie.textContent = kg(rm) + ' kg';
    var phrase = "1RM estimé avec la formule d'Epley, celle du carnet Top Set. Avec Brzycki : "
      + kg(brzycki(charge, possibles)) + ' kg.';
    if (e !== null && e < 10) phrase += ' Compté comme ' + possibles.toLocaleString('fr-FR') + ' répétitions possibles.';
    if (corps && corps > 0) {
      var lest = rm - corps;
      phrase += lest > 0 ? ' Lest maximal estimé : ' + kg(lest) + ' kg.' : ' Ton 1RM estimé est sous ton poids du corps.';
    }
    if (possibles === 1) phrase += ' Pour une répétition à fond, ton 1RM est simplement la charge : Epley ajoute 3 %.';
    detail.textContent = phrase;
    lignes(tReps, [2, 3, 4, 5, 6, 8, 10, 12].map(function (n) { return [String(n), kg(rm / (1 + n / 30))]; }));
    lignes(tPct, [100, 95, 90, 85, 80, 75, 70, 65, 60].map(function (n) { return [n + ' %', kg(rm * n / 100)]; }));
  }

  [poids, reps, rpe, pdc].forEach(function (c) {
    c.addEventListener('input', calculer);
    c.addEventListener('change', calculer);
  });
  calculer();
})();
