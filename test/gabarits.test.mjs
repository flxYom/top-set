// Garde-fou sur le rendu HTML de index.html.
//
// L'app construit son interface par concatenation de chaines. C'est un choix
// assume — pas de framework, pas d'etape de build — mais il a un prix : rien
// n'empeche structurellement d'oublier un esc(). Un identifiant venu d'un
// fichier importe a deja pose un vrai gestionnaire onmouseover sur une carte,
// et il s'executait.
//
// Ces tests lisent le source et refusent les formes qui ont deja fait un trou.
// Ils ne remplacent pas une revue, ils empechent la rechute.
//
//   node test/gabarits.test.mjs

import { readFileSync } from 'fs';

// Le JS de l'app vit dans app.js depuis qu'on a retire 'unsafe-inline' de la
// CSP : sans etape de build, un script externe est le seul moyen de se passer
// de cette permission sur un hebergement statique.
// Fins de ligne ramenees a « \n » : sous Windows, Git rend les fichiers en
// CRLF, et la CI (Linux) les lit en LF. Un garde-fou qui cherchait « \r\n »
// passait ici et echouait en CI.
const lireLF = f => readFileSync(new URL(f, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const SRC  = lireLF('../app.js');
const HTML = lireLF('../index.html');
const SW   = lireLF('../sw.js');
const CFG  = lireLF('../vercel.json');

let pass = 0, fail = 0;
function ok(label, cond, detail = ''){
  if (cond){ pass++; console.log('  OK   ' + label); }
  else { fail++; console.log('  FAIL ' + label + (detail ? '  -> ' + detail : '')); }
}

console.log('\n== 1. Aucun identifiant interpole sans echappement ==');
// On cherche « + ex.id + » et « + s.id + » : ces objets viennent d'un fichier
// importe ou du cloud, donc leur id n'est pas digne de confiance.
const nus = [];
SRC.split('\n').forEach((l, i) => {
  const m = l.match(/\+\s*(?:ex|s|it|e)\.id\s*\+/g);
  if (m) nus.push('L' + (i + 1) + ' : ' + l.trim().slice(0, 90));
});
ok('aucun « + ex.id + » ou « + s.id + » nu', nus.length === 0, nus.join(' | '));

const echappes = (SRC.match(/esc\((?:ex|s)\.id\)/g) || []).length;
ok('les identifiants passent bien par esc()', echappes >= 6, echappes + ' occurrence(s)');
// La carte d'exercice echappe les siens une fois, dans sid et eid, puis ne
// se sert que d'eux.
ok('la carte les echappe avant de s en servir',
   SRC.indexOf('var sid = esc(s.id);') > -1 && SRC.indexOf('var eid = esc(ex.id);') > -1);

console.log('\n== 2. esc() couvre les cinq caracteres ==');
const bloc = SRC.slice(SRC.indexOf('function esc(s)'), SRC.indexOf('function esc(s)') + 500);
[['&', '&amp;'], ['<', '&lt;'], ['>', '&gt;'], ['"', '&quot;'], ["'", '&#39;']].forEach(([c, ent]) => {
  ok('esc() remplace ' + JSON.stringify(c) + ' par ' + ent, bloc.indexOf(ent) > -1);
});

console.log('\n== 3. Un identifiant reste un identifiant ==');
ok('ID_SUR existe', /var ID_SUR\s*=\s*\/\^\[A-Za-z0-9_-\]\{1,64\}\$\//.test(SRC));
// Les deux formes d'exercice (series, ou l'ancien poids/reps) sortent par le
// meme retour de normalizeExercise().
ok('idSur() est applique aux exercices', (SRC.match(/idSur\(ex[^)]*genId\)/g) || []).length >= 1);
ok('idSur() est applique aux series',    /idSur\(s && s\.id, genSerieId\)/.test(SRC));
// Les identifiants que l'app fabrique doivent evidemment passer son propre filtre.
const ID_SUR = /^[A-Za-z0-9_-]{1,64}$/;
['x1a2b3c', 's1a2b3c', '550e8400-e29b-41d4-a716-446655440000',
 'xmtudmna2ope6x'].forEach(id => {
  ok('l identifiant historique « ' + id.slice(0, 12) + '… » est accepte', ID_SUR.test(id));
});
['x1" onmouseover="alert(1)', '<img src=x>', 'a b', ''].forEach(id => {
  ok('l identifiant hostile ' + JSON.stringify(id.slice(0, 20)) + ' est refuse', !ID_SUR.test(id));
});

console.log('\n== 4. Le groupe est une valeur close ==');
ok('groupeSur() existe', /function groupeSur\(g\)/.test(SRC));
ok('il est applique a la normalisation', (SRC.match(/groupeSur\(ex/g) || []).length >= 1);

console.log('\n== 5. Le CSV ne fabrique pas de formule ==');
ok('csvTexte() existe', /function csvTexte\(v\)/.test(SRC));
ok('il garde = + - @ tab CR', /\^\[=\+\\-@\\t\\r\]/.test(SRC));
ok('les colonnes de texte y passent', (SRC.match(/csvTexte\(/g) || []).length >= 5);
// Les colonnes numeriques ne doivent PAS y passer : « -50 » deviendrait du
// texte dans le tableur, et une charge negative est legitime.
ok('les colonnes numeriques en sont exemptees', !/csvTexte\(csvNombre/.test(SRC));

console.log('\n== 6. L import est borne ==');
ok('IMPORT_MAX existe', /var IMPORT_MAX = 8 \* 1024 \* 1024/.test(SRC));
ok('la taille est verifiee avant JSON.parse',
   SRC.indexOf('text.length > IMPORT_MAX') > -1 &&
   SRC.indexOf('text.length > IMPORT_MAX') < SRC.indexOf('data = JSON.parse(text)'));
ok('le fichier est refuse avant FileReader', /f\.size > IMPORT_MAX/.test(SRC));
ok('les exercices memorises importes sont nettoyes', /nettoyerCustom\(data\.customExercises\)/.test(SRC));
ok('les cles de prototype sont ecartees', /k === '__proto__'/.test(SRC));

console.log('\n== 7. Le service worker se renouvelle ==');
const v = (SW.match(/var VERSION = '(topset-v\d+)'/) || [])[1];
ok('VERSION est nommee', !!v, String(v));
ok('les deux caches portent la version', /VERSION \+ '-coquille'/.test(SW) && /VERSION \+ '-courant'/.test(SW));
ok('les anciens caches sont supprimes a l activation',
   /caches\.keys\(\)/.test(SW) && /caches\.delete\(n\)/.test(SW));
ok('Supabase n est jamais mis en cache', /url\.origin !== self\.location\.origin/.test(SW));
ok('la page passe par le reseau d abord', SW.indexOf('estNavigation(req)') > -1);

console.log('\n== 8. Un carnet par compte ==');
// Le carnet local etait partage par tout l'appareil : deux comptes sur le meme
// telephone voyaient le meme carnet, et l'app proposait au second de l'envoyer
// sur SON compte. Ce qui suit verifie l'ordre des operations de l'echange —
// c'est la seule chose qui peut casser ici, et une inversion ferait perdre des
// donnees pour de bon.
//
// Les positions sont mesurees DANS la fonction concernee : rangerCarnet et
// viderCarnet apparaissent maintenant dans deconnecter() comme dans
// apresConnexion(), et une recherche globale comparait deux fonctions
// differentes.
function corps(depuis, jusqua){
  const a = SRC.indexOf(depuis);
  const b = jusqua ? SRC.indexOf(jusqua, a) : SRC.length;
  return (a > -1 && b > a) ? SRC.slice(a, b) : '';
}
function avant(bloc, x, y){
  const i = bloc.indexOf(x), j = bloc.indexOf(y);
  return i > -1 && j > -1 && i < j;
}

ok('les trois operations existent',
   SRC.indexOf('function rangerCarnet(') > -1 &&
   SRC.indexOf('function viderCarnet(') > -1 &&
   SRC.indexOf('function reprendreCarnet(') > -1);
ok('le carnet range est indexe par proprietaire', SRC.indexOf("'topset_carnet_' + id") > -1);
ok('un rangement plus riche n est jamais ecrase', SRC.indexOf('deja.jours || 0) > jours') > -1);
ok('la file d envoi est remise a zero avec le carnet',
   SRC.indexOf('m.sales = {}; m.titres = {}; m.depuis = null;') > -1);

// ---- a la connexion
const CO = corps('function apresConnexion(', 'function majUI(');
ok('connexion : la fonction est bien delimitee', CO.length > 500, CO.length + ' caracteres');
ok('connexion : joursLocaux est calcule avant d etre teste',
   avant(CO, 'var joursLocaux = joursRemplis(state.sessions)', '&& joursLocaux){'));
ok('connexion : un seul calcul initial de joursLocaux',
   (CO.match(/var joursLocaux/g) || []).length === 1);
// Deux branches font l'echange — le carnet anonyme d'un autre compte, et le
// carnet d'un autre compte connecte. Il faut verifier l'ordre DANS chacune :
// une comparaison globale melangeait le vidage de la premiere avec le
// rangement de la seconde, et passait pour une inversion.
["rangerCarnet('anon')", 'rangerCarnet(m.userId)'].forEach(function(depart){
  var i = CO.indexOf(depart);
  var branche = i > -1 ? CO.slice(i, i + 260) : '';
  ok('connexion, branche ' + depart + ' : range puis vide puis reprend',
     branche.indexOf('viderCarnet()') > -1 &&
     avant(branche, 'viderCarnet()', 'reprendreCarnet(user.id)'),
     JSON.stringify(branche.slice(0, 120)));
});
ok('connexion : la bascule precede la proposition d envoi',
   avant(CO, 'x.userId = user.id; x.migrePour = user.id;', 'if (m.migrePour !== user.id && joursLocaux)'));
ok('connexion : le carnet anonyme d un autre compte est range aussi',
   CO.indexOf("rangerCarnet('anon')") > -1);
ok('connexion : le meme compte reprend son carnet range',
   CO.indexOf('m.userId === user.id && !joursLocaux && reprendreCarnet(user.id)') > -1);

// ---- a la deconnexion
// Sans ce volet, celui qui ouvre l'app sans compte voit le carnet du dernier
// connecte. C'est le meme trou, par l'autre bout, et le plus visible sur un
// telephone qu'on prete.
const DECO = corps('function deconnecter(', 'function apresConnexion(');
ok('deconnexion : la fonction est bien delimitee', DECO.length > 300, DECO.length + ' caracteres');
ok('deconnexion : on range le carnet du partant', DECO.indexOf('rangerCarnet(partant)') > -1);
ok('deconnexion : on range AVANT de vider', avant(DECO, 'rangerCarnet(partant)', 'viderCarnet()'));
ok('deconnexion : on vide AVANT de reprendre', avant(DECO, 'viderCarnet()', "reprendreCarnet('anon')"));
ok('deconnexion : le carnet anonyme revient', DECO.indexOf("reprendreCarnet('anon')") > -1);
ok('deconnexion : le proprietaire est oublie', DECO.indexOf('m.userId = null') > -1);

console.log('\n== 9. La CSP peut rester stricte ==');
// 'unsafe-inline' sur script-src laissait passer exactement le XSS trouve plus
// haut : l'attribut onmouseover injecte s'executait. Sans cette permission, le
// navigateur l'aurait refuse meme sans le correctif. On veut les deux, pas l'un.
ok('script-src ne contient plus unsafe-inline',
   !/script-src[^;]*unsafe-inline/.test(CFG), (CFG.match(/script-src[^;]*/) || [])[0]);
ok('style-src garde unsafe-inline, et c est assume',
   /style-src[^;]*unsafe-inline/.test(CFG));
ok('aucun script inline dans index.html', !/<script>/.test(HTML));
ok('aucun gestionnaire inline dans index.html', !/<[a-z]+[^>]* on[a-z]+=/i.test(HTML));
ok('aucune URL javascript:', HTML.indexOf('javascript:') === -1);
ok('app.js est precache par le service worker', SW.indexOf("'app.js'") > -1);
ok('frame-ancestors none', CFG.indexOf("frame-ancestors 'none'") > -1);
ok('object-src none', CFG.indexOf("object-src 'none'") > -1);
[['X-Content-Type-Options', 'nosniff'],
 ['X-Frame-Options', 'DENY'],
 ['Strict-Transport-Security', 'max-age'],
 ['Referrer-Policy', 'strict-origin'],
 ['Permissions-Policy', 'camera=()']].forEach(function(x){
  ok('en-tete ' + x[0], CFG.indexOf(x[0]) > -1 && CFG.indexOf(x[1]) > -1);
});

console.log('\n== 10. Pas de secret dans ce qui est servi ==');
[/service_role\s*[:=]\s*['"]/, /sb_secret_[A-Za-z0-9]/, /SUPABASE_SERVICE_ROLE_KEY\s*=/].forEach((re, i) => {
  ok('aucun secret de forme ' + i, !re.test(SRC));
});

console.log('\n== 11. Une seule messagerie, et elle se comporte comme une messagerie ==');
// Le support et le coaching avaient chacun leur fil, dans deux feuilles
// differentes, et un ticket ne pouvait pas recevoir de reponse. Tout passe
// maintenant par une seule boite. Ce qui suit fige ce qui en fait un chat et
// pas un formulaire — et les pieges dans lesquels les versions precedentes
// sont tombees.

const MSG = corps('// MESSAGES\n', '// COACH\n');
ok('la section MESSAGES est bien delimitee', MSG.length > 3000, MSG.length + ' caracteres');

ok('quatre points de vue, un seul rendu',
   MSG.indexOf("type:'support', je:'membre'") > -1 && MSG.indexOf("je:'admin'") > -1
   && SRC.indexOf("type:'coach', je:'client'") > -1 && SRC.indexOf("type:'coach', je:'coach'") > -1);

// Un fil vide se cachait : la conversation ne pouvait commencer que si elle
// avait deja commence.
ok('une conversation vide s ouvre quand meme',
   corps('function bullesHTML(', 'function attenteHTML(').indexOf("'<div class=\"fil-vide\">'") > -1
   && corps('function renderMessages(', 'function renderBoite(').indexOf('if (!rows.length)') === -1);
ok('l equipe apparait toujours dans la boite d un membre, meme sans message',
   corps('function conversationsDe(', 'function ligneConvHTML(').indexOf('out.push(e);') > -1);

ok('la bulle d attente existe et n est pas stockee',
   SRC.indexOf('function attenteHTML(') > -1
   && SRC.indexOf('rows[rows.length - 1].auteur !== monAuteur') > -1
   && MSG.indexOf("attenteHTML(rows, 'membre')") > -1);

const CHC = corps('function chargerConv(', 'function ajusterChamp(');
ok('une reponse lente n ecrit pas dans une conversation qu on a quittee',
   (CHC.match(/if \(conv !== c[^)]*\) return;/g) || []).length === 2);
ok('on ne marque lu que ce que l autre a ecrit',
   CHC.indexOf('m.auteur !== c.je') > -1);
ok('et l accuse automatique ne se « lit » pas cote equipe',
   CHC.indexOf("!(c.je === 'admin' && m.auteur === 'systeme')") > -1);
ok('une releve sans nouveaute ne repeint rien (et ne fait pas sauter la page)',
   CHC.indexOf("if (mode === 'releve' && cle === convCle) return;") > -1);
ok('on ne descend pas sous le nez de qui relit plus haut',
   CHC.indexOf("var enBas = mode !== 'releve' || presDuBas();") > -1);
ok('et rien ne s anime pour qui a demande le calme',
   corps('function allerEnBas(', 'function chargerConv(').indexOf('prefers-reduced-motion') > -1);

ok('Entree envoie, Maj+Entree va a la ligne',
   MSG.indexOf("e.key === 'Enter' && !e.shiftKey") > -1);
ok('le nom ne se met qu au-dessus de ce que dit l autre',
   corps('function bullesHTML(', 'function attenteHTML(').indexOf(": esc(qui) + ' · ')") > -1);
ok('l accuse automatique n est jamais « moi » pour un membre',
   corps('function bullesHTML(', 'function attenteHTML(').indexOf("var moi = sys ? (monAuteur === 'admin')") > -1);

// La releve : seulement quand on regarde. Pas un battement de coeur pour
// garder la base eveillee.
const MIN = corps('function relancerMinuteur(', 'var badgeQuand');
ok('on ne releve que la page ouverte et visible',
   MIN.indexOf("state.view !== 'messages' || document.hidden") > -1);
ok('et le minuteur s arrete en quittant la page',
   corps('function montrerVue(', "document.getElementById('mainTabs')").indexOf('clearInterval(minuteurMessages)') > -1);

console.log('\n== 12. La pastille ==');
const NLT = corps('nonLusTotal:function()', 'apercuCoach:function()');
ok('elle compte sans rapatrier les messages', NLT.indexOf("{ count:'exact', head:true }") > -1);
ok('elle ne casse jamais la page', NLT.indexOf('function(){ return 0; }') > -1);
ok('l equipe ne compte pas ses propres messages', NLT.indexOf(".neq('user_id', user.id)") > -1);
ok('le compteur coach ne casse jamais la page non plus',
   SRC.indexOf('}, function(){ return {}; });') > -1);
ok('elle est dans l en-tete, pas cachee dans une feuille',
   HTML.indexOf('id="messagesBadge" hidden') > -1
   && HTML.indexOf('id="messagesBadge"') < HTML.indexOf('<nav class="topbar">'));
ok('elle ne s interroge pas plus d une fois toutes les huit secondes',
   corps('function majBadgeMessages(', 'setInterval(').indexOf('Date.now() - badgeQuand < 8000') > -1);

console.log('\n== 13. Toute demande peut recevoir une reponse ==');
ok('un retour se repond — s il a encore un auteur',
   SRC.indexOf("(x.user_id ? '<button type=\"button\" class=\"admin-action\" data-ecrire=") > -1);
ok('un inscrit s ecrit',
   SRC.indexOf("'<button type=\"button\" class=\"admin-action\" data-ecrire=\"' + esc(x.user_id)") > -1);
ok('repondre a un retour nouveau le passe en LU',
   SRC.indexOf("if (b.dataset.retour) Sync.adminMarquer(b.dataset.retour, 'vu')") > -1);
ok('un retour envoye emmene dans sa conversation',
   corps("getElementById('retourEnvoyer').addEventListener", '// ====').indexOf('ouvrirConversation(convEquipe())') > -1);
// Les boutons sont DANS des cartes cliquables : si la carte est testee
// d'abord, le bouton ouvre le carnet au lieu de la conversation.
const LCOACH = corps("getElementById('coachContenu').addEventListener", '// ====');
ok('le bouton MESSAGES passe avant la carte qui le contient',
   LCOACH.indexOf('[data-fil-client]') > -1
   && LCOACH.indexOf('[data-fil-client]') < LCOACH.indexOf('[data-ouvrir-coache]'));
const LMON = corps("getElementById('monCoachEtat').addEventListener", "getElementById('coachOuvrir')");
ok('et ECRIRE A TON COACH avant COUPER L ACCES',
   LMON.indexOf('[data-fil-coach]') > -1
   && LMON.indexOf('[data-fil-coach]') < LMON.indexOf('[data-couper]'));
ok('un suivi termine se relit sans s ecrire',
   MSG.indexOf("'SUIVI TERMINÉ', c, false") > -1 && MSG.indexOf("document.getElementById('convSaisie').hidden = !peut;") > -1);
ok('plus aucune trace des anciens fils',
   !/ouvrirFilCoach|chargerConversation|coachFilSheet|adminFilsListe/.test(SRC + HTML));
ok('une table absente se dit en francais',
   SRC.indexOf('pas encore activé sur le serveur') > -1);

// « .pastille » etait deja pris par les voyants d'etat. Une regle nue du meme
// nom leur ajoutait une marge sans que rien ne le signale.
ok('aucune regle nue « .pastille » ne deborde sur les voyants d etat',
   !/\n\s*\.pastille\s*\{/.test(HTML));

console.log('\n== 14. Sur telephone ==');
ok('le double-tap ne zoome plus', /html\{touch-action:manipulation;\}/.test(HTML));
ok('les champs de moins de 16 px ne font plus zoomer iOS',
   /@supports \(-webkit-touch-callout:none\)\{[^}]*\.sheet-input[^}]*font-size:16px;/.test(HTML));
ok('la barre des onglets se colle sous la barre d etat de l iPhone',
   HTML.indexOf('.topbar{top:var(--haut);}') > -1 && HTML.indexOf('--haut:env(safe-area-inset-top,0px)') > -1);
ok('et une bande opaque couvre cette zone', /body::before\{[^}]*height:var\(--haut\)/.test(HTML));
ok('le bouton « revenir en haut » existe', HTML.indexOf('id="hautBtn"') > -1);
ok('il ecoute le defilement sans le ralentir',
   SRC.indexOf("}, { passive:true });") > -1 && SRC.indexOf('requestAnimationFrame(majBoutonHaut)') > -1);
ok('et il respecte le calme demande',
   corps("hautBtn.addEventListener('click'", '});').indexOf('prefers-reduced-motion') > -1);
// « font: 800 10px/1 inherit » est invalide : le navigateur jetait toute la
// declaration, et ces boutons tombaient dans la police du systeme.
ok('aucun raccourci font: ... inherit invalide', !/font:[^;]*\dpx[^;]*\binherit;/.test(HTML));

console.log('\n== 15. Gainage, planche : au temps ==');
ok('la duree s ecrit avec son unite, dans le champ des reps',
   SRC.indexOf('found.serie.reps = TS.ecrireDuree(sec)') > -1);
ok('une serie deja notee n est jamais reinterpretee',
   corps('function estAuTemps(', 'function secondesAffichees(').indexOf('if (remplies.length) return remplies.some(TS.serieAuTemps);') > -1);
ok('la chaise romaine n est pas un gainage', SRC.indexOf('chaise(?!\\s+romaine)') > -1);
ok('le record au temps est la serie la plus longue', SRC.indexOf('function recordDuree(') > -1);
ok('la bascule n encombre pas un exercice deja note en kilos',
   SRC.indexOf('auTemps || nomAuTemps(ex.nom) || !series.some(serieRemplie)') > -1);
ok('le mode choisi survit a la normalisation',
   (SRC.match(/mesure:mesure/g) || []).length === 1);

console.log('\n== 16. Importer ajoute, ne remplace plus ==');
ok('plus de bouton REMPLACER', HTML.indexOf('REMPLACER MES DONN') === -1 && SRC.indexOf('REMPLACER MES DONN') === -1);
ok('l import passe par la fusion', SRC.indexOf('TS.fusionnerCarnets(state.sessions, parsed.sessions, fabriqueId)') > -1);
ok('et elle est refaite au moment de confirmer',
   corps('function appliquerImport(', 'var pendingBackup').indexOf('TS.fusionnerCarnets(') > -1);
ok('seules les journees qui ont bouge repartent vers le compte',
   corps('function appliquerImport(', 'var pendingBackup').indexOf('r.bilan.dates.forEach') > -1);
ok('le titre d une seance est relu a l import', SRC.indexOf('clean[ds].titre = day.titre.trim().slice(0, 60)') > -1);
ok('le tableur se relit aussi', SRC.indexOf('TS.lireCsvCarnet(t)') > -1 && /accept="[^"]*\.csv/.test(HTML));
ok('et il passe par le meme nettoyage que le JSON',
   SRC.indexOf('return parseBackup(JSON.stringify({ sessions: lu.sessions }));') > -1);

console.log('\n== 17. Profil et donnees : deux portes ==');
ok('le compte est dans la feuille du profil',
   HTML.indexOf('id="compteSection"') > HTML.indexOf('id="profilSheet"'));
ok('et plus dans celle des donnees',
   HTML.indexOf('id="compteSection"') > HTML.indexOf('id="dataSheet"')
   && HTML.indexOf('id="profilSheet"') > HTML.indexOf('id="dataImport"'));
ok('Echap ferme la feuille ouverte, quelle qu elle soit',
   SRC.indexOf("if (e.key === 'Escape') fermerFeuilles();") > -1);
ok('ouvrir une page depuis une feuille ferme la feuille',
   (SRC.match(/fermerFeuilles\(\);/g) || []).length >= 6);

console.log('\n== 18. Ce que le site publie ==');
// Vercel publie tout le depot, sauf ce que .vercelignore ecarte. Le schema,
// les tests et le journal y etaient lisibles : rien de secret, rien a servir.
const IGN = readFileSync(new URL('../.vercelignore', import.meta.url), 'utf8').split(/\r?\n/).map(l => l.trim());
for (const x of ['supabase/', 'test/', 'docs/', '.github/', 'screenshots/', 'CHANGELOG.md', 'README.md', 'contenu/', 'scripts/'])
  ok('pas publie : ' + x, IGN.includes(x));
// L'inverse compte autant : les pages generees et ce qu'elles chargent doivent
// etre servis. Un « outils/ » ecarte par megarde casserait le calculateur.
for (const x of ['documentation/', 'entrainement/', 'exercices/', 'outils/', 'img/', 'contenu.css', 'intelligence.js', 'apprendre.html'])
  ok('publie : ' + x, !IGN.includes(x) && !IGN.includes(x.replace(/\/$/, '')));
const PRECHARGE = (SW.match(/A_PRECHARGER = \[([\s\S]*?)\]/) || [])[1] || '';
ok('et rien de ce que le service worker precharge n en fait partie',
   !IGN.filter(x => x && !x.startsWith('#'))
       .some(x => PRECHARGE.indexOf("'" + x + (x.endsWith('/') ? '' : "'")) > -1));
ok('pas de connexion temps reel ouverte, donc pas de wss dans la CSP',
   SRC.indexOf('.channel(') === -1 && CFG.indexOf('wss:') === -1);

console.log('\n== 19. iPhone : ni croix sous l heure, ni zoom qui reste ==');
// A specificite egale, la regle ecrite plus bas gagne. Le bloc iOS etait place
// avant .conv-champ{font-size:14px} : il perdait, et Safari zoomait dans la
// messagerie sans jamais dezoomer.
const STYLE = (HTML.match(/<style>([\s\S]*?)<\/style>\s*<\/head>/) || HTML.match(/<style[^>]*>([\s\S]*)<\/style>/))[1];
const IOS = STYLE.indexOf('@supports (-webkit-touch-callout:none)');
ok('le bloc iOS existe', IOS > -1);
const classesIos = ((STYLE.slice(IOS).match(/\{([^{}]*)\{font-size:16px/) || [])[1] || '')
  .split(',').map(s => s.trim()).filter(Boolean);
ok('il couvre le champ de la messagerie', classesIos.includes('.conv-champ'), classesIos.join(' '));
const apres = classesIos.filter(c => {
  const re = new RegExp('(^|[\\s,}])' + c.replace('.', '\\.') + '\\s*\\{[^}]*font-size', 'g');
  const finIos = STYLE.indexOf('\n  }', IOS);
  let m, dernier = -1;
  while ((m = re.exec(STYLE))) if (m.index < IOS || m.index > finIos) dernier = m.index;
  return dernier > IOS;
});
ok('et aucune regle ecrite apres lui ne lui reprend la taille', !apres.length, apres.join(' '));
ok('les feuilles laissent la place de l heure et de la batterie',
   /\.sheet\{[^}]*env\(safe-area-inset-top/.test(STYLE));
ok('et leur en-tete, avec la croix, reste en haut quand on defile',
   /\.sheet-head\{[^}]*position:sticky/.test(STYLE));
ok('l ecran d accueil aussi', /\.accueil\{[^}]*env\(safe-area-inset-top/.test(STYLE));

console.log('\n== 20. Ce que Google voit ==');
const TITRE = (HTML.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
ok('le titre dit ce qu est l app, pas seulement son nom', /carnet de musculation/i.test(TITRE), TITRE);
ok('et il tient dans un resultat de recherche', TITRE.length <= 60, TITRE.length + ' caracteres');
const DESCR = (HTML.match(/<meta name="description" content="([^"]*)">/) || [])[1] || '';
ok('la description est une vraie phrase, sans etre tronquee par Google',
   DESCR.length >= 110 && DESCR.length <= 160, DESCR.length + ' caracteres');
const LD = (HTML.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1];
let site = null; try { site = JSON.parse(LD); } catch (e) {}
ok('le nom du site est declare pour Google', site && site['@type'] === 'WebSite' && site.name === 'Top Set');
ok('et son adresse est la canonique', site && HTML.indexOf('<link rel="canonical" href="' + site.url + '">') > -1);
const RACINE = new URL('../', import.meta.url);
const ico = readFileSync(new URL('favicon.ico', RACINE));
ok('favicon.ico existe, pour les navigateurs qui le demandent d office',
   ico.readUInt16LE(2) === 1 && ico.readUInt16LE(4) >= 1);
ok('un favicon d au moins 48 px est annonce, la taille que Google demande',
   HTML.indexOf('sizes="48x48" href="favicon-48.png"') > -1);
const PLAN = readFileSync(new URL('sitemap.xml', RACINE), 'utf8');
for (const p of ['/', '/guide', '/confidentialite', '/cgu', '/mentions-legales'])
  ok('le plan du site liste ' + p, PLAN.indexOf('<loc>https://www.top-set.fr' + p + '</loc>') > -1);
// Le plan est desormais produit par scripts/contenu.mjs, qui y ajoute les pages
// de contenu indexables ; la 404 et les rubriques trop minces n'y sont pas.
ok('la page 404 n est pas dans le plan du site', PLAN.indexOf('/404') === -1);
// Apprendre est une rubrique principale de l'app, pas un lien de pied de page.
ok('APPRENDRE est un onglet de l app, a cote de PLANNING, SEANCES et RECAP',
   /id="mainTabs"[\s\S]*?data-view="apprendre"[\s\S]*?<\/div>/.test(HTML)
   && /\.topbar-inner\{[^}]*repeat\(4,/.test(HTML));
ok('et sa vue existe, avec un lien vers la page Apprendre',
   /id="view-apprendre"[\s\S]*?href="\/apprendre"[\s\S]*?<\/section>/.test(HTML));
ok('l app sait l afficher sans passer par le recap',
   /var VUES = \[[^\]]*'apprendre'/.test(SRC) && SRC.indexOf("else if (state.view === 'apprendre') return;") > -1);
ok('le pied de page de l app y mene aussi', HTML.indexOf('<a href="/apprendre">Apprendre</a>') > -1);

console.log('\n== La pastille des messages ==');
// Comptee avant l'arrivee du profil, elle traitait l'administrateur en membre,
// sur un fil qu'il n'ouvre jamais : elle restait allumee sur un message que
// personne ne pouvait lire. Le vrai scenario tourne dans Chrome, hors CI ;
// ici on empeche la rechute.
ok('le comptage attend de connaitre le role',
   /nonLusTotal:function\(\)\{[\s\S]{0,120}profilConnu\(\)\.then/.test(SRC));
ok('un comptage perime ne rallume pas la pastille',
   /var jeton = \+\+badgeJeton;[\s\S]{0,80}if \(jeton !== badgeJeton\) return;/.test(SRC));
ok('ouvrir la boite recompte la pastille',
   /function ouvrirBoite\(\)\{[\s\S]{0,160}majBadgeMessages\(true\);/.test(SRC));
ok('le champ commentaire fait 16 px sous iOS, sinon Safari zoome',
   /@supports \(-webkit-touch-callout:none\)\{[\s\S]{0,300}\.serie-note\{font-size:16px;\}/.test(HTML));

console.log('\n== La carte ne renvoie pas en haut de la page ==');
// Sur iPhone, un appui sur un bouton laisse le focus au champ ou l'on tapait.
// Refaire le panneau supprimait ce champ, et Safari remontait tout en haut.
const ajout = corps("var addSerieBtn = e.target.closest('[data-action=\"add-serie\"]');", "var delSerieBtn");
ok('+ SERIE ajoute sa ligne sans refaire le panneau',
   ajout.indexOf('listeS.appendChild(') > -1 && ajout.indexOf('renderDayPanel(') < 0);
ok('refaire le panneau lache le focus et garde le defilement',
   /function renderDayPanel\(force\)\{[\s\S]{0,900}lacherFocus\(list\);[\s\S]{0,300}garderDefilement\(y\);/.test(SRC));

console.log(`\n${pass} reussis, ${fail} echoues`);
process.exit(fail ? 1 : 0);
