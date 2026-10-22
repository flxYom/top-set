/* Top Set — le calculateur de disques de /outils/calculateur-de-disques.
 *
 * Fichier externe et non script en ligne : la CSP du site (script-src 'self')
 * refuse tout code ecrit dans la page. Le calcul vient de intelligence.js
 * (global TS), celui que les tests couvrent et que le carnet utilisera : la
 * page et l'app ne peuvent pas donner deux reponses differentes.
 *
 * Sans JavaScript, la page montre l'exemple calcule d'avance (82,5 kg) et le
 * tableau des charges courantes, qui suffit a repondre a la question.
 */
(function () {
  'use strict';
  var bloc = document.getElementById('calcDisques');
  if (!bloc || !window.TS) return;

  function $(id) { return document.getElementById(id); }
  var cible = $('d-cible'), barre = $('d-barre'), jeu = $('d-jeu');
  var sortie = $('d-cote'), detail = $('d-detail'), alerte = $('d-alerte');

  // Une virgule tapee au clavier francais compte comme un point.
  function nombre(champ) {
    var v = parseFloat(String(champ.value).replace(',', '.'));
    return isFinite(v) ? v : null;
  }
  function kg(x) { return Number(x).toLocaleString('fr-FR'); }
  function disponibles() {
    return Array.prototype.slice.call(jeu.querySelectorAll('input:checked'))
      .map(function (c) { return parseFloat(c.value); });
  }

  function dire(message) {
    alerte.textContent = message || '';
    alerte.hidden = !message;
  }

  function calculer() {
    var c = nombre(cible);
    var b = parseFloat(barre.value);
    var dispo = disponibles();

    if (c === null || c <= 0) {
      sortie.textContent = '—';
      detail.textContent = 'Entre la charge que tu veux soulever, barre comprise.';
      dire('');
      return;
    }
    if (!dispo.length) {
      sortie.textContent = '—';
      detail.textContent = '';
      dire('Coche au moins un disque : sans disque, il ne reste que la barre.');
      return;
    }

    var r = TS.chargerBarre(c, b, dispo);

    if (r.impossible) {
      sortie.textContent = '—';
      detail.textContent = '';
      dire(c < b
        ? 'Cette charge est sous le poids de la barre (' + kg(b) + ' kg) : c’est une barre plus légère qu’il te faut.'
        : 'Charge illisible.');
      return;
    }

    sortie.textContent = r.parCote.length
      ? r.parCote.map(kg).join(' + ')
      : 'rien';
    var n = r.parCote.length;
    detail.textContent = (n
        ? 'De chaque côté, du plus lourd au plus léger — ' + n + (n > 1 ? ' disques.' : ' disque.')
        : 'La barre seule.')
      + ' Total : ' + kg(r.total) + ' kg, barre de ' + kg(r.barre) + ' kg comprise.';

    // Ce qui ne se charge pas doit etre dit, pas arrondi en silence.
    if (r.ecart !== 0) {
      dire('Avec ces disques, ' + kg(c) + ' kg ne se charge pas : le plus proche en dessous est '
        + kg(r.total) + ' kg, soit ' + kg(Math.abs(r.ecart)) + ' kg de moins.');
    } else {
      dire('');
    }
  }

  cible.addEventListener('input', calculer);
  barre.addEventListener('change', calculer);
  jeu.addEventListener('change', calculer);
  calculer();
})();
