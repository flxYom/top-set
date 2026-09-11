/* Top Set — le tableau RPE de /outils/tableau-rpe.
 *
 * Fichier externe (CSP script-src 'self'). Chaque case porte data-n : les
 * repetitions faites plus celles en reserve (10 - RPE). Le pourcentage vient
 * de la formule d'Epley de intelligence.js (global TS), celle du carnet et du
 * calculateur, avec la meme limite de 12 repetitions. Une repetition vraiment
 * a fond est le 1RM lui-meme : 100 %.
 *
 * Sans JavaScript, la page montre deja le tableau en pourcentages.
 */
(function () {
  'use strict';
  var champ = document.getElementById('t-rm');
  var table = document.getElementById('t-rpe');
  if (!champ || !table || !window.TS) return;
  var unite = document.getElementById('t-unite');
  var cases = table.querySelectorAll('td[data-n]');

  function pourcentage(n) {
    if (n === 1) return 100;
    var rm = window.TS.epley(100, n);
    return rm === null ? null : 100 * 100 / rm;
  }
  // Au demi-kilo, comme le calculateur.
  function kg(x) { return (Math.round(x * 2) / 2).toLocaleString('fr-FR'); }

  function afficher() {
    var v = parseFloat(String(champ.value).replace(',', '.'));
    var rm = isFinite(v) && v > 0 && v < 1000 ? v : null;
    for (var i = 0; i < cases.length; i++) {
      var p = pourcentage(Number(cases[i].getAttribute('data-n')));
      cases[i].textContent = p === null ? '—' : rm === null ? String(Math.round(p)) : kg(rm * p / 100);
    }
    unite.textContent = rm === null
      ? 'En % du 1RM. Lignes : répétitions ; colonnes : RPE.'
      : 'En kg, pour un 1RM de ' + kg(rm) + ' kg (au demi-kilo). Lignes : répétitions ; colonnes : RPE.';
  }
  champ.addEventListener('input', afficher);
  afficher();
})();
