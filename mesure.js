// Mesure d'audience : Vercel Web Analytics, sans cookie (decision du
// 18/09/2026, annoncee dans la politique de confidentialite 3.2).
//
// Le script de Vercel est servi par le site lui-meme (/_vercel/insights/) :
// aucune requete vers un tiers, et le CSP reste « 'self' ». Il ne compte que
// les pages vues, jamais le contenu du carnet.
//
// Seulement sur top-set.fr : en local ou sur une copie du site, ce chemin
// n'existe pas, et rien ne doit partir.
(function(){
  if (!/(^|\.)top-set\.fr$/.test(location.hostname)) return;
  window.va = window.va || function(){ (window.vaq = window.vaq || []).push(arguments); };
  var s = document.createElement('script');
  s.defer = true;
  s.src = '/_vercel/insights/script.js';
  document.head.appendChild(s);
})();
