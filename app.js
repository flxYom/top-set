(function(){
  "use strict";

  var GROUPS = ['Pectoraux','Dos','Épaules','Bras','Jambes','Abdos','Cardio','Autre'];
  var GROUP_COLORS = {
    'Pectoraux':'#ff7aa2','Dos':'#22b8a8','Épaules':'#a99bff','Bras':'#d45fc4',
    'Jambes':'#b3d236','Abdos':'#c99a6b','Cardio':'#6fd6f5','Autre':'#8f887d'
  };
  // Une attente courte (une liste, un graphique, un fil) : la meme barre
  // qu'on charge, en petit, pour que toutes les attentes parlent la meme
  // langue que le chargement du bilan.
  function attente(texte){
    return '<span class="attente" role="status"><span class="attente-barre" aria-hidden="true"><i></i><i></i><b></b><i></i><i></i></span>'
      + '<span class="attente-texte">' + esc(texte || 'Chargement…') + '</span></span>';
  }
  // Le dessin du bandeau, par groupe dominant. « Autre » et la seance vide
  // gardent la photo des disques.
  var ILLUSTRATIONS = {
    'Pectoraux':'pectoraux','Dos':'dos','Épaules':'epaules','Bras':'bras',
    'Jambes':'jambes','Abdos':'abdos','Cardio':'cardio'
  };
  var EXERCISE_DB = {
    'Développé couché':'Pectoraux','Développé couché prise serrée':'Pectoraux','Développé incliné':'Pectoraux',
    'Développé incliné haltères':'Pectoraux','Développé décliné':'Pectoraux','Écarté couché haltères':'Pectoraux',
    'Écarté incliné haltères':'Pectoraux','Pec deck':'Pectoraux','Pompes':'Pectoraux',
    'Développé couché Smith machine':'Pectoraux','Cable crossover':'Pectoraux','Pull-over':'Pectoraux',
    'Écarté à la poulie':'Pectoraux','Larsen':'Pectoraux','Spoto press':'Pectoraux',

    'Soulevé de terre':'Dos','Soulevé de terre roumain':'Jambes','Soulevé de terre sumo':'Dos','Tractions':'Dos',
    'Tractions lestées':'Dos','Rowing barre':'Dos','Rowing haltère':'Dos','Rowing Yates':'Dos',
    'Tirage horizontal poulie basse':'Dos','Tirage vertical':'Dos','Tirage nuque':'Dos','T-bar row':'Dos',
    'Rowing Pendlay':'Dos','Good morning':'Dos','Hyperextensions':'Dos','Shrugs':'Dos','Rack pulls':'Dos',

    'Développé militaire':'Épaules','Développé haltères assis':'Épaules','Développé Arnold':'Épaules',
    'Élévations latérales':'Épaules','Élévations frontales':'Épaules','Oiseau':'Épaules','Face pull':'Épaules',
    'Rowing menton':'Épaules','Développé nuque':'Épaules','Élévations latérales à la poulie':'Épaules',

    'Curl biceps barre':'Bras','Curl biceps haltères':'Bras','Curl marteau':'Bras','Curl pupitre':'Bras',
    'Curl concentré':'Bras','Curl à la poulie':'Bras','Curl inversé':'Bras','Extension triceps poulie haute':'Bras',
    'Extension triceps nuque':'Bras','Dips':'Bras','Barre au front':'Bras','Kickback triceps':'Bras',
    'Extension triceps unilatérale':'Bras',

    'Squat':'Jambes','Squat avant':'Jambes','Fentes bulgares':'Jambes','Presse à cuisses':'Jambes','Fentes':'Jambes',
    'Fentes marchées':'Jambes','Soulevé de terre jambes tendues':'Jambes','Leg curl':'Jambes','Leg extension':'Jambes',
    'Hip thrust':'Jambes','Mollets debout':'Jambes','Mollets assis':'Jambes','Hack squat':'Jambes',
    'Goblet squat':'Jambes','Sissy squat':'Jambes','Step-up':'Jambes',
    'Adducteurs à la machine':'Jambes','Abducteurs à la machine':'Jambes','Pont fessier':'Jambes',
    'Kickback fessier à la poulie':'Jambes','Nordic curl':'Jambes','Curl poignet':'Bras',

    'Crunch':'Abdos','Relevé de jambes':'Abdos','Planche':'Abdos','Russian twist':'Abdos','Ab wheel':'Abdos',
    'Crunch à la poulie':'Abdos','Gainage latéral':'Abdos','Mountain climber':'Abdos','Sit-up':'Abdos',
    'V-up':'Abdos','Dragon flag':'Abdos','Gainage':'Abdos','Gainage planche':'Abdos','Hollow hold':'Abdos',
    'Chaise':'Jambes','Suspension à la barre':'Dos',

    'Course à pied':'Cardio','Rameur':'Cardio','Vélo elliptique':'Cardio','Vélo':'Cardio','Corde à sauter':'Cardio',
    'Tapis de course':'Cardio','Burpees':'Cardio','Marche rapide':'Cardio','Natation':'Cardio'
  };
  // Sous-groupes (18/09/2026, demande : « curl biceps haltère : groupe bras,
  // sous-groupe biceps »). Les huit grandes rubriques restent ; certaines se
  // precisent. Trapezes et lombaires vont avec le Dos : anatomiquement, ce
  // sont des muscles du dos, et les shrugs y etaient deja ranges. Le souleve
  // de terre roumain passe en Jambes › Ischios, qui y travaillent le plus en
  // EMG (PLOS One 2020, revue sur le souleve de terre et ses variantes).
  var SOUS_GROUPES = {
    'Dos':['Dorsaux','Trapèzes','Lombaires'],
    'Bras':['Biceps','Triceps','Avant-bras'],
    'Jambes':['Quadriceps','Ischios','Fessiers','Mollets','Adducteurs','Abducteurs']
  };
  var PARENT_SOUS = {};
  Object.keys(SOUS_GROUPES).forEach(function(g){ SOUS_GROUPES[g].forEach(function(s){ PARENT_SOUS[s] = g; }); });
  var SOUS_GROUPE_DB = {
    'Soulevé de terre':'Lombaires','Soulevé de terre sumo':'Lombaires','Rack pulls':'Lombaires',
    'Good morning':'Lombaires','Hyperextensions':'Lombaires','Shrugs':'Trapèzes',
    'Tractions':'Dorsaux','Tractions lestées':'Dorsaux','Rowing barre':'Dorsaux','Rowing haltère':'Dorsaux',
    'Rowing Yates':'Dorsaux','Tirage horizontal poulie basse':'Dorsaux','Tirage vertical':'Dorsaux',
    'Tirage nuque':'Dorsaux','T-bar row':'Dorsaux','Rowing Pendlay':'Dorsaux','Suspension à la barre':'Dorsaux',
    'Curl biceps barre':'Biceps','Curl biceps haltères':'Biceps','Curl marteau':'Biceps','Curl pupitre':'Biceps',
    'Curl concentré':'Biceps','Curl à la poulie':'Biceps','Curl inversé':'Avant-bras','Curl poignet':'Avant-bras',
    'Extension triceps poulie haute':'Triceps','Extension triceps nuque':'Triceps','Dips':'Triceps',
    'Barre au front':'Triceps','Kickback triceps':'Triceps','Extension triceps unilatérale':'Triceps',
    'Squat':'Quadriceps','Squat avant':'Quadriceps','Fentes bulgares':'Quadriceps','Presse à cuisses':'Quadriceps',
    'Fentes':'Quadriceps','Fentes marchées':'Quadriceps','Leg extension':'Quadriceps','Hack squat':'Quadriceps',
    'Goblet squat':'Quadriceps','Sissy squat':'Quadriceps','Step-up':'Quadriceps','Chaise':'Quadriceps',
    'Soulevé de terre roumain':'Ischios','Soulevé de terre jambes tendues':'Ischios','Leg curl':'Ischios',
    'Nordic curl':'Ischios','Hip thrust':'Fessiers','Pont fessier':'Fessiers','Kickback fessier à la poulie':'Fessiers',
    'Mollets debout':'Mollets','Mollets assis':'Mollets',
    'Adducteurs à la machine':'Adducteurs','Abducteurs à la machine':'Abducteurs'
  };
  // Un nom tape a la main (« curl biceps haltère ») n'est pas dans la base :
  // des mots-cles le rangent. L'ordre compte — « leg curl » avant « curl »,
  // « rowing menton » (epaules) avant « rowing ».
  var REGLES_SOUS = [
    [/mollet|calf|calves/, 'Mollets'],
    [/adduct/, 'Adducteurs'],
    [/abduct/, 'Abducteurs'],
    [/leg curl|curl (allonge|assis|couche|jambe)|ischio|nordic|jambes tendues|roumain|\brdl\b|hamstring/, 'Ischios'],
    [/hip thrust|fessier|glute|\bpont\b/, 'Fessiers'],
    [/poignet|avant.bras|wrist|curl inverse|reverse curl|farmer/, 'Avant-bras'],
    [/triceps|barre au front|skull|\bdips\b|pushdown|french press|extension (a la )?poulie|extension nuque/, 'Triceps'],
    [/curl|biceps/, 'Biceps'],
    [/shrug|trapeze|haussement/, 'Trapèzes'],
    [/lombaire|hyperextension|extension (du |lombaire|dos)|back extension|souleve de terre|deadlift|good morning|rack pull/, 'Lombaires'],
    [/menton|upright/, null],
    [/traction|tirage|rowing|\brow\b|pull.?down|pull.?up|chin.?up|dorsa|\blats?\b/, 'Dorsaux'],
    [/squat|presse|leg press|leg extension|fente|lunge|step.?up|quadri|chaise/, 'Quadriceps']
  ];
  var REGLES_GROUPE = [
    [/developpe (couche|incline|decline)|\bpecs?\b|pectora|ecarte|pompe|bench|chest|pec deck|butterfly/, 'Pectoraux'],
    [/militaire|elevation|epaule|arnold|oiseau|face pull|shoulder|lateral|menton|upright|deltoid/, 'Épaules'],
    [/crunch|abdo|gainage|planche|obliq|sit.?up|relevé de jambes|releve de jambes|hollow|ab wheel/, 'Abdos'],
    [/course|rameur|velo|elliptique|corde a sauter|tapis|natation|marche|burpee|cardio/, 'Cardio']
  ];
  // Ce que le nom dit tout seul, sans memoire : { groupe, sous } ou null.
  function detecterMuscle(nom){
    var net = normalizeName(nom);
    if (!net) return null;
    var dansBase = Object.keys(EXERCISE_DB).filter(function(n){ return n.toLowerCase() === net.toLowerCase(); })[0];
    if (dansBase && SOUS_GROUPE_DB[dansBase]) return { groupe:PARENT_SOUS[SOUS_GROUPE_DB[dansBase]], sous:SOUS_GROUPE_DB[dansBase] };
    if (dansBase) return { groupe:EXERCISE_DB[dansBase], sous:null };
    var t = sansAccents(net);
    for (var i = 0; i < REGLES_SOUS.length; i++){
      if (REGLES_SOUS[i][0].test(t)){
        var s = REGLES_SOUS[i][1];
        if (s) return { groupe:PARENT_SOUS[s], sous:s };
        break;
      }
    }
    for (var j = 0; j < REGLES_GROUPE.length; j++){
      if (REGLES_GROUPE[j][0].test(t)) return { groupe:REGLES_GROUPE[j][1], sous:null };
    }
    return null;
  }
  // Le classement qui compte, pour une carte, le recap et le schema. Un choix
  // fait a la main (la pastille du groupe) gagne toujours, y compris « sans
  // precision » ; sinon le nom tranche ; sinon le groupe enregistre.
  function classement(ex){
    var g = (ex && ex.groupe) || 'Autre';
    var nom = ex && ex.nom;
    if (!nom || !String(nom).trim()) return { groupe:g, sous:null };
    var info = CUSTOM_PAR_CLE[cleCanonique(nom)];
    if (info && typeof info.sousGroupe === 'string'){
      if (PARENT_SOUS[info.sousGroupe]) return { groupe:PARENT_SOUS[info.sousGroupe], sous:info.sousGroupe };
      return { groupe:info.groupe || g, sous:null };
    }
    var d = detecterMuscle(nomCanonique(nom));
    if (d && d.sous) return d;
    if (g === 'Autre' && d && d.groupe) return { groupe:d.groupe, sous:null };
    return { groupe:g, sous:null };
  }

  // Les abreviations et les noms anglais qu'on tape en salle. Ce ne sont pas
  // des exercices : chacune pointe vers un nom de la base, et l'app se
  // contente de PROPOSER — le nom retenu reste celui que l'utilisateur
  // choisit. « RDL » ne ressemble a « Souleve de terre roumain » par aucune
  // lettre : aucun rapprochement automatique ne pouvait le trouver.
  var SYNONYMES = {
    'rdl':'Soulevé de terre roumain', 'romanian deadlift':'Soulevé de terre roumain',
    'romanian dead lift':'Soulevé de terre roumain', 'sdtr':'Soulevé de terre roumain',
    'sdt':'Soulevé de terre', 'deadlift':'Soulevé de terre', 'dead lift':'Soulevé de terre',
    'dead':'Soulevé de terre', 'dl':'Soulevé de terre',
    'sumo deadlift':'Soulevé de terre sumo',
    'stiff leg deadlift':'Soulevé de terre jambes tendues', 'stiff':'Soulevé de terre jambes tendues',
    'dc':'Développé couché', 'bench':'Développé couché', 'bench press':'Développé couché',
    'bp':'Développé couché', 'close grip bench':'Développé couché prise serrée',
    'incline bench':'Développé incliné', 'di':'Développé incliné',
    'ohp':'Développé militaire', 'overhead press':'Développé militaire',
    'military press':'Développé militaire', 'dm':'Développé militaire', 'shoulder press':'Développé militaire',
    'back squat':'Squat', 'front squat':'Squat avant', 'bss':'Fentes bulgares',
    'bulgarian split squat':'Fentes bulgares', 'split squat':'Fentes bulgares',
    'leg press':'Presse à cuisses', 'calf raise':'Mollets debout',
    'pull up':'Tractions', 'pullup':'Tractions', 'pull ups':'Tractions', 'chin up':'Tractions',
    'lat pulldown':'Tirage vertical', 'pulldown':'Tirage vertical',
    'barbell row':'Rowing barre', 'bent over row':'Rowing barre', 'pendlay row':'Rowing Pendlay',
    'seated row':'Tirage horizontal poulie basse', 'cable row':'Tirage horizontal poulie basse',
    'lateral raise':'Élévations latérales', 'side raise':'Élévations latérales',
    'skull crusher':'Barre au front', 'skullcrusher':'Barre au front',
    'gm':'Good morning', 'ht':'Hip thrust', 'hip thrusts':'Hip thrust',
    'plank':'Planche', 'push up':'Pompes', 'pushup':'Pompes', 'push ups':'Pompes'
  };
  function sansAccents(t){
    return String(t == null ? '' : t).toLowerCase()
      .replace(/[àâä]/g,'a').replace(/[éèêë]/g,'e').replace(/[îï]/g,'i')
      .replace(/[ôö]/g,'o').replace(/[ùûü]/g,'u').replace(/ç/g,'c');
  }
  function cleSynonyme(t){
    return sansAccents(t).replace(/[^a-z0-9]+/g,' ').trim();
  }
  // Le nom de la base vise par ce qu'on vient de taper, ou null. Exact
  // seulement : proposer sur un debut de mot ferait clignoter une question a
  // chaque lettre.
  function synonymeDe(saisi){
    var cible = SYNONYMES[cleSynonyme(saisi)];
    if (!cible) return null;
    // Deja le bon nom, ou un nom que l'utilisateur s'est approprie : rien a dire.
    if (cleExo(cible) === cleExo(saisi)) return null;
    if (CUSTOM_PAR_CLE[cleExo(saisi)]) return null;
    return cible;
  }

  // Exercices ajoutes par l'utilisateur ("bench leger", "curl maison"...).
  // Ils rejoignent la liste de suggestions et suivent la sauvegarde.
  var CUSTOM_KEY = 'topset_custom_exercises';
  var customExercises = {};
  try {
    var rawCustom = localStorage.getItem(CUSTOM_KEY);
    if (rawCustom) customExercises = JSON.parse(rawCustom) || {};
  } catch(e){ customExercises = {}; }

  function saveCustom(){
    try { localStorage.setItem(CUSTOM_KEY, JSON.stringify(customExercises)); } catch(e){}
  }

  // Un exercice memorise s'ecrivait « nom: groupe ». Il porte maintenant aussi
  // un alias, donc un objet. Les deux formes se lisent : une sauvegarde
  // exportee l'an dernier doit se relire telle quelle.
  function infoExo(valeur, nom){
    if (typeof valeur === 'string') return { nom:nom, groupe:valeur, alias:null };
    var info = { nom:(valeur && valeur.nom) || nom,
                 groupe:(valeur && valeur.groupe) || 'Autre',
                 alias:(valeur && valeur.alias) || null };
    // Le sous-groupe n'existe que s'il a ete choisi a la main : '' veut dire
    // « le groupe seul, sans precision », absent veut dire « deduit du nom ».
    if (valeur && typeof valeur.sousGroupe === 'string') info.sousGroupe = sousGroupeSur(valeur.sousGroupe);
    return info;
  }
  function sousGroupeSur(s){ return PARENT_SOUS[s] ? s : ''; }

  var EXERCISE_DB_LOWER = {};
  var CUSTOM_PAR_CLE = {};
  function rebuildLower(){
    EXERCISE_DB_LOWER = {};
    CUSTOM_PAR_CLE = {};
    Object.keys(EXERCISE_DB).forEach(function(k){ EXERCISE_DB_LOWER[k.toLowerCase()] = EXERCISE_DB[k]; });
    Object.keys(customExercises).forEach(function(k){
      var info = infoExo(customExercises[k], k);
      EXERCISE_DB_LOWER[k.toLowerCase()] = info.groupe;
      CUSTOM_PAR_CLE[cleExo(k)] = { nom:info.nom || k, groupe:info.groupe, alias:info.alias, sousGroupe:info.sousGroupe };
    });
  }
  rebuildLower();

  // Enregistre un nom inconnu pour qu'il soit propose la prochaine fois.
  // Renvoie true si la liste a change (donc s'il faut la reconstruire).
  function rememberExercise(nom, groupe){
    var clean = String(nom || '').trim();
    if (clean.length < 2) return false;
    var key = clean.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(EXERCISE_DB, clean)) return false;
    var ancien = CUSTOM_PAR_CLE[cleExo(clean)];
    if (ancien && ancien.nom === clean && ancien.groupe === (groupe || 'Autre')) return false;
    // Un nom deja connu sous une autre casse ne cree pas de doublon.
    var existant = Object.keys(customExercises).filter(function(k){ return k.toLowerCase() === key; });
    existant.forEach(function(k){ if (k !== clean) delete customExercises[k]; });
    // Changer le groupe d'un exercice ne doit pas effacer son rattachement.
    customExercises[clean] = { nom:clean, groupe:groupe || 'Autre',
                               alias:(ancien && ancien.alias) || null };
    if (ancien && typeof ancien.sousGroupe === 'string') customExercises[clean].sousGroupe = ancien.sousGroupe;
    saveCustom();
    rebuildLower();
    if (typeof Sync !== 'undefined' && Sync.marquerExos) Sync.marquerExos();
    return true;
  }

  // « dead » est le souleve de terre de son auteur, pas celui d'un
  // dictionnaire : le rattachement est une decision de l'utilisateur, jamais
  // une deduction de l'app.
  function definirAlias(nom, cleCible){
    var clean = String(nom || '').trim();
    if (!clean) return;
    var cle = cleExo(clean);
    if (cleCible && cleCible === cle) return;   // rien ne se rattache a soi
    var ancien = CUSTOM_PAR_CLE[cle];
    var groupe = (ancien && ancien.groupe) || 'Autre';
    if (cleCible){
      var g = groupeCanonique(cleCible);
      if (g) groupe = g;
    }
    customExercises[clean] = { nom:clean, groupe:groupe, alias:cleCible || null };
    if (ancien && typeof ancien.sousGroupe === 'string') customExercises[clean].sousGroupe = ancien.sousGroupe;
    saveCustom();
    rebuildLower();
    if (typeof Sync !== 'undefined' && Sync.marquerExos) Sync.marquerExos();
  }

  // Le choix de la pastille : le groupe, et un sous-groupe ou « sans
  // precision ». Il vaut pour ce nom d'exercice partout, historique compris,
  // meme pour un nom de la base.
  function choisirMuscle(nom, groupe, sous){
    var clean = String(nom || '').trim();
    if (clean.length < 2) return;
    var ancien = CUSTOM_PAR_CLE[cleExo(clean)];
    Object.keys(customExercises).forEach(function(k){
      if (k !== clean && k.toLowerCase() === clean.toLowerCase()) delete customExercises[k];
    });
    customExercises[clean] = { nom:clean, groupe:groupe || 'Autre',
                               alias:(ancien && ancien.alias) || null, sousGroupe:sousGroupeSur(sous) };
    saveCustom();
    rebuildLower();
    if (typeof Sync !== 'undefined' && Sync.marquerExos) Sync.marquerExos();
  }

  var DAY_NAMES = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
  var DAY_ABBR = ['Lu','Ma','Me','Je','Ve','Sa','Di'];
  var MONTH_NAMES = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  var MONTH_ABBR = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];

  // ---------- date helpers ----------
  function pad2(n){ return n<10 ? '0'+n : ''+n; }
  function toDateStr(d){ return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate()); }
  function fromDateStr(s){ var p=s.split('-').map(Number); return new Date(p[0],p[1]-1,p[2]); }
  function addDays(d,n){ var r=new Date(d); r.setDate(r.getDate()+n); return r; }
  function startOfWeek(d){ var r=new Date(d); var day=(r.getDay()+6)%7; r.setDate(r.getDate()-day); r.setHours(0,0,0,0); return r; }
  function startOfMonth(d){ return new Date(d.getFullYear(),d.getMonth(),1); }
  function endOfMonth(d){ return new Date(d.getFullYear(),d.getMonth()+1,0); }
  function startOfYear(d){ return new Date(d.getFullYear(),0,1); }
  function endOfYear(d){ return new Date(d.getFullYear(),11,31); }

  function formatWeekRange(start,end){
    var sameMonth = start.getMonth()===end.getMonth() && start.getFullYear()===end.getFullYear();
    var sameYear = start.getFullYear()===end.getFullYear();
    if (sameMonth) return start.getDate()+' – '+end.getDate()+' '+MONTH_ABBR[end.getMonth()]+' '+end.getFullYear();
    if (sameYear) return start.getDate()+' '+MONTH_ABBR[start.getMonth()]+' – '+end.getDate()+' '+MONTH_ABBR[end.getMonth()]+' '+end.getFullYear();
    return start.getDate()+' '+MONTH_ABBR[start.getMonth()]+' '+start.getFullYear()+' – '+end.getDate()+' '+MONTH_ABBR[end.getMonth()]+' '+end.getFullYear();
  }

  // L'apostrophe compte autant que le guillemet : tous les attributs generes
  // ici sont delimites par des guillemets doubles, mais il suffirait d'un seul
  // attribut ecrit en simples quotes un jour pour rouvrir le trou. Le
  // navigateur decode les entites en lisant un attribut, donc dataset.x rend
  // toujours la valeur d'origine — echapper plus ne casse aucune comparaison.
  function esc(s){
    return String(s==null?'':s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  // Un identifiant ne sert qu'a relier une ligne du DOM a son objet. Il n'a
  // aucune raison de contenir autre chose que des lettres, des chiffres, un
  // tiret ou un souligne.
  //
  // Ceux que l'app fabrique respectent deja ca — « x1a2b3c », « s1a2b3c », et
  // les UUID venus du cloud. AUCUNE donnee existante n'est donc reecrite :
  // le filtre n'attrape que ce qui vient d'ailleurs, c'est-a-dire d'un fichier
  // importe. C'est exactement ce que fait deja uuid_ou_neuf() cote base, et
  // pour la meme raison : on ne fait pas confiance au format d'un id qu'on n'a
  // pas fabrique.
  // Le groupe pilote une couleur et un menu deroulant, tous deux batis sur la
  // liste GROUPS. Une valeur hors liste ne casse rien visuellement — les tables
  // retombent sur « Autre » — mais elle rend le menu incoherent : il afficherait
  // un groupe impossible a re-selectionner. Aucune valeur legitime n'est hors
  // liste : le menu et EXERCISE_DB n'emettent que ces huit-la.
  function groupeSur(g){
    var v = String(g == null ? '' : g);
    return GROUPS.indexOf(v) > -1 ? v : 'Autre';
  }

  var ID_SUR = /^[A-Za-z0-9_-]{1,64}$/;
  function idSur(v, fabrique){
    return ID_SUR.test(String(v == null ? '' : v)) ? String(v) : fabrique();
  }

  function genId(){ return 'x'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
  function genSerieId(){ return 's'+Date.now().toString(36)+Math.random().toString(36).slice(2,7); }
  function formatWeight(w){
    if (w==null || isNaN(w)) return '';
    var r = Math.round(w*100)/100;
    // Virgule francaise, comme dans les champs de saisie : afficher "72.5" a
    // cote d'un champ qui montre "72,5" donne l'impression de deux valeurs.
    return String(r).replace('.', ',');
  }

  // Une série "compte" dès qu'elle a un poids ou des reps saisis — une série
  // fraîchement ajoutée et jamais remplie ne doit rien changer aux stats/récap.
  function hasData(s){
    return (typeof s.poids === 'number' && !isNaN(s.poids)) || (s.reps!=null && String(s.reps).trim()!=='');
  }

  // Le commentaire d'une serie. 500 caracteres : de quoi dire comment ca
  // s'est passe, pas de quoi faire d'un fichier importe un mega-octet de
  // texte. La base a la meme borne.
  var NOTE_MAX = 500;
  function noteSure(v){
    if (typeof v !== 'string' || !v.trim()) return undefined;
    return v.slice(0, NOTE_MAX);
  }

  // Le cardio : vitesse en km/h et inclinaison en %, en moyenne sur la serie,
  // un chiffre apres la virgule. Hors bornes, la valeur est perdue plutot que
  // gardee : la base la refuserait, et la journee entiere ne partirait plus.
  function nombreBorne(v, min, max){
    if (typeof v === 'string'){
      if (!v.trim()) return undefined;
      v = Number(v.trim().replace(',', '.'));
    }
    if (typeof v !== 'number' || !isFinite(v)) return undefined;
    v = Math.round(v * 10) / 10;
    return (v < min || v > max) ? undefined : v;
  }
  function vitesseSure(v){ return nombreBorne(v, 0, 99.9); }
  function inclinaisonSure(v){ return nombreBorne(v, -30, 99.9); }

  // Migration silencieuse : d'anciennes entrées ({poids,reps} directement sur
  // l'exercice) deviennent une série unique. Ne perd aucune donnée existante.
  function normalizeSerie(s, reposHerite){
    var sortie = {
      id: idSur(s && s.id, genSerieId),
      poids: (s && typeof s.poids==='number' && !isNaN(s.poids)) ? s.poids : null,
      reps: (s && s.reps) || '',
      // RPE sur l'echelle des reps en reserve : 10 = plus rien dans le
      // reservoir, 9 = une rep restante, et ainsi de suite.
      rpe: (s && typeof s.rpe==='number' && !isNaN(s.rpe)) ? s.rpe : null,
      // Le repos etait porte par l'exercice ; il descend sur chaque serie.
      // Les anciennes donnees heritent de la valeur de l'exercice, rien n'est perdu.
      repos: (s && s.repos != null && s.repos !== '') ? String(s.repos) : (reposHerite || ''),
      // Echauffement, top set, charge de travail ou back-off. Reste absent
      // quand c'est une charge de travail : c'est la valeur par defaut, et
      // toutes les series enregistrees avant ce champ en sont.
      type: (s && TS.TYPES_VALIDES.indexOf(s.type) > -1 && s.type !== TS.TYPES.TRAVAIL) ? s.type : undefined,
      fait: !!(s && s.fait)
    };
    // « Assistée », « avec bandes » : ce que les chiffres de CETTE serie ne
    // disent pas. Absent quand il est vide, comme le type : les carnets
    // d'avant n'ont rien a porter.
    var note = noteSure(s && s.note);
    if (note) sortie.note = note;
    // Absentes quand elles sont vides, comme le commentaire : une serie de
    // muscu n'a ni vitesse ni inclinaison.
    var vitesse = vitesseSure(s && s.vitesse);
    if (vitesse !== undefined) sortie.vitesse = vitesse;
    var inclinaison = inclinaisonSure(s && s.inclinaison);
    if (inclinaison !== undefined) sortie.inclinaison = inclinaison;
    return sortie;
  }

  function normalizeExercise(ex){
    // bloc reste undefined quand il n'y en a pas : un exercice seul ne porte
    // rien, et le JSON envoye au cloud n'a pas de champ vide a transporter.
    var bloc = (ex && ex.bloc) ? String(ex.bloc) : undefined;
    // Au temps ou en repetitions, quand l'utilisateur l'a dit lui-meme.
    // Absent sinon : le nom et les valeurs saisies suffisent a le deduire.
    var mesure = (ex && (ex.mesure === 'temps' || ex.mesure === 'reps' || ex.mesure === 'cardio')) ? ex.mesure : undefined;
    var series = [];
    if (ex && Array.isArray(ex.series)){
      series = ex.series.map(function(s){ return normalizeSerie(s, ex.repos); });
    } else if (ex && (ex.poids!=null || (ex.reps!=null && String(ex.reps).trim()!==''))){
      series.push(normalizeSerie({ poids:ex.poids, reps:ex.reps }, ex.repos));
    }
    // Le commentaire etait porte par l'exercice ; il descend sur sa derniere
    // serie, la ou « assisté sur la dernière » voulait dire quelque chose.
    // Rien ne se perd : s'il y en avait deja un, les deux se suivent. Un
    // exercice sans serie garde le sien, faute d'endroit ou le poser.
    var note = noteSure(ex && ex.note);
    if (note && series.length){
      var derniere = series[series.length - 1];
      derniere.note = noteSure(derniere.note ? note + ' · ' + derniere.note : note);
      note = undefined;
    }
    return { id:idSur(ex&&ex.id, genId), nom:(ex&&ex.nom)||'', groupe:groupeSur(ex&&ex.groupe), repos:(ex&&ex.repos)||'', bloc:bloc, mesure:mesure, note:note, series:series };
  }

  // Les commentaires d'un exercice, pour les ecrans qui les relisent : la
  // fiche d'une seance, l'historique, « derniere fois », le carnet lu par un
  // coach. Chacun dit de quelle serie il parle. Lit aussi les donnees brutes
  // d'un coache, qui n'ont pas ete normalisees ici.
  function notesExo(ex){
    var out = [];
    if (ex && typeof ex.note === 'string' && ex.note.trim()) out.push(ex.note.trim());
    ((ex && ex.series) || []).forEach(function(s, i){
      if (s && typeof s.note === 'string' && s.note.trim()) out.push('S' + (i + 1) + ' : ' + s.note.trim());
    });
    return out;
  }

  // ---------- state ----------
  var state = {
    sessions:{},
    selectedDay:toDateStr(new Date()),
    view:'seances',
    seanceOuverte:null,
    exoOuvert:null,
    exoRetour:'recap',
    exoPeriode:'tout',
    recapPeriod:'semaine',
    loading:true
  };

  function getOrCreateDay(ds){
    if (!state.sessions[ds]) state.sessions[ds] = { date:ds, exercises:[] };
    return state.sessions[ds];
  }
  function findExerciseMatch(name){
    var key = (name||'').trim().toLowerCase();
    if (EXERCISE_DB_LOWER[key]) return EXERCISE_DB_LOWER[key];
    var d = detecterMuscle(name);
    return d ? d.groupe : null;
  }
  function findExercise(day, id){
    for (var i=0;i<day.exercises.length;i++){ if (day.exercises[i].id===id) return day.exercises[i]; }
    return null;
  }
  function findSerie(day, serieId){
    for (var i=0;i<day.exercises.length;i++){
      var ex = day.exercises[i];
      var series = ex.series||[];
      for (var j=0;j<series.length;j++){
        if (series[j].id===serieId) return { exercise:ex, serie:series[j] };
      }
    }
    return null;
  }

  // ---------- historique inter-séances (records, "dernière fois", graphique) ----------
  // Un record est un poids strictement supérieur à tout autre poids jamais logué sur ce
  // nom d'exercice (normalisé) — indépendant de la date, donc robuste à l'édition a posteriori
  // d'une séance passée.
  // ---------- exercices au temps ----------
  // Ceux qu'on tient plutot qu'on ne repete. Le nom suffit a ouvrir la saisie
  // en secondes, et le bouton de la carte bascule dans les deux sens.
  // « Chaise romaine » est un appareil, pas un gainage.
  var AU_TEMPS_NOM = /(^|[\s'’-])(gainage|planche|chaise(?!\s+romaine)|hollow|l-sit|dead hang|wall sit|isom[ée]tri|suspension)/i;
  function nomAuTemps(nom){ return AU_TEMPS_NOM.test(String(nom || '')); }

  // ---------- cardio ----------
  // Le cardio se note au temps, comme une planche : la duree vit dans le
  // champ des reps, et les records, la courbe et le recap la lisent deja. Il
  // y ajoute deux chiffres facultatifs, la vitesse et l'inclinaison moyennes :
  // ce qu'affiche un tapis en fin de course. Le champ de la duree est en
  // minutes — personne ne tape « 1800 » pour une demi-heure.
  // Pas de « rowing » : c'est un tirage pour le dos. « Marche » seul, pas
  // « fentes marchées ».
  var CARDIO_NOM = /(^|[\s'’-])(tapis|course|jogging|footing|running|marche|v[ée]lo|rameur|elliptique|stepper|natation|corde [àa] sauter|cardio)(?![a-zà-ü])/i;
  function cardioParDefaut(ex){
    return !!ex && !nomAuTemps(ex.nom) && CARDIO_NOM.test(String(ex.nom || ''));
  }
  function aDuCardio(s){
    return !!s && (typeof s.vitesse === 'number' || typeof s.inclinaison === 'number');
  }

  // La derniere fois que ce nom a ete fait, etait-ce au temps ? C'est ce qui
  // rouvre « Gainage leste » en secondes la semaine suivante, sans rien
  // retenir nulle part : la reponse est deja dans le carnet.
  function historiqueAuTemps(nom){
    var norm = nom && String(nom).trim() ? cleCanonique(nom) : null;
    if (!norm) return null;
    var dates = Object.keys(state.sessions).sort().reverse();
    for (var i = 0; i < dates.length; i++){
      var exos = state.sessions[dates[i]].exercises || [];
      for (var k = 0; k < exos.length; k++){
        var e = exos[k];
        if (!e.nom || cleCanonique(e.nom) !== norm) continue;
        var remplies = (e.series || []).filter(serieRemplie);
        if (remplies.length) return remplies.some(TS.serieAuTemps);
      }
    }
    // null : jamais fait. Ce n'est pas « fait en repetitions ».
    return null;
  }

  // L'ordre des questions compte : ce que l'utilisateur a choisi, puis ce
  // qu'il a deja saisi, puis le nom, puis l'historique. Une serie deja notee
  // n'est jamais reinterpretee — « 45 » sans unite reste 45 repetitions.
  function estAuTemps(ex){
    if (!ex) return false;
    if (ex.mesure === 'temps' || ex.mesure === 'cardio') return true;
    if (ex.mesure === 'reps') return false;
    var remplies = (ex.series || []).filter(serieRemplie);
    if (remplies.length) return remplies.some(TS.serieAuTemps);
    var h = historiqueAuTemps(ex.nom);
    // Un tapis deja note en repetitions le reste : l'historique passe avant
    // le nom.
    return nomAuTemps(ex.nom) || h === true || (h === null && cardioParDefaut(ex));
  }
  // Le cardio est une facon d'etre au temps : minutes, vitesse, inclinaison
  // au lieu de secondes et difficulte.
  function estCardio(ex){
    if (!ex || ex.mesure === 'reps' || ex.mesure === 'temps') return false;
    if (ex.mesure === 'cardio') return true;
    var remplies = (ex.series || []).filter(serieRemplie);
    if (remplies.some(aDuCardio)) return true;
    if (remplies.length && !remplies.some(TS.serieAuTemps)) return false;
    return estAuTemps(ex) && cardioParDefaut(ex);
  }
  function modeCarte(ex, auTemps){ return auTemps ? (estCardio(ex) ? 'cardio' : 'temps') : 'reps'; }

  // Ce que montre le champ des secondes : la duree lue, ou un nombre nu
  // quand la serie a ete notee avant que le champ existe.
  function secondesAffichees(s){
    var d = TS.dureeSecondes(s && s.reps);
    if (d !== null) return String(d);
    var brut = String((s && s.reps) || '').trim();
    return /^\d+$/.test(brut) ? brut : '';
  }
  function secondesDe(s){
    var v = secondesAffichees(s);
    return v === '' ? 0 : Number(v);
  }
  // Le champ du cardio est en minutes : « 30 », « 12,5 », ou « 25:30 » au
  // clavier d'un ordinateur.
  function minutesAffichees(s){
    var d = TS.dureeSecondes(s && s.reps);
    if (d === null) return '';
    if (d % 6 === 0) return String(d / 60).replace('.', ',');
    return Math.floor(d / 60) + ':' + ('0' + (d % 60)).slice(-2);
  }
  // null : une saisie a moitie tapee, qui ne remplace pas la derniere valeur.
  function minutesLues(v){
    var t = String(v || '').trim().replace(',', '.');
    if (t === '') return 0;
    if (/^\d{1,4}(\.\d*)?$/.test(t)) return Math.round(Number(t) * 60);
    var m = t.match(/^(\d{1,3}):([0-5]\d)$/);
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  }

  // Au temps, le record est la serie la plus longue jamais tenue sur ce nom.
  function recordDuree(serie, exNom, duree){
    if (TS.typeSerie(serie) === TS.TYPES.ECHAUFFEMENT) return false;
    var norm = exNom && exNom.trim() ? cleCanonique(exNom) : null;
    if (!norm) return false;
    var best = 0;
    Object.keys(state.sessions).forEach(function(ds){
      state.sessions[ds].exercises.forEach(function(e){
        if (!e.nom || cleCanonique(e.nom) !== norm) return;
        (e.series||[]).forEach(function(s){
          if (s.id === serie.id) return;
          if (TS.typeSerie(s) === TS.TYPES.ECHAUFFEMENT) return;
          var d = TS.dureeSecondes(s.reps);
          if (d !== null && d > best) best = d;
        });
      });
    });
    return duree > best;
  }

  function isNewRecord(serie, exNom){
    var duree = TS.dureeSecondes(serie.reps);
    if (duree !== null) return recordDuree(serie, exNom, duree);
    if (typeof serie.poids !== 'number' || !(serie.poids > 0)) return false;
    // Un echauffement ne fait pas record, meme lourd.
    if (TS.typeSerie(serie) === TS.TYPES.ECHAUFFEMENT) return false;
    var norm = exNom && exNom.trim() ? cleCanonique(exNom) : null;
    if (!norm) return false;
    var best = 0;
    Object.keys(state.sessions).forEach(function(ds){
      state.sessions[ds].exercises.forEach(function(e){
        if (!e.nom || cleCanonique(e.nom) !== norm) return;
        (e.series||[]).forEach(function(s){
          if (s.id === serie.id) return;
          if (TS.typeSerie(s) === TS.TYPES.ECHAUFFEMENT) return;
          if (typeof s.poids === 'number' && s.poids > best) best = s.poids;
        });
      });
    });
    return serie.poids > best;
  }

  // Meilleure série de la dernière séance antérieure à `beforeDate` sur ce même exercice.
  function findPreviousOccurrence(exNom, beforeDate){
    var norm = exNom && exNom.trim() ? cleCanonique(exNom) : null;
    if (!norm) return null;
    var bestDate = null, bestEx = null;
    Object.keys(state.sessions).forEach(function(ds){
      if (ds >= beforeDate) return;
      state.sessions[ds].exercises.forEach(function(e){
        if (!e.nom || cleCanonique(e.nom) !== norm) return;
        if (!(e.series||[]).some(hasData)) return;
        if (!bestDate || ds > bestDate){ bestDate = ds; bestEx = e; }
      });
    });
    if (!bestEx) return null;
    var validSeries = bestEx.series.filter(hasData);
    var weighted = validSeries.filter(function(s){ return typeof s.poids === 'number' && s.poids > 0; });
    var top = weighted.length
      ? weighted.reduce(function(a,b){ return b.poids > a.poids ? b : a; })
      : validSeries[0];
    return { date:bestDate, poids:top.poids, reps:top.reps };
  }

  // Nombre de séries saisies ce jour-là, tous exercices confondus — sert de mesure de volume
  // pour la heatmap (et non un simple "actif/inactif").
  function computeDayVolume(ds){
    var day = state.sessions[ds];
    if (!day) return 0;
    var vol = 0;
    day.exercises.forEach(function(e){ (e.series||[]).forEach(function(s){ if (hasData(s)) vol++; }); });
    return vol;
  }

  // Toutes les séances où cet exercice apparaît, alias résolus, dans l'ordre
  // chronologique, sous la forme attendue par intelligence.js. Une seule
  // façon de reconstruire l'historique d'un exercice — donc une seule façon
  // de se tromper, et elle se corrige à un seul endroit.
  //
  // La comparaison passe par cleCanonique() et non par le nom brut : sans ça
  // « dead » et « soulevé de terre » resteraient deux exercices distincts
  // dans les courbes alors que l'utilisateur a explicitement dit le contraire.
  function seancesDeLExo(exNom){
    var norm = exNom && exNom.trim() ? cleCanonique(exNom) : null;
    if (!norm) return [];
    var out = [];
    Object.keys(state.sessions).sort().forEach(function(ds){
      var series = [], notes = [];
      state.sessions[ds].exercises.forEach(function(e){
        if (!e.nom || cleCanonique(e.nom) !== norm) return;
        (e.series||[]).forEach(function(s){ if (hasData(s)) series.push(s); });
        notes = notes.concat(notesExo(e));
      });
      // La note voyage avec la seance, pour « derniere fois » et
      // l'historique. Les calculs ne la lisent pas.
      if (series.length) out.push({ date:ds, series:series, note:notes.join(' · ') });
    });
    return out;
  }

  function heatmapCell(ds, startStr, endStr, maxVol){
    if (ds<startStr || ds>endStr) return '<div class="heatmap-cell heatmap-empty"></div>';
    var v = computeDayVolume(ds);
    var level = v===0 ? 0 : Math.min(4, Math.ceil((v/maxVol)*4));
    var d = fromDateStr(ds);
    var label = d.getDate()+' '+MONTH_ABBR[d.getMonth()]+' : '+v+' série'+(v>1?'s':'');
    return '<div class="heatmap-cell" data-level="'+level+'" title="'+esc(label)+'"></div>';
  }

  function renderHeatmap(startStr, endStr){
    var gridStart = startOfWeek(fromDateStr(startStr));
    var days = [];
    var cursor = new Date(gridStart);
    while (toDateStr(cursor) <= endStr){ days.push(toDateStr(cursor)); cursor = addDays(cursor,1); }
    var maxVol = 1;
    days.forEach(function(ds){ if (ds>=startStr && ds<=endStr){ var v=computeDayVolume(ds); if (v>maxVol) maxVol=v; } });

    var cellsHTML;
    if (days.length <= 7){
      cellsHTML = '<div class="heatmap-row">' + days.map(function(ds){ return heatmapCell(ds,startStr,endStr,maxVol); }).join('') + '</div>';
    } else {
      var weeks = [];
      for (var i=0;i<days.length;i+=7) weeks.push(days.slice(i,i+7));
      cellsHTML = weeks.map(function(week){
        return '<div class="heatmap-col">' + week.map(function(ds){ return heatmapCell(ds,startStr,endStr,maxVol); }).join('') + '</div>';
      }).join('');
    }
    return '<div class="heat-wrap">'
      + '<div class="heat-title">ASSIDUITÉ</div>'
      + '<div class="heat-scroll"><div class="heatmap">'+cellsHTML+'</div></div>'
      + '<div class="heat-legend"><span>Moins</span>'
      +   '<div class="heatmap-cell" data-level="0"></div><div class="heatmap-cell" data-level="1"></div>'
      +   '<div class="heatmap-cell" data-level="2"></div><div class="heatmap-cell" data-level="3"></div><div class="heatmap-cell" data-level="4"></div>'
      +   '<span>Plus</span></div>'
      + '</div>';
  }

  // ---------- persistence ----------
  var saveTimers = {};
  function scheduleSave(ds, immediate){
    clearTimeout(saveTimers[ds]);
    var run = function(){ persistDay(ds); };
    if (immediate) run(); else saveTimers[ds] = setTimeout(run, 500);
  }
  // Le local d'abord, toujours, et immediatement : l'ecran ne doit jamais
  // attendre le reseau. La journee est ensuite marquee pour le cloud, si un
  // compte est connecte. Sans compte, la seconde ligne ne fait rien.
  function persistDay(ds){
    saveLocal();
    if (Sync) Sync.marquerSale(ds);
  }
  var SAVE_KEY    = 'musculation_sessions';
  var SECOURS_KEY = 'musculation_sessions_secours';   // version precedente
  var ILLISIBLE_KEY = 'musculation_sessions_illisible'; // JSON casse mis de cote
  var wipeSignale = false;

  // Nombre de jours contenus dans un texte stocke.
  // -1 = illisible : on considere qu'il y a quelque chose, pas rien.
  function nbJoursTexte(txt){
    try { var o = JSON.parse(txt); return (o && typeof o === 'object') ? Object.keys(o).length : 0; }
    catch(e){ return -1; }
  }

  function saveLocal(){
    try{
      var futur  = JSON.stringify(state.sessions);
      var actuel = localStorage.getItem(SAVE_KEY);
      if (actuel != null && actuel !== futur){
        var avant = nbJoursTexte(actuel);
        var apres = Object.keys(state.sessions).length;
        // Le carnet ne supprime jamais une journee : elle reste avec une liste
        // d'exercices vide. Passer de "des jours" a "aucun jour" ne peut donc
        // pas venir d'une action volontaire — c'est un chargement rate.
        // On refuse, et la condition se leve d'elle-meme des qu'il y a un jour.
        if (avant !== 0 && apres === 0){
          if (!wipeSignale){
            wipeSignale = true;
            showToast('Sauvegarde bloqu\u00e9e : tes donn\u00e9es sont intactes');
          }
          return;
        }
        // Un cran d'annulation. Ne coute qu'une copie et rattrape le reste.
        try { localStorage.setItem(SECOURS_KEY, actuel); } catch(e){}
      }
      localStorage.setItem(SAVE_KEY, futur);
    }catch(e){}
  }

  function loadLocal(){
    var raw = null;
    try{ raw = localStorage.getItem(SAVE_KEY); }catch(e){ return null; }
    if (!raw) return null;
    try{ return JSON.parse(raw); }
    catch(e){
      // Un JSON casse ne doit pas devenir un carnet vide qu'on reecrira
      // par-dessus deux secondes plus tard. On met le texte de cote.
      try{ localStorage.setItem(ILLISIBLE_KEY, raw); }catch(e2){}
      setTimeout(function(){
        showToast('Donn\u00e9es illisibles \u2014 rien n\'est effac\u00e9, ouvre \u21c5');
      }, 600);
      return null;
    }
  }

  // Meilleure copie de rattrapage disponible, ou null.
  function copieDeSecours(){
    var best = null;
    [SECOURS_KEY, ILLISIBLE_KEY].forEach(function(k){
      var raw = null;
      try { raw = localStorage.getItem(k); } catch(e){ return; }
      if (!raw) return;
      var p = parseBackup(raw);
      if (p.error || !p.jours) return;
      if (!best || p.series > best.series) best = { cle:k, texte:raw, jours:p.jours, series:p.series };
    });
    return best;
  }

  // ---------- toast ----------
  var toastTimer = null;
  function showToast(msg){
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ t.classList.remove('show'); }, 3000);
  }

  // ---------- recap computation ----------
  function normalizeName(nom){
    return String(nom == null ? '' : nom).replace(/\([^)]*\)/g,'').replace(/\s+/g,' ').trim();
  }
  // La cle ignore la casse et les parentheses : « Bench (top set) » et
  // « bench » sont le meme mouvement, et doivent le rester d'un jour a l'autre.
  function cleExo(nom){ return normalizeName(nom).toLowerCase(); }

  // Un alias ne pointe jamais vers un alias — la base l'interdit et l'app ne
  // le propose pas — donc une seule etape de resolution suffit, sans boucle.
  function cleCanonique(nom){
    var k = cleExo(nom);
    var info = CUSTOM_PAR_CLE[k];
    return (info && info.alias) ? info.alias : k;
  }
  // Nom a afficher pour un exercice, alias resolu. Sert de cle de regroupement
  // dans le recap : deux noms rattaches produisent la meme chaine, donc une
  // seule ligne.
  function nomCanonique(nom){
    var k = cleExo(nom);
    var info = CUSTOM_PAR_CLE[k];
    if (!info || !info.alias) return normalizeName(nom);
    var cible = CUSTOM_PAR_CLE[info.alias];
    if (cible && cible.nom) return normalizeName(cible.nom);
    var dansBase = Object.keys(EXERCISE_DB).filter(function(n){ return cleExo(n) === info.alias; })[0];
    return dansBase || info.alias;
  }

  // Rattacher, c'est dire « c'est le meme exercice ». Le groupe musculaire
  // suit donc la cible : sans ca, le recap compterait la meme serie une fois
  // en Dos et une fois en Autre.
  function groupeCanonique(nom){
    var cle = cleCanonique(nom);
    var info = CUSTOM_PAR_CLE[cle];
    if (info && info.groupe) return info.groupe;
    var dansBase = Object.keys(EXERCISE_DB).filter(function(n){ return cleExo(n) === cle; })[0];
    return dansBase ? EXERCISE_DB[dansBase] : null;
  }

  // Les noms deja utilises, du plus recent au plus ancien, puis les noms
  // memorises, puis la base integree. L'ordre compte : on propose d'abord ce
  // qu'il a vraiment fait.
  function candidatsAlias(saisi){
    var k = cleExo(saisi);
    if (k.length < 2) return [];
    var vus = {}, out = [];
    // Une abreviation connue passe devant : « RDL » n'a aucune lettre commune
    // avec « Souleve de terre roumain ».
    var syn = synonymeDe(saisi);
    if (syn){ vus[cleExo(syn)] = 1; out.push({ cle:cleExo(syn), nom:normalizeName(syn), quand:null }); }
    function ajouter(nom, quand){
      var c = cleExo(nom);
      if (!c || c === k || vus[c]) return;
      // Prefixe dans un sens ou dans l'autre : « dead » trouve « deadlift »,
      // et « deadlift » retrouve « dead ». A partir de trois lettres on
      // accepte aussi le milieu du mot, pas avant : « cu » ramenerait la
      // moitie de la base.
      var colle = c.indexOf(k) === 0 || k.indexOf(c) === 0 ||
                  (k.length >= 3 && c.indexOf(k) > 0);
      if (!colle) return;
      vus[c] = 1;
      out.push({ cle:c, nom:normalizeName(nom), quand:quand || null });
    }
    Object.keys(state.sessions).sort().reverse().forEach(function(ds){
      (state.sessions[ds].exercises || []).forEach(function(e){
        if (e.nom && (e.series||[]).some(hasData)) ajouter(e.nom, ds);
      });
    });
    Object.keys(customExercises).forEach(function(n){ ajouter(n); });
    Object.keys(EXERCISE_DB).forEach(function(n){ ajouter(n); });
    return out.slice(0, 3);
  }

  // Aucun algorithme ne devinera que « dead » est un souleve de terre : les
  // deux mots n'ont pas une lettre en commun. Quand la proposition automatique
  // ne trouve rien, on donne la liste et c'est l'utilisateur qui tranche.
  function tousLesExos(saufCle){
    var vus = {}, out = [];
    function ajouter(nom){
      var c = cleExo(nom);
      if (!c || c === saufCle || vus[c]) return;
      // Un alias ne pointe jamais vers un alias : proposer une cible deja
      // rattachee creerait une chaine que la base refuse.
      var info = CUSTOM_PAR_CLE[c];
      if (info && info.alias) return;
      vus[c] = 1;
      out.push({ cle:c, nom:normalizeName(nom) });
    }
    Object.keys(state.sessions).forEach(function(ds){
      (state.sessions[ds].exercises || []).forEach(function(e){
        if (e.nom && (e.series||[]).some(hasData)) ajouter(e.nom);
      });
    });
    Object.keys(customExercises).forEach(ajouter);
    Object.keys(EXERCISE_DB).forEach(ajouter);
    out.sort(function(a,b){ return a.nom.localeCompare(b.nom,'fr'); });
    return out;
  }
  function mostCommon(arr){
    var counts = {}, best=null, bestCount=0;
    arr.forEach(function(v){ counts[v]=(counts[v]||0)+1; if(counts[v]>bestCount){bestCount=counts[v]; best=v;} });
    return best;
  }
  function computeRecap(period){
    var today = new Date(), start, end, label;
    if (period === 'semaine'){
      start = startOfWeek(today); end = addDays(start,6);
      label = formatWeekRange(start,end);
    } else if (period === 'mois'){
      start = startOfMonth(today); end = endOfMonth(today);
      label = MONTH_NAMES[today.getMonth()].charAt(0).toUpperCase()+MONTH_NAMES[today.getMonth()].slice(1)+' '+today.getFullYear();
    } else {
      start = startOfYear(today); end = endOfYear(today);
      label = String(today.getFullYear());
    }
    var startStr = toDateStr(start), endStr = toDateStr(end);
    var days = Object.keys(state.sessions).filter(function(d){
      return d>=startStr && d<=endStr && compterJour(state.sessions[d]) > 0;
    });

    var totalSeries = 0, totalVolume = 0;
    var byNorm = {}, byJour = {};
    days.forEach(function(d){
      state.sessions[d].exercises.forEach(function(ex){
        var validSeries = (ex.series||[]).filter(hasData);
        if (!validSeries.length) return;
        totalSeries += validSeries.length;
        validSeries.forEach(function(s){ totalVolume += serieVolume(s); });
        // Le nom n'est jamais requis pour compter — seule la donnée saisie (poids/reps) l'est.
        var norm = ex.nom && ex.nom.trim() ? nomCanonique(ex.nom) : 'Exercice sans nom';
        if (!byNorm[norm]) byNorm[norm] = [];
        if (!byJour[norm]) byJour[norm] = {};
        byJour[norm][d] = 1;
        var cl = classement(ex);
        validSeries.forEach(function(s){ byNorm[norm].push({ poids:s.poids, reps:s.reps, groupe:cl.groupe, sous:cl.sous, duree:TS.dureeSecondes(s.reps) }); });
      });
    });

    var items = Object.keys(byNorm).map(function(norm){
      var entries = byNorm[norm];
      var weighted = entries.filter(function(e){ return typeof e.poids === 'number' && !isNaN(e.poids) && e.poids>0; });
      var maxPoids=null, repsAtMax=null, bodyweight=false;
      if (weighted.length){
        maxPoids = Math.max.apply(null, weighted.map(function(e){return e.poids;}));
        var atMax = weighted.filter(function(e){ return e.poids===maxPoids; });
        var repsNums = atMax.map(function(e){return parseFloat(e.reps);}).filter(function(n){return !isNaN(n);});
        repsAtMax = repsNums.length ? Math.max.apply(null,repsNums) : '?';
      } else {
        bodyweight = true;
        var repsNums2 = entries.map(function(e){return parseFloat(e.reps);}).filter(function(n){return !isNaN(n);});
        repsAtMax = repsNums2.length ? Math.max.apply(null,repsNums2) : '?';
      }
      var groupe = mostCommon(entries.map(function(e){return e.groupe;})) || 'Autre';
      var sous = mostCommon(entries.filter(function(e){ return e.groupe === groupe; }).map(function(e){ return e.sous || ''; })) || null;
      // Au temps, le meilleur temps : « PDC × ? » ne voudrait rien dire.
      var durees = entries.map(function(e){ return e.duree; }).filter(function(d){ return d !== null; });
      return { nom:norm, groupe:groupe, sous:sous, maxPoids:maxPoids, repsAtMax:repsAtMax,
               bodyweight:bodyweight,
               maxDuree: durees.length ? Math.max.apply(null, durees) : null,
               fois:Object.keys(byJour[norm] || {}).length,
               series:entries.length };
    });

    items.sort(function(a,b){
      var gi = GROUPS.indexOf(a.groupe) - GROUPS.indexOf(b.groupe);
      if (gi!==0) return gi;
      return a.nom.localeCompare(b.nom,'fr');
    });

    return { label:label, totalSeries:totalSeries, totalVolume:totalVolume, seances:days.length, mouvements:items.length, items:items, startStr:startStr, endStr:endStr };
  }

  // ---------- rendering: shared ----------
  function statTile(value,label){
    return '<div class="stat-tile"><div class="stat-num">'+value+'</div><div class="stat-label">'+label+'</div></div>';
  }

  // Volume = somme (poids x reps) sur les séries où LES DEUX sont renseignés.
  // La définition vit dans intelligence.js et nulle part ailleurs : deux
  // définitions du volume, c'est deux chiffres différents pour la même séance.
  function serieVolume(s){ return TS.volumeSerie(s); }
  function dayVolume(ds){
    var day = state.sessions[ds];
    if (!day) return 0;
    var v = 0;
    day.exercises.forEach(function(e){ (e.series||[]).forEach(function(s){ v += serieVolume(s); }); });
    return v;
  }
  function formatVolume(kg){
    if (kg >= 1000) return { num:String(Math.round(kg/100)/10).replace('.',','), unit:'T' };
    return { num:String(Math.round(kg)), unit:'KG' };
  }
  // formatVolume sert les tuiles de stats, qui composent le nombre et l'unite
  // separement. Ailleurs on veut une chaine simple.
  function volumeTexte(kg){
    if (!kg) return '';
    var v = formatVolume(kg);
    return v.num + ' ' + v.unit;
  }
  function groupCountsIn(startStr, endStr){
    var counts = {};
    Object.keys(state.sessions).forEach(function(ds){
      if (ds < startStr || ds > endStr) return;
      state.sessions[ds].exercises.forEach(function(e){
        var n = (e.series||[]).filter(hasData).length;
        if (!n) return;
        var g = classement(e).groupe;
        counts[g] = (counts[g]||0) + n;
      });
    });
    return counts;
  }
  // Les memes series, par sous-groupe. « Jambes » seul = sans precision.
  function sousCountsIn(startStr, endStr){
    var counts = {};
    Object.keys(state.sessions).forEach(function(ds){
      if (ds < startStr || ds > endStr) return;
      state.sessions[ds].exercises.forEach(function(e){
        var n = (e.series||[]).filter(hasData).length;
        if (!n) return;
        var cl = classement(e);
        var k = cl.sous || cl.groupe;
        counts[k] = (counts[k]||0) + n;
      });
    });
    return counts;
  }

  // Silhouette de face et de dos (18/09/2026) : chaque sous-groupe a sa
  // zone. Un muscle travaille prend la couleur de son groupe ; un groupe note
  // « sans precision » allume toutes ses zones, plus pales. Geometrique,
  // comme le reste de la marque : pas un planche d'anatomie.
  function muscleMapSVG(sous){
    function zone(nom){
      var g = PARENT_SOUS[nom] || nom;
      var c = GROUP_COLORS[g] || '#8a8275';
      if ((sous[nom]||0) > 0) return 'fill="' + c + '"';
      if ((sous[g]||0) > 0) return 'fill="' + c + '" fill-opacity=".45"';
      return 'fill="#2f2b26"';
    }
    var trait = ' stroke="#0d0c0a" stroke-width="1.3"';
    var corps = ' fill="#262320" stroke="#f0ece2" stroke-width="1.5"';
    function silhouette(x){
      return '<g transform="translate(' + x + ' 0)">'
        + '<ellipse cx="45" cy="16" rx="10" ry="11"' + corps + '></ellipse>'
        + '<path d="M26 32 h38 l6 58 -8 16 h-34 l-8 -16 z"' + corps + '></path>'
        + '<path d="M26 34 l-12 8 -6 50 9 3 12 -46 z"' + corps + '></path>'
        + '<path d="M64 34 l12 8 6 50 -9 3 -12 -46 z"' + corps + '></path>'
        + '<path d="M30 106 l-4 84 h14 l5 -66 z"' + corps + '></path>'
        + '<path d="M60 106 l4 84 h-14 l-5 -66 z"' + corps + '></path>'
        + '</g>';
    }
    var face = silhouette(0)
      + '<ellipse cx="27" cy="39" rx="9" ry="7" ' + zone('Épaules') + trait + '></ellipse>'
      + '<ellipse cx="63" cy="39" rx="9" ry="7" ' + zone('Épaules') + trait + '></ellipse>'
      + '<path d="M31 44 h13 v14 h-9 z" ' + zone('Pectoraux') + trait + '></path>'
      + '<path d="M46 44 h13 l-4 14 h-9 z" ' + zone('Pectoraux') + trait + '></path>'
      + '<ellipse cx="17" cy="56" rx="5" ry="10" ' + zone('Biceps') + trait + '></ellipse>'
      + '<ellipse cx="73" cy="56" rx="5" ry="10" ' + zone('Biceps') + trait + '></ellipse>'
      + '<path d="M9 72 l8 2 -4 18 -6 -2 z" ' + zone('Avant-bras') + trait + '></path>'
      + '<path d="M81 72 l-8 2 4 18 6 -2 z" ' + zone('Avant-bras') + trait + '></path>'
      + '<path d="M37 62 h16 v26 h-16 z" ' + zone('Abdos') + trait + '></path>'
      + '<path d="M37 70 h16 M37 79 h16 M45 62 v26" stroke="#0d0c0a" stroke-width="1.1"></path>'
      + '<path d="M28 94 l6 10 -3 8 -6 -8 z" ' + zone('Abducteurs') + trait + '></path>'
      + '<path d="M62 94 l-6 10 3 8 6 -8 z" ' + zone('Abducteurs') + trait + '></path>'
      + '<path d="M30 112 h10 l-1 38 h-11 z" ' + zone('Quadriceps') + trait + '></path>'
      + '<path d="M60 112 h-10 l1 38 h11 z" ' + zone('Quadriceps') + trait + '></path>'
      + '<path d="M41 110 h3 l-2 26 h-3 z" ' + zone('Adducteurs') + trait + '></path>'
      + '<path d="M49 110 h-3 l2 26 h3 z" ' + zone('Adducteurs') + trait + '></path>';
    var dos = silhouette(100)
      + '<path d="M133 30 h24 l-4 18 -8 6 -8 -6 z" ' + zone('Trapèzes') + trait + '></path>'
      + '<ellipse cx="127" cy="39" rx="9" ry="7" ' + zone('Épaules') + trait + '></ellipse>'
      + '<ellipse cx="163" cy="39" rx="9" ry="7" ' + zone('Épaules') + trait + '></ellipse>'
      + '<path d="M130 50 l12 8 v22 l-10 -6 z" ' + zone('Dorsaux') + trait + '></path>'
      + '<path d="M160 50 l-12 8 v22 l10 -6 z" ' + zone('Dorsaux') + trait + '></path>'
      + '<path d="M138 82 h14 v14 h-14 z" ' + zone('Lombaires') + trait + '></path>'
      + '<ellipse cx="117" cy="56" rx="5" ry="10" ' + zone('Triceps') + trait + '></ellipse>'
      + '<ellipse cx="173" cy="56" rx="5" ry="10" ' + zone('Triceps') + trait + '></ellipse>'
      + '<path d="M109 72 l8 2 -4 18 -6 -2 z" ' + zone('Avant-bras') + trait + '></path>'
      + '<path d="M181 72 l-8 2 4 18 6 -2 z" ' + zone('Avant-bras') + trait + '></path>'
      + '<path d="M130 98 h14 v14 h-16 z" ' + zone('Fessiers') + trait + '></path>'
      + '<path d="M160 98 h-14 v14 h16 z" ' + zone('Fessiers') + trait + '></path>'
      + '<path d="M130 116 h10 l-1 32 h-10 z" ' + zone('Ischios') + trait + '></path>'
      + '<path d="M160 116 h-10 l1 32 h10 z" ' + zone('Ischios') + trait + '></path>'
      + '<path d="M129 156 h9 l-1 22 h-7 z" ' + zone('Mollets') + trait + '></path>'
      + '<path d="M161 156 h-9 l1 22 h7 z" ' + zone('Mollets') + trait + '></path>';
    return '<svg class="muscle-svg" width="150" height="161" viewBox="0 0 190 206" fill="none" role="img" aria-label="Muscles travaillés sur la période, de face et de dos">'
      + face + dos
      + '<text x="45" y="204" text-anchor="middle" fill="#a39b8f" font-size="9" font-weight="700" letter-spacing="1">FACE</text>'
      + '<text x="145" y="204" text-anchor="middle" fill="#a39b8f" font-size="9" font-weight="700" letter-spacing="1">DOS</text>'
      + '</svg>';
  }

  function dominantGroup(exercises){
    var counts={};
    exercises.forEach(function(e){ var g=classement(e).groupe; counts[g]=(counts[g]||0)+1; });
    var best=null,bestCount=0;
    GROUPS.forEach(function(g){ if((counts[g]||0)>bestCount){ bestCount=counts[g]; best=g; } });
    return best;
  }

  // Rend le bandeau du jour selectionne.
  function renderBandeau(){
    var ds = state.selectedDay;
    // TERMINER MA SEANCE suit ce qui est note : sans ca, le bouton n'apparaissait
    // qu'au prochain rendu complet (changer d'onglet, rouvrir l'app).
    majBoutonFin(ds);
    var d = fromDateStr(ds);
    var day = state.sessions[ds];
    var exercises = day ? day.exercises : [];

    var nSeries = 0, nExos = 0;
    exercises.forEach(function(e){
      var n = (e.series||[]).filter(hasData).length;
      if (n){ nExos++; nSeries += n; }
    });
    var dom = nExos ? dominantGroup(exercises) : null;
    var vol = formatVolume(dayVolume(ds));
    var heroColor = dom ? (GROUP_COLORS[dom] || '#ff5c38') : '#8a8275';
    var kicker = DAY_NAMES[(d.getDay()+6)%7] + ' ' + d.getDate() + ' ' + MONTH_ABBR[d.getMonth()];

    var tags = '';
    if (nExos){
      tags = '<span class="hero-tag">'+nExos+' EXO'+(nExos>1?'S':'')+'</span>'
        + '<span class="hero-tag">'+nSeries+' SÉRIE'+(nSeries>1?'S':'')+'</span>'
        + '<span class="hero-tag green">'+vol.num+' '+vol.unit+'</span>';
    } else {
      tags = '<span class="hero-tag">RIEN DE NOTÉ</span>';
    }

    var hero = document.getElementById('heroBand');
    hero.style.setProperty('--hero-color', heroColor);
    if (dom && ILLUSTRATIONS[dom]) hero.dataset.illu = ILLUSTRATIONS[dom];
    else delete hero.dataset.illu;
    hero.innerHTML = '<div class="hero-photo"></div><div class="hero-tint"></div><div class="hero-scrim"></div><div class="hero-dots"></div>'
      + '<div class="hero-top">'
      +   '<span class="hero-kicker">'+esc(kicker.toUpperCase())+'</span>'
      +   '<span class="hero-title">'+esc(dom || 'Séance vide')+'</span>'
      + '</div>'
      + '<div class="hero-tags">'+tags+'</div>';

  }

  // RPE en reps en reserve : 10 = plus rien, 9 = une rep restante, etc.
  var RPE_VALUES = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6];
  // Abrege pour tenir dans la ligne sans etiquette : le libelle se suffit,
  // pas besoin d'ecrire « TYPE » a cote.
  var TYPE_LABELS = [
    ['', 'TRAVAIL'],
    [TS.TYPES.ECHAUFFEMENT, 'ÉCHAUF.'],
    [TS.TYPES.TOP, 'TOP SET'],
    [TS.TYPES.BACKOFF, 'BACK-OFF']
  ];

  // Affichage / lecture du poids avec la virgule francaise.
  function poidsAffiche(p){
    return (p == null || isNaN(p)) ? '' : String(p).replace('.', ',');
  }
  function poidsLu(txt){
    var v = String(txt == null ? '' : txt).trim().replace(',', '.');
    if (v === '') return null;
    var num = Number(v);
    return isNaN(num) ? null : num;
  }
  function rpeLabel(v){
    var reste = 10 - v;
    if (reste <= 0) return 'RPE 10 — à l\'échec';
    return 'RPE ' + v + ' — ' + (reste === 1 ? '1 rep en réserve' : reste + ' reps en réserve');
  }

  // Au temps, il n'y a pas de repetition en reserve : on note la difficulte
  // ressentie, de 1 a 10. Meme champ que le RPE — c'est ce que le sigle veut
  // dire au depart — donc meme colonne en base et dans le tableur.
  var DIFF_VALUES = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  function diffLabel(v){
    return v >= 10 ? 'Difficulté 10/10 — impossible de tenir plus' : 'Difficulté ' + v + '/10';
  }

  // Repeint les etoiles de record d'une carte sans la reconstruire : le
  // rendu complet ferait perdre le focus et la position de defilement.
  function majEtoilesRecord(card){
    if (!card) return;
    var day = state.sessions[state.selectedDay];
    if (!day) return;
    var ex = findExercise(day, card.dataset.id);
    if (!ex) return;
    (ex.series || []).forEach(function(s){
      var ligne = card.querySelector('.serie-card[data-serie-id="'+ esc(s.id) +'"] .serie-main');
      if (!ligne) return;
      var actuelle = ligne.querySelector('.serie-pr');
      var doit = isNewRecord(s, ex.nom);
      if (doit && !actuelle) ligne.insertAdjacentHTML('beforeend', ETOILE_PR);
      else if (!doit && actuelle) actuelle.remove();
    });
  }

  var ETOILE_PR = '<span class="serie-pr" title="Nouveau record" aria-label="Nouveau record"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffd23f" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.6 6.1.8-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.4l6.1-.8z"></path></svg></span>';

  // ---------- la carte d'un exercice ----------
  // Une serie tient sur UNE ligne, comme dans les carnets qu'on connait
  // (Strong, Hevy) : SÉRIE · PRÉC. · KG · REPS · RPE · ✓. Le numero porte le
  // type — on le touche pour en changer —, la colonne PRÉC. montre la meme
  // serie la derniere fois et la recopie d'un appui. Ce qui sert moins (les
  // pas de 2,5 kg, le repos, le commentaire, la suppression) vit dans une
  // barre d'outils, sous la seule serie « ouverte » : celle qu'on va faire.
  // Une serie faite perd ses cadres et se lit comme une ligne de texte ; on
  // la touche pour la corriger. Avant, chaque serie prenait trois lignes, et
  // un exercice de cinq series remplissait deux ecrans.
  var TYPE_COURT = {};
  TYPE_COURT[TS.TYPES.ECHAUFFEMENT] = 'ÉCH.';
  TYPE_COURT[TS.TYPES.TOP] = 'TOP';
  TYPE_COURT[TS.TYPES.BACKOFF] = 'B.O.';

  // La serie ouverte de chaque exercice, en memoire seulement : c'est un
  // etat d'ecran, pas une donnee. Par defaut, la premiere pas encore faite.
  var serieOuverte = {};
  function serieOuverteDe(ex){
    var series = ex.series || [];
    var id = serieOuverte[ex.id];
    if (id && series.some(function(s){ return s.id === id; })) return id;
    for (var i = 0; i < series.length; i++) if (!series[i].fait) return series[i].id;
    return null;
  }

  function cardioTexte(s){
    return (typeof s.vitesse === 'number' ? ' · ' + formatWeight(s.vitesse) + ' km/h' : '')
      + (typeof s.inclinaison === 'number' ? ' · ' + formatWeight(s.inclinaison) + ' %' : '');
  }
  function perfTexte(s){
    var d = TS.dureeSecondes(s && s.reps);
    if (d !== null){
      var lest = (typeof s.poids === 'number' && s.poids > 0) ? ' · ' + formatWeight(s.poids) + ' kg' : '';
      return TS.formatDuree(d) + lest + cardioTexte(s);
    }
    var p = (typeof s.poids === 'number') ? formatWeight(s.poids) + ' kg' : '';
    var r = s.reps ? String(s.reps) : '';
    if (p && r) return p + ' × ' + r;
    return p || r || '—';
  }
  // La meme chose en quelques caracteres, pour la colonne PRÉC.
  function perfCourt(s){
    var d = TS.dureeSecondes(s && s.reps);
    if (d !== null) return TS.formatDuree(d);
    var p = (typeof s.poids === 'number') ? formatWeight(s.poids) : '';
    var r = s.reps ? String(s.reps) : '';
    if (p && r) return p + '×' + r;
    return p ? p + ' kg' : (r ? '×' + r : '—');
  }

  var ICONE_NOTE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"></path></svg>';
  var ICONE_SUPPR = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"></path></svg>';

  function noteSerieHTML(s, num){
    return '<div class="serie-note-ligne">'
      + '<span class="serie-note-fleche" aria-hidden="true">↳</span>'
      + '<input type="text" class="serie-note" maxlength="'+NOTE_MAX+'" enterkeyhint="done" autocomplete="off"'
      +   ' placeholder="assistée, bandes, fatigué…" aria-label="Commentaire sur la série '+num+'"'
      +   ' data-field="note" data-serie-id="'+ esc(s.id) +'" value="'+esc(s.note||'')+'">'
      + '</div>';
  }

  function serieRowHTML(s, idx, ex, auTemps, prec, ouverte){
    var pr = isNewRecord(s, ex.nom);
    var num = idx + 1;
    var sid = esc(s.id);
    var cardio = auTemps && estCardio(ex);
    var typeCourant = s.type || '';
    var typeOptions = TYPE_LABELS.map(function(p){
      return '<option value="'+p[0]+'"'+(typeCourant===p[0]?' selected':'')+'>'+p[1]+'</option>';
    }).join('');
    var rpeOptions = '<option value="">' + (auTemps ? 'DIFF.' : 'RPE') + '</option>'
      + (auTemps ? DIFF_VALUES : RPE_VALUES).map(function(v){
      return '<option value="'+v+'"'+(s.rpe===v?' selected':'')+'>'+v+'</option>';
    }).join('');
    var titreEffort = auTemps
      ? (s.rpe==null ? 'Difficulté ressentie, de 1 à 10' : esc(diffLabel(s.rpe)))
      : (s.rpe==null ? 'Reps en réserve : 10 = à l\'échec, 9 = 1 rep en réserve' : esc(rpeLabel(s.rpe)));

    // La meme serie, la derniere fois : la 3e d'aujourd'hui en face de la 3e.
    var ps = prec && prec.series[idx];
    // Du texte, rien a toucher. Recopier d'un appui collait les chiffres de
    // la semaine d'avant dans une ligne a 4 px de la case du poids : un appui
    // de travers, et on notait une serie qu'on n'avait pas faite. Pour revoir
    // cette seance, c'est la date en tete de colonne.
    var precHTML = ps
      ? '<span class="serie-prec' + (prec.topSet && ps === prec.topSet ? ' top' : '') + '" aria-hidden="true">' + esc(perfCourt(ps)) + '</span>'
      : '<span class="serie-prec vide" aria-hidden="true">—</span>';

    var valeur = cardio
      ? '<input type="text" inputmode="decimal" enterkeyhint="next" class="serie-cardio serie-minutes" placeholder="min" aria-label="Durée en minutes, série '+num+'" data-field="minutes" data-serie-id="'+ sid +'" value="'+esc(minutesAffichees(s))+'">'
      + '<input type="text" inputmode="decimal" enterkeyhint="next" class="serie-cardio serie-vitesse" placeholder="km/h" aria-label="Vitesse moyenne en km/h, série '+num+'" data-field="vitesse" data-serie-id="'+ sid +'" value="'+esc(typeof s.vitesse === 'number' ? formatWeight(s.vitesse) : '')+'">'
      + '<input type="text" inputmode="decimal" enterkeyhint="done" class="serie-cardio serie-incl" placeholder="%" aria-label="Inclinaison moyenne en %, série '+num+'" data-field="inclinaison" data-serie-id="'+ sid +'" value="'+esc(typeof s.inclinaison === 'number' ? formatWeight(s.inclinaison) : '')+'">'
      : auTemps
      ? '<label class="serie-duree-champ"><input type="text" inputmode="numeric" enterkeyhint="done" class="serie-duree" placeholder="sec" aria-label="Durée en secondes, série '+num+'" data-field="duree" data-serie-id="'+ sid +'" value="'+esc(secondesAffichees(s))+'"><span class="serie-unite" aria-hidden="true">s</span></label>'
      : '<input type="text" inputmode="decimal" enterkeyhint="next" class="serie-poids" placeholder="kg" aria-label="Poids série '+num+'" data-field="poids" data-serie-id="'+ sid +'" value="'+esc(poidsAffiche(s.poids))+'">'
      + '<input type="text" inputmode="numeric" enterkeyhint="done" class="serie-reps" placeholder="reps" aria-label="Répétitions série '+num+'" data-field="reps" data-serie-id="'+ sid +'" value="'+esc(s.reps==null?'':s.reps)+'">';

    var pas = cardio
      ? '<button type="button" class="step-btn" data-action="step-temps" data-delta="-60" data-serie-id="'+ sid +'" aria-label="Retirer 1 minute à la série '+num+'">−1′</button>'
      + '<button type="button" class="step-btn" data-action="step-temps" data-delta="60" data-serie-id="'+ sid +'" aria-label="Ajouter 1 minute à la série '+num+'">+1′</button>'
      : auTemps
      ? '<button type="button" class="step-btn" data-action="step-temps" data-delta="-5" data-serie-id="'+ sid +'" aria-label="Retirer 5 secondes à la série '+num+'">−5</button>'
      + '<button type="button" class="step-btn" data-action="step-temps" data-delta="5" data-serie-id="'+ sid +'" aria-label="Ajouter 5 secondes à la série '+num+'">+5</button>'
      : '<button type="button" class="step-btn" data-action="step" data-delta="-2.5" data-serie-id="'+ sid +'" aria-label="Retirer 2,5 kg à la série '+num+'">−</button>'
      + '<button type="button" class="step-btn" data-action="step" data-delta="2.5" data-serie-id="'+ sid +'" aria-label="Ajouter 2,5 kg à la série '+num+'">+</button>';

    return '<div class="serie-card'+(s.fait?' fait':'')+(ouverte?' ouverte':'')+'" data-serie-id="'+ sid +'"'
      + (typeCourant ? ' data-type="'+typeCourant+'"' : '') + '>'
      + '<div class="serie-main">'
      // Le numero est le menu du type : c'est la qu'on le cherche dans les
      // autres carnets, et ca evite une ligne entiere pour un menu.
      +   '<label class="serie-num"><span class="serie-num-txt">' + (TYPE_COURT[typeCourant] || num) + '</span>'
      +     '<select class="serie-type" data-field="type" data-serie-id="'+ sid +'" aria-label="Série '+num+', type">'+typeOptions+'</select></label>'
      +   precHTML
      +   valeur
      // Le cardio n'a pas de difficulte : la vitesse et l'inclinaison la disent.
      +   (cardio ? '' : '<select class="serie-rpe'+(s.rpe==null?' vide':'')+'" data-field="rpe"' + (auTemps ? ' data-mode="temps"' : '') + ' data-serie-id="'+ sid +'" title="'+titreEffort+'" aria-label="'+(auTemps ? 'Difficulté' : 'RPE')+' série '+num+'">'+rpeOptions+'</select>')
      +   '<button type="button" class="serie-check'+(s.fait?' checked':'')+'" data-action="toggle-fait" data-serie-id="'+ sid +'" aria-pressed="'+(s.fait?'true':'false')+'" aria-label="Série '+num+' — '+(s.fait?'marquer comme non faite':'marquer comme faite')+'">'+(s.fait?'✓':'')+'</button>'
      +   (pr ? ETOILE_PR : '')
      + '</div>'
      + '<div class="serie-outils">'
      +   pas
      +   '<label class="serie-repos-champ"><span>REPOS</span>'
      +     '<input type="text" inputmode="numeric" enterkeyhint="done" class="serie-repos" placeholder="90" data-field="repos" data-serie-id="'+ sid +'" aria-label="Repos après la série '+num+', en secondes" value="'+esc(s.repos||'')+'"></label>'
      +   '<button type="button" class="serie-outil'+(s.note?' actif':'')+'" data-action="note-serie" data-serie-id="'+ sid +'" aria-label="Commentaire sur la série '+num+'">'+ICONE_NOTE+'</button>'
      +   '<button type="button" class="serie-outil serie-del" data-action="del-serie" data-serie-id="'+ sid +'" aria-label="Supprimer la série '+num+'">'+ICONE_SUPPR+'</button>'
      + '</div>'
      + (s.note ? noteSerieHTML(s, num) : '')
      + '</div>';
  }

  // La derniere seance sur cet exercice, et tout son historique : la
  // colonne PRÉC., la ligne « derniere fois » et la suggestion en viennent.
  function precedentDe(ex){
    var nom = ex && ex.nom;
    if (!nom || !nom.trim()) return null;
    var seances = seancesDeLExo(nom).filter(function(j){ return j.date !== state.selectedDay; });
    var prec = TS.performancePrecedente(seances, state.selectedDay);
    return prec ? { prec:prec, seances:seances } : null;
  }

  // Deux registres visuels distincts, et c'est volontaire : l'historique est
  // sobre et gris, la suggestion est orange et etiquetee SUGGERE. On ne doit
  // jamais pouvoir lire une recommandation comme une performance passee.
  function blocPrecedentHTML(ex, p){
    if (p === undefined) p = precedentDe(ex);
    if (!p) return '';
    var prec = p.prec;
    var d = fromDateStr(prec.date);
    var quand = d.getDate() + ' ' + MONTH_ABBR[d.getMonth()];
    // « Assistée sur la 3e » change la lecture de ces chiffres : les
    // commentaires de ce jour-la s'affichent avec eux.
    var jourPrec = p.seances.filter(function(j){ return j.date === prec.date; })[0];
    var notePrec = jourPrec && jourPrec.note;
    var html = '<div class="ex-prev">'
      + '<div class="ex-prev-tete">DERNIÈRE FOIS · ' + esc(quand.toUpperCase())
      // La liste ne sert que la ou la colonne PRÉC. n'a pas la place.
      +   '<span class="ex-prev-liste"> · ' + esc(prec.series.map(perfCourt).join(' · ')) + '</span></div>'
      + (notePrec ? '<div class="ex-prev-note">«\u00a0' + esc(notePrec) + '\u00a0»</div>' : '')
      + '</div>';

    // La cible s'appuie sur tout l'historique et pas seulement sur la
    // derniere seance : sans RPE note, c'est la tendance qui decide.
    var cible = TS.suggererCible(p.seances);
    if (cible){
      var reps = (cible.repsHaut && cible.repsHaut !== cible.reps)
        ? cible.reps + '–' + cible.repsHaut
        : String(cible.reps);
      var val = formatWeight(cible.poids) + ' kg × ' + reps;
      html += '<div class="ex-cible">'
        + '<div class="ex-cible-ligne">'
        +   '<span class="ex-cible-tag">SUGGÉRÉ</span>'
        +   '<span class="ex-cible-val">' + esc(val) + '</span>'
        +   '<button type="button" class="ex-cible-copie" data-copier="' + esc(ex.id) + '"'
        +     ' data-poids="' + cible.poids + '" data-reps="' + esc(String(cible.reps)) + '" data-type=""'
        +     ' aria-label="Recopier la cible ' + esc(val) + '">↺</button>'
        + '</div>'
        + '<div class="ex-cible-raison">' + esc(cible.raison) + '</div>'
        + '</div>';
    }
    return html;
  }

  // Recopier la cible ne valide rien : ca remplit la premiere serie encore
  // vide, et n'en ajoute une que s'il n'en reste aucune. Aucune valeur deja
  // saisie n'est ecrasee. C'est la seule recopie qui reste : la colonne de la
  // derniere fois se lit, elle ne recopie plus rien.
  function copierPerf(exId, poids, reps, type){
    var day = getOrCreateDay(state.selectedDay);
    var ex = findExercise(day, exId);
    if (!ex) return null;
    if (!ex.series) ex.series = [];
    var cible = null;
    for (var i = 0; i < ex.series.length; i++){
      if (!hasData(ex.series[i])){ cible = ex.series[i]; break; }
    }
    if (!cible){
      var derniere = ex.series[ex.series.length - 1];
      cible = { id:genSerieId(), poids:null, reps:'', rpe:null,
                repos:(derniere && derniere.repos) || ex.repos || '', fait:false };
      ex.series.push(cible);
    }
    cible.poids = poids;
    cible.reps = reps;
    // Le RPE ne se recopie pas : c'est ce qu'on ressentira aujourd'hui, pas
    // ce qu'on a ressenti la semaine derniere.
    cible.rpe = null;
    if (type) cible.type = type; else delete cible.type;
    return cible;
  }

  // Le HTML du bloc et des series est produit a un seul endroit : le rendu
  // initial et la mise a jour en direct ne peuvent pas diverger.
  function majBlocPrecedent(card, ex){
    if (!card) return;
    var zone = card.querySelector('.ex-prev-zone');
    if (!zone) return;
    zone.innerHTML = blocPrecedentHTML(ex);
  }

  function exerciseCardHTML(ex){
    var cl = classement(ex);
    var color = GROUP_COLORS[cl.groupe] || GROUP_COLORS['Autre'];
    var groupOptions = optionsMuscle(cl);
    var series = ex.series || [];
    var auTemps = estAuTemps(ex);
    var p = precedentDe(ex);
    var eid = esc(ex.id);
    // Un menu plutot que trois gros boutons en bas de chaque carte : ils
    // servent rarement, et prenaient autant de place qu'une serie.
    var menu = '<div class="ex-menu" role="group" aria-label="Actions sur l\'exercice">'
      + (auTemps || nomAuTemps(ex.nom) || cardioParDefaut(ex) || !series.some(serieRemplie)
          ? '<button type="button" class="ex-menu-item" data-action="mesure" data-id="'+ eid +'">'+libelleMesure(auTemps, cardioParDefaut(ex))+'</button>'
          : '')
      + '<button type="button" class="ex-menu-item danger ex-del" data-id="'+ eid +'">✕ SUPPRIMER L\'EXERCICE</button>'
      + '</div>';
    // Sans historique, la colonne de la derniere fois n'aurait que des tirets :
    // elle laisse sa place aux chiffres du jour.
    return '<div class="ex-card'+(p ? '' : ' sans-prec')+'" style="--card-color:'+color+'" data-id="'+ eid +'" data-mode="'+modeCarte(ex, auTemps)+'">'
      + '<div class="ex-head">'
      +   '<input class="ex-name" type="text" list="exerciseList" placeholder="Nom de l\'exercice" value="'+esc(ex.nom||'')+'" data-field="nom" data-id="'+ eid +'">'
      // Le groupe se remplit tout seul d'apres le nom : une pastille suffit,
      // qu'on touche pour le corriger.
      +   '<label class="ex-groupe-chip"><span class="ex-groupe-txt">'+esc(libelleMuscle(cl))+'</span>'
      +     '<select class="ex-groupe" data-field="groupe" data-id="'+ eid +'" aria-label="Groupe musculaire">'+groupOptions+'</select></label>'
      // L'exercice en plein ecran : pas pour le cardio, qui n'enchaine rien.
      +   (auTemps && estCardio(ex) ? '' : '<button type="button" class="ex-focus-btn" data-action="focus" data-id="'+ eid +'" aria-label="Ouvrir l\'exercice en plein écran"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/></svg></button>')
      +   '<button type="button" class="ex-menu-btn" data-action="menu-exo" data-id="'+ eid +'" aria-expanded="false" aria-label="Plus d\'actions sur l\'exercice">⋯</button>'
      + '</div>'
      + menu
      + '<div class="ex-body">'
      +   (ex.note ? '<div class="ex-prev-note">«\u00a0' + esc(ex.note) + '\u00a0»</div>' : '')
      +   '<div class="ex-prev-zone">' + blocPrecedentHTML(ex, p) + '</div>'
      +   '<div class="series-list">'+seriesListeHTML(ex, auTemps, p)+'</div>'
      +   '<div class="ex-actions">'
      +     '<button type="button" class="btn-add-serie" data-action="add-serie" data-id="'+ eid +'" aria-label="Ajouter une série'+(series.length?', qui reprend la précédente':'')+'">+ SÉRIE</button>'
      // La derniere fois, en un appui, a cote de « + SERIE » : tant qu'aucune
      // serie n'est remplie. La colonne de la derniere fois, elle, se lit.
      +     (p && !series.some(hasData) ? '<button type="button" class="btn-comme-avant" data-action="comme-avant" data-id="'+ eid +'">↺ DERNIÈRE FOIS</button>' : '')
      // Le chrono d'un gainage : lancer, puis pause, et la serie est notee.
      +     (auTemps && !estCardio(ex) ? boutonChronoHTML(ex) : '')
      // A cote de « + SERIE », parce que c'est au meme moment qu'on y pense :
      // juste apres la serie. Il va sur la derniere serie faite.
      +     (series.length ? '<button type="button" class="btn-add-note" data-action="ajout-note" data-id="'+ eid +'">+ COMMENTAIRE</button>' : '')
      +   '</div>'
      // Le superset est une action de saisie, pas un reglage : il reste avec
      // « + SERIE », la ou on ajoute quelque chose a sa seance.
      +   (ex.bloc
            ? '<button type="button" class="btn-superset" data-action="detacher" data-id="'+ eid +'">⇄ SORTIR DU SUPERSET</button>'
            : '<button type="button" class="btn-superset" data-action="superset" data-id="'+ eid +'">⇄ AJOUTER UN EXERCICE EN SUPERSET</button>')
      // Une seance passee et faite : l'exercice se recopie dans celle d'aujourd'hui.
      +   (seanceFaite(state.selectedDay) && series.some(serieRemplie)
            ? '<button type="button" class="btn-ajout-jour" data-action="ajout-jour" data-id="'+ eid +'">+ AJOUTER À MA SÉANCE DU JOUR</button>'
            : '')
      + '</div>'
      + '</div>';
  }

  function seriesListeHTML(ex, auTemps, p){
    var series = ex.series || [];
    if (!series.length) return '<div class="empty-state" style="padding:14px;font-size:12px;">Aucune série — ajoute la première ci-dessous.</div>';
    if (p === undefined) p = precedentDe(ex);
    var ouverte = serieOuverteDe(ex);
    // La colonne de la derniere fois porte sa date : « 8 SEPT. » se
    // comprend tout seul, « PRÉC. » non.
    var dPrec = p && fromDateStr(p.prec.date);
    var titrePrec = dPrec ? dPrec.getDate() + ' ' + MONTH_ABBR[dPrec.getMonth()].toUpperCase() : '';
    // La date est le seul chemin vers la seance d'avant : un vrai bouton,
    // encadre, au-dessus des lignes et loin des cases a remplir.
    var lienPrec = dPrec
      ? '<button type="button" class="col-prec-lien" data-action="voir-prec" data-date="' + esc(p.prec.date) + '" data-ex="' + esc(ex.id) + '"'
        + ' aria-label="Ouvrir la séance du ' + dPrec.getDate() + ' ' + MONTH_NAMES[dPrec.getMonth()] + '">' + esc(titrePrec) + '<i aria-hidden="true">›</i></button>'
      : '';
    return '<div class="series-tete"><span aria-hidden="true">SÉRIE</span><span class="col-prec">' + lienPrec + '</span>'
      + (auTemps && estCardio(ex) ? '<span aria-hidden="true">MIN</span><span aria-hidden="true">KM/H</span><span aria-hidden="true">INCL. %</span>'
         : auTemps ? '<span class="col-duree" aria-hidden="true">DURÉE</span><span aria-hidden="true">DIFF.</span>'
                 : '<span aria-hidden="true">KG</span><span aria-hidden="true">REPS</span><span aria-hidden="true">RPE</span>')
      + '<span aria-hidden="true">✓</span></div>'
      + series.map(function(s,idx){ return serieRowHTML(s, idx, ex, auTemps, p && p.prec, s.id === ouverte); }).join('');
  }
  function libelleMesure(auTemps, cardio){
    if (auTemps) return '⇄ PASSER EN RÉPÉTITIONS';
    return cardio ? '◷ PASSER EN CARDIO (MINUTES, VITESSE…)' : '◷ PASSER AU TEMPS (GAINAGE, PLANCHE…)';
  }
  // Taper un nom change tout ce qui en depend : la colonne PRÉC., et le
  // passage en secondes pour « Planche ». On repeint les series, pas la
  // carte : le champ du nom garde le focus, et le clavier reste ouvert.
  function repeindreSeries(card, ex){
    if (!card) return;
    var auTemps = estAuTemps(ex);
    var p = precedentDe(ex);
    card.dataset.mode = modeCarte(ex, auTemps);
    card.classList.toggle('sans-prec', !p);
    var liste = card.querySelector('.series-list');
    if (liste) liste.innerHTML = seriesListeHTML(ex, auTemps, p);
    var bascule = card.querySelector('[data-action="mesure"]');
    if (bascule) bascule.textContent = libelleMesure(auTemps, cardioParDefaut(ex));
  }
  // Une carte refaite sur place, sans toucher aux autres : cocher une serie
  // replie la ligne et ouvre la suivante.
  function repeindreCarte(card, ex){
    if (!card) return;
    var y = window.scrollY;
    lacherFocus(card);
    var tmp = document.createElement('div');
    tmp.innerHTML = exerciseCardHTML(ex);
    card.replaceWith(tmp.firstChild);
    garderDefilement(y);
  }
  // Un champ qui a le focus ne doit pas disparaitre sous les doigts : sur
  // iPhone, Safari ferme alors le clavier en renvoyant la page tout en haut.
  // On le quitte d'abord, et on remet la page ou elle etait.
  function lacherFocus(zone){
    var ae = document.activeElement;
    if (ae && ae !== document.body && zone && zone.contains(ae) && ae.blur) ae.blur();
  }
  function garderDefilement(y){
    if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);
  }
  // La pastille laisse la place au nom : « PECS » plutot que « PECTORAUX ».
  // Le menu, lui, garde les noms entiers.
  var GROUPE_COURT = { 'Pectoraux':'PECS', 'Quadriceps':'QUADRI', 'Adducteurs':'ADDUCT.', 'Abducteurs':'ABDUCT.', 'Avant-bras':'AV.-BRAS' };
  function groupeCourt(g){ g = g || 'Autre'; return GROUPE_COURT[g] || g.toUpperCase(); }
  // La pastille dit le plus precis : BICEPS plutot que BRAS. Le menu natif
  // range les sous-groupes sous leur groupe ; choisir le groupe seul veut
  // dire « sans precision ». Une valeur « groupe|sous ».
  function libelleMuscle(cl){ return groupeCourt(cl.sous || cl.groupe); }
  function optionsMuscle(cl){
    return GROUPS.map(function(g){
      var sous = SOUS_GROUPES[g];
      var choisi = function(s){ return cl.groupe === g && (cl.sous || '') === s ? ' selected' : ''; };
      if (!sous) return '<option value="' + g + '|"' + choisi('') + '>' + g + '</option>';
      return '<optgroup label="' + g + '"><option value="' + g + '|"' + choisi('') + '>' + g + ' (sans précision)</option>'
        + sous.map(function(s){ return '<option value="' + g + '|' + s + '"' + choisi(s) + '>' + s + '</option>'; }).join('')
        + '</optgroup>';
    }).join('');
  }
  function majPastilleGroupe(card, groupe, ex){
    if (!card) return;
    var cl = ex ? classement(ex) : { groupe:groupe, sous:null };
    card.style.setProperty('--card-color', GROUP_COLORS[cl.groupe] || GROUP_COLORS['Autre']);
    var txt = card.querySelector('.ex-groupe-txt');
    if (txt) txt.textContent = libelleMuscle(cl);
    var sel = card.querySelector('select.ex-groupe');
    if (sel) sel.value = cl.groupe + '|' + (cl.sous || '');
  }
  function ouvrirSerie(card, serieId){
    if (!card || !serieId) return;
    serieOuverte[card.dataset.id] = serieId;
    card.querySelectorAll('.serie-card').forEach(function(c){
      c.classList.toggle('ouverte', c.dataset.serieId === serieId);
    });
  }

  function exercisesHTML(exercises){
    var out = '', i = 0;
    while (i < exercises.length){
      var bloc = exercises[i].bloc;
      if (!bloc){ out += exerciseCardHTML(exercises[i]); i++; continue; }
      var groupe = [];
      while (i < exercises.length && exercises[i].bloc === bloc){ groupe.push(exercises[i]); i++; }
      // Un bloc reduit a un seul exercice n'est plus un superset : on l'affiche
      // comme un exercice normal plutot que d'encadrer une carte toute seule.
      if (groupe.length < 2){ out += exerciseCardHTML(groupe[0]); continue; }
      out += '<div class="superset"><div class="superset-tag">SUPERSET</div>'
           + groupe.map(exerciseCardHTML).join('')
           + '</div>';
    }
    return out;
  }

  // Un bloc qui ne compte plus qu'un membre doit disparaitre des donnees, pas
  // seulement de l'affichage : sans ca, il ressortirait sur un autre appareil.
  function nettoyerBlocs(day){
    var compte = {};
    (day.exercises || []).forEach(function(e){ if (e.bloc) compte[e.bloc] = (compte[e.bloc]||0) + 1; });
    (day.exercises || []).forEach(function(e){ if (e.bloc && compte[e.bloc] < 2) delete e.bloc; });
  }

  // ---------- reprendre une seance ----------
  function seriesRemplies(ex){
    return (ex && ex.series || []).filter(serieRemplie);
  }

  // Les journees qui ont vraiment servi, de la plus recente a la plus
  // ancienne. Le jour affiche est exclu : se recopier sur soi-meme
  // doublerait la seance en cours.
  // Toutes les seances du carnet : celles qui sont faites, et celles qui sont
  // seulement prevues — des exercices poses a l'avance, sans valeurs. Sans ca,
  // une seance qu'on vient de creer disparaitrait de sa propre page.
  function seancesReprenables(){
    return Object.keys(state.sessions)
      .filter(function(ds){
        var day = state.sessions[ds];
        return compterJour(day) > 0 || (day.exercises || []).length > 0 || titreChoisi(ds);
      })
      .sort().reverse()
      .map(function(ds){
        var day = state.sessions[ds];
        var faite = compterJour(day) > 0;
        var exos = (day.exercises || []).filter(function(e){
          return faite ? seriesRemplies(e).length : true;
        });
        return {
          date: ds,
          noms: exos.map(function(e){ return normalizeName(e.nom) || 'Sans nom'; }),
          exos: exos.length,
          series: compterJour(day),
          prevue: !faite
        };
      });
  }

  // Recopie les exercices et leurs series, valeurs comprises : c'est la
  // seance de la semaine derniere qui sert de point de depart, on ne
  // retape que ce qui a bouge. « fait » repart a faux — refaire le
  // travail, ce n'est pas heriter de la coche.
  function selectionnerSeance(ds){
    var source = state.sessions[ds];
    if (!source) return 0;
    var jour = getOrCreateDay(state.selectedDay);
    var blocs = {}, n = 0;
    (source.exercises || []).forEach(function(ex){
      var series = seriesRemplies(ex);
      if (!series.length) return;
      var bloc;
      if (ex.bloc){
        // Un identifiant de bloc neuf : sans ca, reprendre deux fois la meme
        // seance fusionnerait les deux supersets en un seul.
        if (!blocs[ex.bloc]) blocs[ex.bloc] = genId();
        bloc = blocs[ex.bloc];
      }
      jour.exercises.push({
        id: genId(), nom: ex.nom || '', groupe: ex.groupe || 'Autre',
        repos: ex.repos || '', bloc: bloc, mesure: ex.mesure,
        series: series.map(function(s){
          return { id:genSerieId(), poids:s.poids, reps:s.reps, rpe:s.rpe,
                   vitesse:s.vitesse, inclinaison:s.inclinaison,
                   repos:s.repos || '', fait:false };
        })
      });
      n++;
    });
    return n;
  }

  // ---------- le titre d'une seance ----------
  // Rang chronologique parmi TOUTES les seances, pas seulement celles sans
  // titre : sinon nommer une seance renumeroterait les autres, et un numero
  // qui bouge n'est plus un repere.
  function numeroSeance(ds){
    var toutes = Object.keys(state.sessions).filter(function(d){
      return compterJour(state.sessions[d]) > 0;
    }).sort();
    var i = toutes.indexOf(ds);
    return i < 0 ? null : i + 1;
  }

  // Les deux groupes les plus travailles ce jour-la, mesures en series.
  // « Autre » ne compte pas : c'est la valeur par defaut de l'app, donc
  // l'absence de reponse, pas une reponse.
  function groupesPrincipaux(ds){
    var day = state.sessions[ds];
    if (!day) return [];
    var compte = {};
    // Une seance prevue n'a pas encore de series remplies : on compte alors
    // les exercices poses. Sans ca, une seance de squat preparee a l'avance
    // s'appellerait « Seance » au lieu de « Jambes ».
    var faite = compterJour(day) > 0;
    (day.exercises || []).forEach(function(e){
      var n = faite ? seriesRemplies(e).length : 1;
      if (!n) return;
      var g = classement(e).groupe;
      if (g === 'Autre') return;
      compte[g] = (compte[g] || 0) + n;
    });
    return Object.keys(compte).sort(function(a, b){
      if (compte[b] !== compte[a]) return compte[b] - compte[a];
      // A egalite, l'ordre de la liste des groupes : deux seances identiques
      // ne doivent pas s'appeler differemment selon l'ordre de saisie.
      return GROUPS.indexOf(a) - GROUPS.indexOf(b);
    }).slice(0, 2);
  }

  function titreParDefaut(ds){
    var g = groupesPrincipaux(ds);
    if (g.length) return g.join(' · ');
    var n = numeroSeance(ds);
    return n ? 'Séance ' + n : 'Séance';
  }
  function titreChoisi(ds){
    var day = state.sessions[ds];
    var t = day && day.titre;
    return (typeof t === 'string' && t.trim()) ? t.trim() : '';
  }
  function titreSeance(ds){ return titreChoisi(ds) || titreParDefaut(ds); }

  function definirTitre(ds, titre){
    var day = getOrCreateDay(ds);
    var v = String(titre == null ? '' : titre).trim().slice(0, 60);
    // Effacer un titre n'est pas mettre un titre vide : c'est revenir au
    // titre calcule.
    if (v) day.titre = v; else delete day.titre;
    persistDay(ds);
    if (typeof Sync !== 'undefined' && Sync.marquerTitre) Sync.marquerTitre(ds);
  }

  // Combien de fois cette seance a-t-elle ete faite ? Deux seances sont « la
  // meme » quand elles portent le meme nom — celui qu'on a choisi, ou celui
  // que l'app calcule. C'est le seul critere que l'utilisateur controle.
  function foisFaite(ds){
    var t = titreSeance(ds).toLowerCase();
    return Object.keys(state.sessions).filter(function(d){
      return compterJour(state.sessions[d]) > 0 && titreSeance(d).toLowerCase() === t;
    }).length;
  }

  // ---------- la fin de seance ----------
  // Valider sa seance, c'est dire « c'est fini » — et recevoir en retour ce
  // qu'on vient de faire, en chiffres. L'app ne le calcule que la : pendant la
  // seance, on note, on ne contemple pas.
  //
  // Rien n'est invente : chaque ligne du bilan vient des series saisies, et
  // les comparaisons se font sur le 1RM estime (formule d'Epley, celle du
  // reste de l'app), parce que 105 × 8 vaut mieux que 112,5 × 5.
  function estTerminee(ds){
    var day = state.sessions[ds];
    return !!(day && day.termine);
  }
  function marquerSeanceFinie(ds, fin){
    var day = getOrCreateDay(ds);
    if (fin) day.termine = fin; else delete day.termine;
    scheduleSave(ds, true);
    if (typeof Sync !== 'undefined' && Sync.marquerFin) Sync.marquerFin(ds);
  }

  // Des phrases courtes, une par jour, tirees de la date : le meme jour donne
  // toujours la meme, et demain change. Rien de medical, rien de mielleux.
  var MOTS_FIN = [
    'C\'est plié. Une de plus au compteur.',
    'Le travail est fait. Personne peut te l\'enlever.',
    'Pas spectaculaire, juste du travail. C\'est le meilleur genre.',
    'T\'es venu : c\'est déjà la moitié du truc.',
    'La barre monte parce que tu reviens.',
    'Une séance de plus que la version de toi qui est restée au lit.',
    'Régulier bat motivé.',
    'Rien de magique : des séries, des semaines, des années.',
    'Ce que tu viens de faire compte, même si ça se voit pas encore.',
    'Tu t\'es présenté. Le reste suit.',
    'Les grosses séances se construisent avec des séances comme ça.',
    'Bien joué. Mange, dors, recommence.',
    'La progression, c\'est ça : encore une fois.',
    'Tu sais ce qui marche ? Revenir. Tu viens de le faire.',
    'Une brique de plus.',
    'Personne d\'autre n\'a soulevé ça pour toi.',
    'Le carnet retient ce que la tête oublie.',
    'C\'est dans la boîte.',
    'Tu as fait ta part du marché.',
    'Un jour où tu ne t\'es pas trouvé d\'excuse.',
    'Chaque série notée, c\'est une preuve de plus.',
    'On ne triche pas avec la barre. Toi non plus.',
    'Solide. À la prochaine.',
    'La semaine se gagne à ce genre de jour.',
    'Rentre, récupère : le muscle se fabrique après.',
    'Tu viens de rendre la prochaine séance plus facile.',
    'Discipline 1 — canapé 0.',
    'Tu n\'as pas besoin d\'être motivé, tu as juste besoin d\'y aller. Fait.',
    'Ça, c\'est du concret.',
    'Le meilleur exercice, c\'est celui que tu fais. Coché.'
  ];
  function motDuJour(ds){
    var somme = 0;
    String(ds || '').split('').forEach(function(c){ somme += c.charCodeAt(0); });
    return MOTS_FIN[somme % MOTS_FIN.length];
  }

  // La meme seance la semaine d'avant, reconnue a ses exercices : parmi les
  // quatorze jours precedents, celui qui en partage le plus avec ce jour, et a
  // egalite le plus proche de sept jours. minimum : combien il en faut en
  // commun — un gainage partage ne fait pas d'une seance jambes une seance pecs.
  function clesDuJour(ds, remplisSeuls){
    var day = state.sessions[ds], cles = {};
    ((day && day.exercises) || []).forEach(function(e){
      if (!e.nom || !e.nom.trim()) return;
      if (remplisSeuls && !seriesRemplies(e).length) return;
      cles[cleCanonique(e.nom)] = true;
    });
    return cles;
  }
  function seanceComparable(ds, cles, minimum){
    var liste = Object.keys(cles);
    if (!liste.length) return null;
    var base = fromDateStr(ds), best = null;
    for (var k = 1; k <= 14; k++){
      var x = toDateStr(addDays(base, -k));
      if (!state.sessions[x] || !compterJour(state.sessions[x])) continue;
      var autres = clesDuJour(x, true);
      var communs = liste.filter(function(c){ return autres[c]; }).length;
      var ecart = Math.abs(k - 7);
      if (communs && (!best || communs > best.communs || (communs === best.communs && ecart < best.ecart))){
        best = { ds:x, communs:communs, ecart:ecart };
      }
    }
    return best && best.communs >= (minimum || 1) ? best.ds : null;
  }
  function seriesDuJourPour(ds, cle){
    var out = [];
    ((state.sessions[ds] && state.sessions[ds].exercises) || []).forEach(function(e){
      if (e.nom && cleCanonique(e.nom) === cle) out = out.concat(seriesRemplies(e));
    });
    return out;
  }
  // Un exercice contre lui-meme ce jour-la, sur ce qui se compare : le 1RM
  // estime du top set, les reps d'un exercice sans charge, la duree totale
  // d'un cardio, la meilleure tenue d'un gainage.
  function comparerExo(e, avant){
    var auj = seriesRemplies(e);
    function durees(ss){ return ss.map(function(s){ return TS.dureeSecondes(s.reps); }).filter(function(d){ return d !== null; }); }
    var dAuj = durees(auj), dAvant = durees(avant);
    var val, valAvant, texte, texteAvant;
    if (dAuj.length && dAvant.length){
      var somme = function(t){ return t.reduce(function(a, b){ return a + b; }, 0); };
      if (estCardio(e)){ val = somme(dAuj); valAvant = somme(dAvant); }
      else { val = Math.max.apply(null, dAuj); valAvant = Math.max.apply(null, dAvant); }
      texte = TS.formatDuree(val); texteAvant = TS.formatDuree(valAvant);
    } else if (!dAuj.length && !dAvant.length){
      var top = TS.calculerTopSet(auj), topAvant = TS.calculerTopSet(avant);
      if (!top || !topAvant) return null;
      val = TS.epleySerie(top); valAvant = TS.epleySerie(topAvant);
      if (!val && !valAvant && !(top.poids > 0) && !(topAvant.poids > 0)){
        val = parseInt(top.reps, 10); valAvant = parseInt(topAvant.reps, 10);
      }
      texte = perfTexte(top); texteAvant = perfTexte(topAvant);
    } else return null;
    if (!(val > 0) || !(valAvant > 0)) return null;
    var pct = Math.round(((val - valAvant) / valAvant) * 1000) / 10;
    var sens = (texte === texteAvant || Math.abs(pct) < 0.5) ? 'egal' : (pct > 0 ? 'hausse' : 'baisse');
    return { nom:nomCanonique(e.nom) || e.nom, texte:texte, avant:texteAvant, pct:pct, sens:sens };
  }
  function sensTexte(l){
    if (l.sens === 'egal') return '= STABLE';
    var p = String(Math.abs(l.pct)).replace('.', ',');
    return l.sens === 'hausse' ? '▲ +' + p + ' %' : '▼ −' + p + ' %';
  }

  function bilanDuJour(ds){
    var day = state.sessions[ds];
    if (!day) return null;
    var exos = (day.exercises || []).filter(function(e){ return seriesRemplies(e).length; });
    if (!exos.length) return null;

    var bilan = {
      date: ds,
      titre: titreSeance(ds),
      series: compterJour(day),
      exos: exos.length,
      records: 0,
      top: null,
      progres: [],
      comparaison: null,
      mot: motDuJour(ds)
    };

    // D'abord la meme seance la semaine d'avant : c'est la comparaison qui
    // compte. Un exercice deja compare la ne se repete pas plus bas.
    var cles = clesDuJour(ds, true);
    var ref = seanceComparable(ds, cles, Math.max(1, Math.ceil(Object.keys(cles).length / 2)));
    var compares = {};
    if (ref){
      var lignes = [];
      exos.forEach(function(e){
        var cle = cleCanonique(e.nom || '');
        if (!e.nom || compares[cle]) return;
        var avantRef = seriesDuJourPour(ref, cle);
        if (!avantRef.length) return;
        var l = comparerExo(e, avantRef);
        if (!l) return;
        compares[cle] = true;
        lignes.push(l);
      });
      if (lignes.length){
        bilan.comparaison = { ds:ref, lignes:lignes,
          hausse: lignes.filter(function(l){ return l.sens === 'hausse'; }).length };
      }
    }

    exos.forEach(function(e){
      var remplies = seriesRemplies(e);
      remplies.forEach(function(s){ if (isNewRecord(s, e.nom)) bilan.records++; });

      var top = TS.calculerTopSet(remplies);
      if (top){
        var rm = TS.epleySerie(top);
        // Le top set du jour : celui dont le 1RM estime est le plus haut.
        if (rm && (!bilan.top || rm > bilan.top.rm)){
          bilan.top = { nom:nomCanonique(e.nom) || e.nom, texte:perfTexte(top), rm:rm };
        }
      }

      // Mieux que la derniere fois, sur le meme exercice : on compare ce qui
      // est comparable — 1RM estime contre 1RM estime, duree contre duree.
      if (e.nom && compares[cleCanonique(e.nom)]) return;
      var histo = seancesDeLExo(e.nom).filter(function(j){ return j.date < ds; });
      var avant = histo[histo.length - 1];
      if (!avant) return;
      var tenu = remplies.map(function(s){ return TS.dureeSecondes(s.reps); })
                         .filter(function(d){ return d !== null; });
      if (tenu.length){
        var best = Math.max.apply(null, tenu);
        var bestAvant = TS.meilleureDuree([avant]);
        if (bestAvant && best > bestAvant){
          bilan.progres.push({ nom:nomCanonique(e.nom) || e.nom,
            texte: TS.formatDuree(best) + ' contre ' + TS.formatDuree(bestAvant) + ' le ' + jourCourt(avant.date) });
        }
        return;
      }
      if (!top) return;
      var topAvant = TS.calculerTopSet(avant.series);
      var rmAvant = topAvant ? TS.epleySerie(topAvant) : null;
      var rmTop = TS.epleySerie(top);
      if (!rmAvant || !rmTop || rmTop <= rmAvant) return;
      var pourcent = Math.round(((rmTop - rmAvant) / rmAvant) * 1000) / 10;
      bilan.progres.push({ nom:nomCanonique(e.nom) || e.nom,
        texte: formatWeight(Math.round(rmTop)) + ' kg estimés contre ' + formatWeight(Math.round(rmAvant))
             + ' le ' + jourCourt(avant.date) + (pourcent >= 0.5 ? ' · +' + String(pourcent).replace('.', ',') + ' %' : '') });
    });
    return bilan;
  }
  // « samedi » -> « Samedi » : la premiere lettre seulement, sinon le mois
  // prend une majuscule qu il n a pas en francais.
  function majuscule(t){
    t = String(t == null ? '' : t);
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function jourCourt(ds){
    var d = fromDateStr(ds);
    return d.getDate() + ' ' + MONTH_ABBR[d.getMonth()];
  }
  // « lundi 7 sept. »
  function jourDe(ds){
    var d = fromDateStr(ds);
    return DAY_NAMES[(d.getDay()+6)%7].toLowerCase() + ' ' + jourCourt(ds);
  }

  // ---------- la page Seances ----------
  // DU JOUR, c'est le carnet ou l'on note : le jour choisi, aujourd'hui a
  // l'ouverture de l'app. Puis deux rubriques, et la frontiere est la meme que celle qu'on a dans la
  // tete : ce qui reste a faire d'un cote, ce qui est fait de l'autre.
  //
  //   MES SÉANCES  une seance pas encore loguee, quelle que soit sa date, ou
  //                une seance d'aujourd'hui ou d'apres. Triee du plus ancien
  //                au plus recent : une seance prevue et jamais faite remonte
  //                en haut, la ou on la voit.
  //   HISTORIQUE   ce qui est logue et date d'avant aujourd'hui. Du plus
  //                recent au plus ancien, comme on relit un carnet.
  //
  // Une seance loguee aujourd'hui reste dans « mes seances » jusqu'a demain :
  // c'est encore celle sur laquelle on travaille.
  function trierSeances(){
    var aujourdhui = toDateStr(new Date());
    var toutes = seancesReprenables();
    var mes = [], histo = [];
    toutes.forEach(function(s){
      if (s.prevue || s.date >= aujourdhui) mes.push(s); else histo.push(s);
    });
    mes.sort(function(a, b){ return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); });
    return { mes:mes, histo:histo };   // histo est deja du plus recent au plus ancien
  }

  function renderSeances(){
    var champ = document.getElementById('seanceDate');
    if (champ && !champ.value) champ.value = toDateStr(new Date());
    var liste = document.getElementById('seancesListe');
    var cible = document.getElementById('seancesCible');
    var bloc  = document.getElementById('seanceCreerBloc');

    document.querySelectorAll('#seancesTabs .seg-btn').forEach(function(b){
      b.classList.toggle('active', b.dataset.onglet === seancesOnglet);
    });
    var duJour = seancesOnglet === 'jour';
    document.getElementById('seancesJour').hidden = !duJour;
    document.getElementById('seancesListes').hidden = duJour;
    if (duJour){ renderSeanceJour(false); return; }

    var groupes = trierSeances();
    var mes = seancesOnglet === 'mes';
    var seances = mes ? groupes.mes : groupes.histo;

    // Creer une seance n'a de sens que dans la rubrique ou elle atterrira.
    bloc.hidden = !mes;

    if (!seances.length){
      cible.textContent = '';
      liste.innerHTML = '<div class="seances-vide">' + (mes
        ? 'Aucune séance prévue. Crée-en une ci-dessus, ou note-la directement dans DU JOUR.'
        : 'Rien dans l\'historique pour l\'instant. Les séances terminées viendront ici toutes seules.')
        + '</div>';
      return;
    }
    cible.textContent = mes
      ? 'Ouvre une séance pour la modifier, la renommer, ou la sélectionner pour un autre jour.'
      : 'Ouvre une séance passée pour voir son récap, ou la reprendre telle quelle pour un autre jour.';

    var moisVu = '', html = '';
    seances.forEach(function(s){
      var sd = fromDateStr(s.date);
      var mois = MONTH_NAMES[sd.getMonth()] + ' ' + sd.getFullYear();
      if (mois !== moisVu){
        moisVu = mois;
        html += '<div class="seance-mois">' + esc(mois) + '</div>';
      }
      var couleur = GROUP_COLORS[groupesPrincipaux(s.date)[0]] || GROUP_COLORS['Autre'];
      var quandS = DAY_NAMES[(sd.getDay()+6)%7] + ' ' + sd.getDate() + ' ' + MONTH_ABBR[sd.getMonth()];
      var noms = s.noms.slice(0, 5).join(' · ') + (s.noms.length > 5 ? ' · +' + (s.noms.length - 5) : '');
      var vol = volumeTexte(dayVolume(s.date));
      html += '<button type="button" class="seance-carte' + (s.prevue ? ' prevue' : '') + '" data-ouvrir="' + esc(s.date) + '" style="--card-color:' + couleur + '">'
        + '<span class="seance-tete"><span class="seance-titre">' + esc(titreSeance(s.date)) + '</span>'
        +   (s.prevue ? '<span class="seance-badge">PRÉVUE</span>' : '')
        +   '<span class="seance-fleche">›</span></span>'
        + '<span class="seance-corps">'
        +   '<span class="seance-quand">' + esc(quandS) + '</span>'
        +   '<span class="seance-exos">' + esc(noms || 'Aucun exercice pour l\'instant') + '</span>'
        +   '<span class="seance-chiffres">'
        +     '<span class="seance-chip">' + s.exos + (s.exos > 1 ? ' EXOS' : ' EXO') + '</span>'
        +     (s.prevue ? '' : '<span class="seance-chip">' + s.series + (s.series > 1 ? ' SÉRIES' : ' SÉRIE') + '</span>')
        +     (vol ? '<span class="seance-chip">' + esc(vol) + '</span>' : '')
        +   '</span>'
        + '</span>'
        + '</button>';
    });
    liste.innerHTML = html;
  }

  // ---------- la fiche d'une seance ----------
  // Depuis le planning, on regarde la seance : sa fiche, rangee sous MES
  // SÉANCES, et RETOUR ramene au calendrier.
  function ouvrirSeance(ds, depuis){
    state.seanceOuverte = ds;
    state.ficheRetour = depuis || 'seances';
    if (depuis === 'planning') seancesOnglet = 'mes';
    montrerVue('seance');
    window.scrollTo(0, 0);
  }

  function ligneProgression(nom, ds, meilleure){
    var prev = findPreviousOccurrence(nom, ds);
    if (!prev || typeof prev.poids !== 'number' || typeof meilleure !== 'number') return '';
    var pd = fromDateStr(prev.date);
    var quand = pd.getDate() + ' ' + MONTH_ABBR[pd.getMonth()];
    var delta = Math.round((meilleure - prev.poids) * 100) / 100;
    var classe = delta > 0 ? ' hausse' : (delta < 0 ? ' baisse' : '');
    var signe = delta > 0 ? '+' : '';
    var txt = delta === 0
      ? 'Même charge que le ' + quand
      : '<b>' + signe + formatWeight(delta) + ' kg</b> par rapport au ' + quand +
        ' (' + formatWeight(prev.poids) + ' kg)';
    return '<div class="fiche-delta' + classe + '">' + txt + '</div>';
  }

  // Au temps : la plus longue serie du jour contre la plus longue de la
  // derniere fois. Des secondes contre des secondes.
  function ligneProgressionDuree(nom, ds, meilleure){
    var avant = seancesDeLExo(nom).filter(function(j){ return j.date < ds; });
    if (!avant.length) return '';
    var prec = avant[avant.length - 1];
    var sa = TS.meilleureDuree([prec]);
    if (sa === null) return '';
    var pd = fromDateStr(prec.date);
    var quand = pd.getDate() + ' ' + MONTH_ABBR[pd.getMonth()];
    var delta = meilleure - sa;
    var classe = delta > 0 ? ' hausse' : (delta < 0 ? ' baisse' : '');
    var txt = delta === 0
      ? 'Même temps que le ' + quand
      : '<b>' + (delta > 0 ? '+' : '−') + esc(TS.formatDuree(Math.abs(delta))) + '</b> par rapport au ' + quand +
        ' (' + esc(TS.formatDuree(sa)) + ')';
    return '<div class="fiche-delta' + classe + '">' + txt + '</div>';
  }

  function renderSeanceDetail(){
    var hote = document.getElementById('seanceDetail');
    var ds = state.seanceOuverte;
    if (!ds){ hote.innerHTML = ''; return; }
    var day = state.sessions[ds];
    var exos = day ? (day.exercises || []).filter(function(e){ return seriesRemplies(e).length; }) : [];
    var d = fromDateStr(ds);
    var quand = DAY_NAMES[(d.getDay()+6)%7] + ' ' + d.getDate() + ' ' + MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
    var couleur = GROUP_COLORS[groupesPrincipaux(ds)[0]] || GROUP_COLORS['Autre'];
    var perso = titreChoisi(ds);
    var fois = foisFaite(ds);

    var html = '<div class="fiche-tete" style="--card-color:' + couleur + '">'
      + '<div class="fiche-titre-ligne">'
      +   '<button type="button" class="fiche-titre" id="ficheTitre" title="Renommer">' + esc(titreSeance(ds)) + '</button>'
      +   '<button type="button" class="seance-crayon" id="ficheCrayon" aria-label="Renommer la séance">✎</button>'
      + '</div>'
      + '<div class="fiche-quand">' + esc(quand) + '</div>'
      + (perso ? '' : '<div class="fiche-defaut">Titre calculé — appuie dessus pour le tien</div>')
      + '</div>';

    if (!exos.length){
      var poses = day ? (day.exercises || []).length : 0;
      html += '<div class="seances-vide">'
        + (poses
            ? 'Séance prévue : ' + poses + (poses > 1 ? ' exercices posés' : ' exercice posé') + ', aucune valeur notée.'
            : 'Rien de noté ce jour-là.')
        + '</div>';
      html += '<button type="button" class="btn-add" id="ficheModifier">MODIFIER CETTE SÉANCE</button>';
      hote.innerHTML = html;
      return;
    }

    html += '<div class="fiche-stats" style="grid-template-columns:repeat(2,minmax(0,1fr));">'
      + statTile(exos.length, exos.length > 1 ? 'EXOS' : 'EXO')
      + statTile(compterJour(day), compterJour(day) > 1 ? 'SÉRIES' : 'SÉRIE')
      + statTile(volumeTexte(dayVolume(ds)) || '—', 'VOLUME')
      + statTile(fois + '×', fois > 1 ? 'FOIS CETTE SÉANCE' : 'PREMIÈRE FOIS')
      + '</div>';

    var faite = seanceFaite(ds);
    exos.forEach(function(e){
      var series = seriesRemplies(e);
      var pesees = series.filter(function(s){ return typeof s.poids === 'number' && s.poids > 0; });
      var meilleure = pesees.length ? Math.max.apply(null, pesees.map(function(s){ return s.poids; })) : null;
      var tenues = series.map(function(s){ return TS.dureeSecondes(s.reps); }).filter(function(d){ return d !== null; });
      var clE = classement(e);
      html += '<button type="button" class="fiche-exo" data-exo="' + esc(e.nom || '') + '" style="--exo-color:' + (GROUP_COLORS[clE.groupe] || GROUP_COLORS['Autre']) + '">'
        + '<div class="fiche-exo-nom">' + esc(normalizeName(e.nom) || 'Sans nom') + '<span class="fiche-exo-fleche">›</span></div>'
        + '<div class="fiche-exo-groupe">' + esc(clE.groupe + (clE.sous ? ' · ' + clE.sous : '')) + '</div>'
        + '<div class="fiche-series">'
        + series.map(function(s){
            return '<span class="fiche-serie' + (s.fait ? ' fait' : '') + '">' + esc(perfTexte(s)) + '</span>';
          }).join('')
        + '</div>'
        + notesExo(e).map(function(n){ return '<div class="fiche-exo-note">«\u00a0' + esc(n) + '\u00a0»</div>'; }).join('')
        + (tenues.length
            ? ligneProgressionDuree(e.nom, ds, Math.max.apply(null, tenues))
            : ligneProgression(e.nom, ds, meilleure))
        + '</button>'
        // A cote de la carte, pas dedans : la carte entiere ouvre l'exercice.
        + (faite ? '<button type="button" class="btn-ajout-jour" data-ajout-jour="' + esc(e.id) + '">+ AJOUTER À MA SÉANCE DU JOUR</button>' : '');
    });

    var meme = (ds === state.selectedDay);
    html += '<button type="button" class="btn-add" id="ficheModifier">MODIFIER CETTE SÉANCE</button>';
    html += '<button type="button" class="btn-reprendre" id="ficheSelectionner"' + (meme ? ' disabled' : '') + '>'
      + (meme ? 'C\'EST LA SÉANCE DU JOUR AFFICHÉ' : 'SÉLECTIONNER POUR LE JOUR AFFICHÉ')
      + '</button>';
    hote.innerHTML = html;
  }

  // Le titre s'edite sur place : ouvrir un panneau pour trois mots ferait
  // perdre de vue la seance qu'on est en train de nommer.
  function editerTitreFiche(){
    var ds = state.seanceOuverte;
    var ligne = document.querySelector('.fiche-titre-ligne');
    if (!ds || !ligne || ligne.querySelector('.fiche-titre-champ')) return;
    var champ = document.createElement('input');
    champ.type = 'text';
    champ.className = 'fiche-titre-champ';
    champ.maxLength = 60;
    champ.value = titreChoisi(ds);
    champ.placeholder = titreParDefaut(ds);
    champ.setAttribute('aria-label', 'Titre de la séance');
    ligne.innerHTML = '';
    ligne.appendChild(champ);
    champ.focus();
    champ.select();

    var fini = false;
    function valider(){
      if (fini) return;
      fini = true;
      definirTitre(ds, champ.value);
      renderSeanceDetail();
    }
    champ.addEventListener('blur', valider);
    champ.addEventListener('keydown', function(e){
      if (e.key === 'Enter'){ e.preventDefault(); champ.blur(); }
      if (e.key === 'Escape'){ fini = true; renderSeanceDetail(); }
    });
  }

  function modifierSeance(ds){
    if (!ds) return;
    getOrCreateDay(ds);
    allerAuJour(ds);
  }

  // Un jour s'ouvre la ou l'on note : SÉANCES > DU JOUR.
  function allerAuJour(ds){
    state.selectedDay = ds;
    seancesOnglet = 'jour';
    montrerVue('seances');
    renderSeanceJour(true);
    window.scrollTo(0, 0);
  }

  function renderDayPanel(force){
    var panel = document.querySelector('.day-panel');
    var ae = document.activeElement;
    if (!force && panel.contains(ae) && (ae.tagName==='INPUT' || ae.tagName==='SELECT')) return;

    var ds = state.selectedDay;
    var d = fromDateStr(ds);
    document.getElementById('dayTitle').textContent = DAY_NAMES[(d.getDay()+6)%7]+' '+d.getDate()+' '+MONTH_NAMES[d.getMonth()];
    document.getElementById('jourAuj').hidden = ds === toDateStr(new Date());

    var list = document.getElementById('exList');
    if (state.loading){
      list.innerHTML = '<div class="empty-state">' + attente() + '</div>';
      return;
    }
    var day = state.sessions[ds];
    var exercises = day ? day.exercises : [];
    var y = window.scrollY;
    lacherFocus(list);
    if (!exercises.length){
      list.innerHTML = '<div class="empty-state">Aucun exercice noté pour ce jour.<br>Ajoute ta première série ci-dessous.</div>' + refaireHTML(ds);
    } else {
      list.innerHTML = exercisesHTML(exercises);
    }
    garderDefilement(y);
    majBoutonFin(ds);
    majSuggestions();
  }

  // « Terminer ma séance » n'a de sens qu'une fois quelque chose de noté, et
  // la validation ne s'affiche qu'une fois donnée : un bouton qui ne sert à
  // rien tous les autres jours, c'est un bouton qu'on n'appuie plus.
  function majBoutonFin(ds){
    var zone = document.getElementById('finZone');
    if (!zone) return;
    var day = state.sessions[ds];
    var noté = day && compterJour(day) > 0;
    if (!noté){ zone.hidden = true; zone.innerHTML = ''; return; }
    zone.hidden = false;
    if (estTerminee(ds)){
      var h = fromISO(day.termine);
      zone.innerHTML = '<div class="fin-faite"><span class="fin-faite-tag">SÉANCE VALIDÉE</span>'
        + (h ? '<span class="fin-faite-heure">' + esc(h) + '</span>' : '')
        + '<button type="button" class="fin-revoir" id="finRevoir">REVOIR LE BILAN ›</button></div>';
    } else {
      zone.innerHTML = '<button type="button" class="btn-fin" id="finBtn">✓ TERMINER MA SÉANCE</button>';
    }
  }
  function fromISO(iso){
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return 'à ' + d.getHours() + 'h' + String(d.getMinutes()).padStart(2, '0');
  }

  // La seance du jour : le bandeau, puis le carnet du jour choisi.
  function renderSeanceJour(force){
    renderBandeau();
    renderDayPanel(force);
    majRetour();
  }

  // ---------- le planning : un calendrier ----------
  // JOUR, SEMAINE ou MOIS autour d'une date de reference. On y regarde, on
  // n'y note pas : toucher un jour l'ouvre dans SÉANCES > DU JOUR. Un jour
  // « fait » a des series remplies ; « prevu » a des exercices ou un titre,
  // sans series.
  var calVue = 'semaine';
  var calRef = toDateStr(new Date());
  function etatJour(ds){
    var day = state.sessions[ds];
    if (!day) return '';
    if (compterJour(day) > 0) return 'faite';
    return ((day.exercises || []).length || titreChoisi(ds)) ? 'prevue' : '';
  }
  function couleurJour(ds){ return GROUP_COLORS[groupesPrincipaux(ds)[0]] || GROUP_COLORS['Autre']; }
  function exosDuJour(ds){
    var etat = etatJour(ds);
    return ((state.sessions[ds] && state.sessions[ds].exercises) || []).filter(function(e){
      return etat === 'faite' ? seriesRemplies(e).length : true;
    });
  }
  function etatTexte(ds, long){
    var etat = etatJour(ds);
    if (etat === 'faite') return (estTerminee(ds) ? '✓ ' + (long ? 'SÉANCE VALIDÉE' : 'VALIDÉE') : '✓ ' + (long ? 'SÉANCE FAITE' : 'FAITE'));
    if (etat === 'prevue') return long ? 'SÉANCE PRÉVUE' : 'PRÉVUE';
    return long ? 'RIEN CE JOUR-LÀ' : '';
  }
  function decalerCalendrier(sens){
    var d = fromDateStr(calRef);
    if (calVue === 'jour') d = addDays(d, sens);
    else if (calVue === 'semaine') d = addDays(d, 7 * sens);
    else d = new Date(d.getFullYear(), d.getMonth() + sens, 1);
    calRef = toDateStr(d);
    renderCalendrier();
  }
  function renderCalendrier(){
    document.querySelectorAll('#calVues .seg-btn').forEach(function(b){
      b.classList.toggle('active', b.dataset.cal === calVue);
    });
    var ref = fromDateStr(calRef), maintenant = new Date(), auj = toDateStr(maintenant);
    var label = document.getElementById('calLabel');
    var corps = document.getElementById('calCorps');
    var loin;
    if (calVue === 'jour'){
      label.textContent = majuscule(DAY_NAMES[(ref.getDay()+6)%7].toLowerCase()) + ' ' + ref.getDate() + ' ' + MONTH_ABBR[ref.getMonth()];
      loin = calRef !== auj;
      corps.innerHTML = calJourHTML(calRef);
    } else if (calVue === 'semaine'){
      var debut = startOfWeek(ref);
      // L'annee en cours ne prend plus la place de la semaine sur un petit ecran.
      var finSem = addDays(debut, 6), an = maintenant.getFullYear();
      label.textContent = formatWeekRange(debut, finSem);
      if (debut.getFullYear() === an && finSem.getFullYear() === an) label.textContent = label.textContent.replace(/ \d{4}$/, '');
      loin = toDateStr(debut) !== toDateStr(startOfWeek(maintenant));
      corps.innerHTML = calSemaineHTML(debut);
    } else {
      label.textContent = majuscule(MONTH_NAMES[ref.getMonth()]) + ' ' + ref.getFullYear();
      loin = ref.getMonth() !== maintenant.getMonth() || ref.getFullYear() !== maintenant.getFullYear();
      corps.innerHTML = calMoisHTML(ref.getFullYear(), ref.getMonth());
    }
    document.getElementById('calAuj').classList.toggle('loin', loin);
  }
  function calSemaineHTML(debut){
    var auj = toDateStr(new Date()), html = '';
    for (var i = 0; i < 7; i++){
      var d = addDays(debut, i), ds = toDateStr(d), etat = etatJour(ds);
      var sous = '';
      if (etat){
        var n = exosDuJour(ds).length, s = compterJour(state.sessions[ds]);
        sous = n + (n > 1 ? ' exos' : ' exo') + (etat === 'faite' ? ' · ' + s + (s > 1 ? ' séries' : ' série') : '');
      }
      html += '<button type="button" class="cal-ligne ' + (etat || 'vide') + (ds === auj ? ' auj' : '') + '" data-cal-jour="' + ds + '"'
        + (etat ? ' style="--c:' + couleurJour(ds) + '"' : '') + '>'
        + '<span class="cal-date"><span class="cal-jour">' + DAY_ABBR[i] + '</span><span class="cal-num">' + d.getDate() + '</span></span>'
        + '<span class="cal-info"><span class="cal-titre">' + esc(etat ? titreSeance(ds) : (ds >= auj ? 'Rien de prévu' : 'Rien de noté')) + '</span>'
        +   (sous ? '<span class="cal-sous">' + esc(sous) + '</span>' : '') + '</span>'
        + '<span class="cal-etat">' + etatTexte(ds, false) + '</span>'
        + '</button>';
    }
    // Les groupes travailles dans la semaine, comme sous les anciennes pastilles.
    var counts = groupCountsIn(toDateStr(debut), toDateStr(addDays(debut, 6)));
    var badges = GROUPS.filter(function(g){ return counts[g]; }).map(function(g){
      return '<span class="badge" style="--dot:' + GROUP_COLORS[g] + '"><i></i>' + g + ' ×' + counts[g] + '</span>';
    }).join('');
    return html + (badges ? '<div class="badges-row">' + badges + '</div>' : '');
  }
  function calMoisHTML(annee, mois){
    var auj = toDateStr(new Date());
    var dernier = toDateStr(new Date(annee, mois + 1, 0));
    var d = startOfWeek(new Date(annee, mois, 1));
    var html = '<div class="cal-mois">' + DAY_ABBR.map(function(a){ return '<span class="cal-entete">' + a + '</span>'; }).join('');
    var faites = 0, prevues = 0;
    // Des semaines entieres, du lundi au dimanche, jusqu'a couvrir le mois.
    for (var i = 0; i < 42; i++, d = addDays(d, 1)){
      var ds = toDateStr(d);
      if (i % 7 === 0 && ds > dernier) break;
      var etat = etatJour(ds), dedans = d.getMonth() === mois;
      if (dedans && etat === 'faite') faites++;
      if (dedans && etat === 'prevue') prevues++;
      var aria = DAY_NAMES[(d.getDay()+6)%7] + ' ' + d.getDate() + ' ' + MONTH_NAMES[d.getMonth()]
        + (etat === 'faite' ? ', séance faite' : (etat === 'prevue' ? ', séance prévue' : ''));
      html += '<button type="button" class="cal-case' + (etat ? ' ' + etat : '') + (dedans ? '' : ' dehors') + (ds === auj ? ' auj' : '') + '"'
        + ' data-cal-jour="' + ds + '"' + (etat ? ' style="--c:' + couleurJour(ds) + '"' : '') + ' aria-label="' + esc(aria) + '">'
        + '<span class="cal-num">' + d.getDate() + '</span>' + (etat ? '<i></i>' : '') + '</button>';
    }
    var resume = faites + (faites > 1 ? ' séances faites' : ' séance faite')
      + (prevues ? ' · ' + prevues + (prevues > 1 ? ' prévues' : ' prévue') : '');
    return html + '</div><p class="cal-resume">' + resume + '</p>'
      + '<div class="cal-legende"><span class="faite"><i></i>faite</span><span class="prevue"><i></i>prévue</span></div>';
  }
  function calJourHTML(ds){
    var etat = etatJour(ds);
    var html = '<div class="cal-fiche' + (etat ? ' ' + etat : '') + '"' + (etat ? ' style="--c:' + couleurJour(ds) + '"' : '') + '>'
      + '<span class="cal-fiche-etat">' + etatTexte(ds, true) + '</span>';
    if (etat){
      html += '<h2 class="cal-fiche-titre">' + esc(titreSeance(ds)) + '</h2><ul class="cal-exos">'
        + exosDuJour(ds).map(function(e){
            var remplies = seriesRemplies(e);
            var top = remplies.length ? TS.calculerTopSet(remplies) : null;
            var detail = remplies.length
              ? remplies.length + (remplies.length > 1 ? ' séries' : ' série') + (top ? ' · ' + perfTexte(top) : '')
              : 'à faire';
            return '<li><b>' + esc(nomCanonique(e.nom) || e.nom || 'Sans nom') + '</b><span>' + esc(detail) + '</span></li>';
          }).join('')
        + '</ul>';
    } else {
      html += '<p class="cal-vide">Aucune séance notée ni prévue.</p>';
    }
    return html + '</div>'
      + '<button type="button" class="btn-add" data-cal-jour="' + ds + '">' + (etat ? 'VOIR LA SÉANCE' : 'NOTER UNE SÉANCE CE JOUR-LÀ') + '</button>';
  }

  function renderRecap(){
    var data = computeRecap(state.recapPeriod);
    document.getElementById('recapLabel').textContent = data.label.toUpperCase();

    var volEl = document.getElementById('recapVolume');
    var muscleEl = document.getElementById('recapMuscle');
    var groupsEl = document.getElementById('recapGroups');

    if (state.loading){
      volEl.innerHTML = '';
      muscleEl.innerHTML = '';
      document.getElementById('recapStats').innerHTML = '';
      document.getElementById('recapHeatmap').innerHTML = '';
      groupsEl.innerHTML = '<div class="empty-state">' + attente() + '</div>';
      return;
    }

    var vol = formatVolume(data.totalVolume);
    volEl.innerHTML = '<div class="volume-block"><div class="volume-tex"></div><div class="volume-inner">'
      + '<div style="display:flex;flex-direction:column;gap:3px;">'
      +   '<span class="volume-label">VOLUME LEVÉ</span>'
      +   '<div style="display:flex;align-items:baseline;gap:5px;"><span class="volume-num">'+vol.num+'</span><span class="volume-unit">'+vol.unit+'</span></div>'
      + '</div>'
      + '</div></div>';

    document.getElementById('recapStats').innerHTML =
      statTile(data.totalSeries,'Séries') + statTile(data.seances,'Séances') + statTile(data.mouvements,'Mouvements');
    document.getElementById('recapHeatmap').innerHTML = renderHeatmap(data.startStr, data.endStr);

    var counts = groupCountsIn(data.startStr, data.endStr);
    var sousC = sousCountsIn(data.startStr, data.endStr);
    var worked = GROUPS.filter(function(g){ return counts[g]; });
    var idle = GROUPS.filter(function(g){ return !counts[g] && g !== 'Autre' && g !== 'Cardio'; });
    // Sous chaque groupe, le detail de ses muscles.
    var legend = worked.map(function(g){
      var detail = (SOUS_GROUPES[g] || []).filter(function(s){ return sousC[s]; }).map(function(s){
        return '<span>' + s + ' <b>' + sousC[s] + '</b></span>';
      });
      if (sousC[g] && detail.length) detail.push('<span>sans précision <b>' + sousC[g] + '</b></span>');
      return '<div class="muscle-row"><span class="muscle-sw" style="background:'+GROUP_COLORS[g]+'"></span>'
        + '<span class="muscle-name">'+g+'</span><span class="muscle-val">'+counts[g]+'</span></div>'
        + (detail.length ? '<div class="muscle-sous">' + detail.join('') + '</div>' : '');
    }).join('');
    if (!worked.length) legend = '<div class="muscle-name" style="color:var(--dim)">Rien sur cette période.</div>';
    var pasTouche = idle.map(function(g){ return g.toLowerCase(); });
    var note = pasTouche.length && worked.length
      ? '<div class="muscle-note">Pas touché : '+pasTouche.join(', ')+'.</div>'
      : '';
    muscleEl.innerHTML = '<div class="muscle-panel">'
      + '<div class="muscle-title">CE QUE TU AS TRAVAILLÉ</div>'
      + '<div class="muscle-body">'+muscleMapSVG(sousC)+'<div class="muscle-legend">'+legend+note+'</div></div>'
      + '</div>';

    if (!data.items.length){
      groupsEl.innerHTML = '<div class="empty-state">Aucune donnée pour cette période.</div>';
      return;
    }
    var byGroup = {};
    data.items.forEach(function(it){
      if (!byGroup[it.groupe]) byGroup[it.groupe]=[];
      byGroup[it.groupe].push(it);
    });
    var html = '';
    GROUPS.forEach(function(g){
      if (!byGroup[g]) return;
      html += '<div class="recap-section" style="--sect-color:'+GROUP_COLORS[g]+'">'
        + '<div class="recap-section-title">'+g+'</div>'
        + '<div class="recap-rows">'
        + byGroup[g].map(function(it){
            var valueTxt = it.maxDuree !== null
              ? TS.formatDuree(it.maxDuree)
              : (it.bodyweight ? 'PDC' : formatWeight(it.maxPoids)+' kg') + ' × ' + it.repsAtMax;
            var freq = (it.sous ? it.sous + ' · ' : '') + it.fois + (it.fois > 1 ? ' séances' : ' séance') + ' · ' +
                       it.series + (it.series > 1 ? ' séries' : ' série');
            return '<button type="button" class="recap-row" data-recap-name="'+esc(it.nom)+'">'
              +   '<span class="recap-name"><span class="chev" aria-hidden="true">›</span>'+esc(it.nom)
              +     '<span class="recap-freq">'+esc(freq)+'</span></span>'
              +   '<span class="recap-value">'+esc(valueTxt)+'</span>'
              + '</button>';
          }).join('')
        + '</div></div>';
    });
    groupsEl.innerHTML = html;
  }

  // ---------- fiche d'un exercice : progression, records, historique ----------
  var PERIODES = [
    { cle:'1m',   label:'1M',   jours:31 },
    { cle:'3m',   label:'3M',   jours:92 },
    { cle:'6m',   label:'6M',   jours:183 },
    { cle:'1a',   label:'1A',   jours:366 },
    { cle:'tout', label:'TOUT', jours:null }
  ];

  function periodeCourante(){
    for (var i = 0; i < PERIODES.length; i++){
      if (PERIODES[i].cle === state.exoPeriode) return PERIODES[i];
    }
    return PERIODES[PERIODES.length - 1];
  }

  function seancesFiltrees(seances){
    var p = periodeCourante();
    if (!p.jours) return seances;
    var limite = toDateStr(addDays(new Date(), -p.jours));
    return seances.filter(function(j){ return j.date >= limite; });
  }

  var SIGNAUX = {
    progressing:  { mot:'EN PROGRESSION', classe:'sig-vert' },
    stable:       { mot:'STABLE',         classe:'sig-orange' },
    stagnating:   { mot:'STAGNATION',     classe:'sig-orange' },
    declining:    { mot:'EN BAISSE',      classe:'sig-rouge' },
    insufficient_data: { mot:'PAS ASSEZ DE DONNÉES', classe:'sig-gris' }
  };

  function ouvrirExercice(nom, retour){
    state.exoOuvert = nom;
    state.exoRetour = retour || 'recap';
    montrerVue('exercice');
    window.scrollTo(0, 0);
  }

  function renderExerciceDetail(){
    var hote = document.getElementById('exoDetail');
    var nom = state.exoOuvert;
    if (!nom){ hote.innerHTML = ''; return; }

    var toutes = seancesDeLExo(nom);
    var affiche = nomCanonique(nom) || nom;
    var clX = classement({ nom:nom, groupe:groupeCanonique(nom) || 'Autre' });
    var groupe = clX.groupe;
    var couleur = GROUP_COLORS[groupe] || GROUP_COLORS['Autre'];

    var html = '<div class="exo-tete" style="--card-color:' + couleur + '">'
      + '<div class="exo-nom">' + esc(affiche) + '</div>'
      + '<div class="exo-groupe">' + esc(groupe + (clX.sous ? ' · ' + clX.sous : '')) + '</div>'
      + '</div>';

    if (!toutes.length){
      hote.innerHTML = html + '<div class="seances-vide">Aucune série notée sur cet exercice.</div>';
      return;
    }

    // Au temps des que l'historique en contient : une planche se suit en
    // secondes, et son 1RM n'existe pas.
    var auTemps = toutes.some(function(j){ return j.series.some(TS.serieAuTemps); });

    // --- signal, sur tout l'historique : une fenetre courte inventerait des
    // tendances a partir de deux points.
    var sig = TS.detecterSignal(toutes, auTemps ? 'temps' : undefined);
    var vue = SIGNAUX[sig.signal] || SIGNAUX.insufficient_data;
    html += '<div class="exo-signal ' + vue.classe + '">'
      + '<div class="exo-signal-tete"><span class="sig-point" aria-hidden="true"></span>' + vue.mot + '</div>'
      + '<div class="exo-signal-raison">' + esc(sig.raison) + '</div>'
      + '</div>';

    // --- chiffres cles, sur tout l'historique
    var derniere = toutes[toutes.length - 1];
    var top = TS.calculerTopSet(derniere.series);
    var rm = TS.epleySerie(top);
    var meilleur = TS.meilleurPoids(toutes);
    var volume = toutes.reduce(function(t, j){ return t + TS.volumeTotal(j.series); }, 0);
    var reps = 0;
    toutes.forEach(function(j){
      j.series.forEach(function(s){
        if (TS.typeSerie(s) === TS.TYPES.ECHAUFFEMENT) return;
        var r = TS.nombreReps(s.reps);
        if (r !== null && r > reps) reps = r;
      });
    });

    if (auTemps){
      var nbSeries = toutes.reduce(function(t, j){ return t + j.series.length; }, 0);
      var tenu = TS.meilleureDuree(toutes);
      html += '<div class="exo-stats">'
        + statTile(top ? esc(perfTexte(top)) : '—', 'Dernière séance')
        + statTile(tenu === null ? '—' : esc(TS.formatDuree(tenu)), 'Meilleur temps')
        + statTile(toutes.length, toutes.length > 1 ? 'Séances' : 'Séance')
        + statTile(nbSeries, nbSeries > 1 ? 'Séries' : 'Série')
        + statTile(esc(TS.formatDuree(TS.dureeTotale(toutes)) || '—'), 'Temps total tenu')
        + '</div>';
    } else {
    html += '<div class="exo-stats">'
      + statTile(top ? esc(perfTexte(top)) : '—', 'Top set')
      + statTile(rm === null ? '—' : formatWeight(Math.round(rm * 2) / 2) + ' kg', '1RM estimé')
      + statTile(meilleur === null ? '—' : formatWeight(meilleur) + ' kg', 'Meilleur poids')
      + statTile(reps || '—', 'Meilleures reps')
      + statTile(volumeTexte(volume) || '—', 'Volume total')
      + '</div>';
    }

    // --- courbe
    html += '<div class="exo-bloc">'
      + '<div class="exo-bloc-titre">' + (auTemps ? 'MEILLEUR TEMPS, SÉANCE APRÈS SÉANCE' : 'TOP SET AU FIL DU TEMPS') + '</div>'
      + '<div class="exo-periodes">'
      + PERIODES.map(function(p){
          return '<button type="button" class="exo-periode' + (p.cle === state.exoPeriode ? ' actif' : '') + '"'
            + ' data-periode="' + p.cle + '">' + p.label + '</button>';
        }).join('')
      + '</div>'
      + '<div class="exo-chart" id="exoChart"><div class="recap-chart-empty">' + attente('Chargement du graphique…') + '</div></div>'
      + '</div>';

    // --- records par fourchette de reps
    var records = auTemps ? [] : TS.recordsParReps(toutes);
    if (records.length){
      html += '<div class="exo-bloc">'
        + '<div class="exo-bloc-titre">RECORDS PERSONNELS</div>'
        + '<div class="exo-records">'
        + records.map(function(r){
            return '<div class="exo-record">'
              + '<span class="exo-record-reps">' + r.reps + (r.reps > 1 ? ' reps' : ' rep') + '</span>'
              + '<span class="exo-record-poids">' + formatWeight(r.poids) + ' kg</span>'
              + '</div>';
          }).join('')
        + '</div>'
        + '<div class="exo-note">Le poids le plus lourd soulevé pour au moins ce nombre de répétitions.</div>'
        + '</div>';
    }

    // --- historique, du plus recent au plus ancien
    html += '<div class="exo-bloc">'
      + '<div class="exo-bloc-titre">HISTORIQUE</div>'
      + toutes.slice().reverse().map(function(j){
          var d = fromDateStr(j.date);
          var quand = d.getDate() + ' ' + MONTH_ABBR[d.getMonth()];
          var jTop = TS.calculerTopSet(j.series);
          return '<button type="button" class="exo-jour" data-jour="' + esc(j.date) + '">'
            + '<span class="exo-jour-date">' + esc(quand) + '</span>'
            + '<span class="exo-jour-series">'
            + j.series.map(function(s){
                var estTop = jTop && s === jTop;
                return '<span class="exo-jour-serie' + (estTop ? ' top' : '') + '">' + esc(perfTexte(s)) + '</span>';
              }).join('')
            + (j.note ? '<span class="exo-jour-note">«\u00a0' + esc(j.note) + '\u00a0»</span>' : '')
            + '</span>'
            + '<span class="exo-jour-fleche">›</span>'
            + '</button>';
        }).join('')
      + '</div>';

    hote.innerHTML = html;

    var points = seancesFiltrees(toutes);
    var zone = document.getElementById('exoChart');
    loadChartLib().then(function(){ dessinerCourbeExo(zone, points, auTemps); }).catch(function(){
      zone.innerHTML = '<div class="recap-chart-empty">Graphique indisponible hors-ligne.</div>';
    });
  }

  var courbeExo = null;
  function dessinerCourbeExo(zone, seances, auTemps){
    if (courbeExo){ courbeExo.destroy(); courbeExo = null; }
    var pts = auTemps ? TS.pointsDuree(seances) : TS.pointsTopSet(seances);
    if (pts.length < 2){
      zone.innerHTML = '<div class="recap-chart-empty">Pas encore assez de séances sur cette période pour tracer une courbe.</div>';
      return;
    }
    zone.innerHTML = '<div class="chart-box"><canvas role="img" aria-label="' + (auTemps ? 'Meilleur temps tenu, ' : '1RM estimé du top set, ') + esc(state.exoOuvert) + '"></canvas></div>';
    var labels = pts.map(function(p){ var d = fromDateStr(p.date); return d.getDate() + ' ' + MONTH_ABBR[d.getMonth()]; });
    courbeExo = new Chart(zone.querySelector('canvas'), {
      type:'line',
      data:{ labels:labels, datasets:[{
        data: pts.map(function(p){ return p.valeur; }),
        borderColor:'#ff5c38',
        backgroundColor:'rgba(255,92,56,.14)',
        pointBackgroundColor:'#ffd23f',
        pointBorderColor:'#0d0c0a',
        pointBorderWidth:2, pointRadius:4, pointHitRadius:16,
        borderWidth:2.5, tension:0, fill:true
      }] },
      options:{
        responsive:true, maintainAspectRatio:false,
        interaction:{ mode:'index', intersect:false },
        plugins:{ legend:{display:false}, tooltip:{ callbacks:{
          label:function(ctx){
            var p = pts[ctx.dataIndex];
            var t = p.topSet ? perfTexte(p.topSet) : '';
            if (auTemps) return TS.formatDuree(p.valeur);
            return formatWeight(p.valeur) + ' kg estimés' + (t ? ' — ' + t : '');
          }
        } } },
        scales:{
          x:{ grid:{display:false}, ticks:{ color:'#a39b8f', font:{size:11,weight:'700'}, maxTicksLimit:6, maxRotation:0 } },
          y:{ grid:{color:'#35312b'}, ticks:{ color:'#a39b8f', font:{size:11,weight:'700'}, maxTicksLimit:5,
              callback:function(v){ return auTemps ? TS.formatDuree(v) : formatWeight(v) + ' kg'; } } }
        }
      }
    });
  }

  // ---------- graphique de progression (chargé à la demande) ----------
  var chartLibPromise = null;
  function loadChartLib(){
    if (window.Chart) return Promise.resolve();
    if (chartLibPromise) return chartLibPromise;
    chartLibPromise = new Promise(function(resolve, reject){
      var s = document.createElement('script');
      s.src = 'vendor/chart.umd.js';
      s.onload = function(){ resolve(); };
      s.onerror = function(){ chartLibPromise = null; reject(new Error('chart load failed')); };
      document.head.appendChild(s);
    });
    return chartLibPromise;
  }
  document.getElementById('recapGroups').addEventListener('click', function(e){
    var btn = e.target.closest('.recap-row'); if (!btn) return;
    ouvrirExercice(btn.dataset.recapName, 'recap');
  });

  function renderAll(){
    if (state.view === 'planning') renderCalendrier();
    else if (state.view === 'seances') renderSeances();
    else if (state.view === 'seance') renderSeanceDetail();
    else if (state.view === 'exercice') renderExerciceDetail();
    else if (state.view === 'coach') renderCoach();
    else if (state.view === 'admin') renderAdmin();
    else if (state.view === 'messages') renderMessages();
    // Apprendre est un ecran fixe : rien a recalculer, et surtout pas le recap
    // (qui chargerait Chart.js pour une vue cachee).
    else if (state.view === 'apprendre') return;
    else renderRecap();
  }

  // ---------- event wiring ----------
  // « jour », « mes » ou « histo ». L'onglet survit a un aller-retour dans une fiche :
  // revenir d'une seance passee pour retomber sur la liste des seances a venir
  // donnerait l'impression d'avoir perdu sa place.
  var seancesOnglet = 'jour';

  var VUES = ['planning','seances','seance','exercice','recap','apprendre','coach','admin','messages'];
  function montrerVue(vue){
    state.view = vue;
    // La fiche n'a pas d'onglet : c'est une page ou l'on entre depuis la
    // liste, et l'onglet SEANCES reste allume pendant qu'on y est.
    // La fiche d'un exercice n'a pas d'onglet : on garde allume celui d'ou
    // l'on vient, sinon la barre du haut clignote sans rien dire d'utile.
    var actif = vue;
    if (vue === 'seance') actif = 'seances';
    if (vue === 'exercice') actif = (state.exoRetour === 'seance') ? 'seances' : state.exoRetour;
    document.querySelectorAll('.topbar-tab').forEach(function(b){
      b.classList.toggle('active', b.dataset.view === actif);
    });
    VUES.forEach(function(v){ document.getElementById('view-' + v).hidden = (v !== vue); });
    if (vue !== 'messages'){
      document.body.classList.remove('en-conv');
      clearInterval(minuteurMessages);
      minuteurMessages = null;
    }
    // Un champ de l'ancienne vue ne doit pas garder la barre rangee.
    var champ = document.activeElement;
    if (champ && champ.blur && /^(INPUT|TEXTAREA|SELECT)$/.test(champ.tagName)
        && !document.getElementById('view-' + vue).contains(champ)) champ.blur();
    document.body.classList.remove('clavier');
    renderAll();
    majBoutonHaut();
    majRetour();
    placerLoupe(true);
  }
  // La loupe suit l'onglet actif. Elle ne s'anime que si elle change vraiment
  // de place : au chargement et quand l'ecran change de largeur, elle s'y pose
  // sans bouger. Les vues sans onglet (messages, coach) la cachent.
  var minuteurLoupe = null;
  function placerLoupe(anime){
    var loupe = document.getElementById('ongletLoupe');
    if (!loupe) return;
    var actif = document.querySelector('.topbar-tab.active');
    if (!actif){ loupe.hidden = true; return; }
    // Tenue au doigt : c'est le doigt qui la place, pas un redimensionnement.
    if (loupe.classList.contains('tenue')) return;
    var avant = loupe.hidden ? NaN : parseFloat(loupe.style.getPropertyValue('--x'));
    var x = actif.offsetLeft, w = actif.offsetWidth;
    loupe.hidden = false;
    if (anime && !isNaN(avant) && Math.abs(avant - x) > 1){
      loupe.classList.add('pose');
      loupe.classList.toggle('gauche', x < avant);
      loupe.classList.remove('glisse');
      void loupe.offsetWidth;
      loupe.classList.add('glisse');
      clearTimeout(minuteurLoupe);
      minuteurLoupe = setTimeout(function(){ loupe.classList.remove('glisse'); }, 480);
    } else {
      loupe.classList.remove('pose', 'glisse');
    }
    loupe.style.setProperty('--x', x + 'px');
    loupe.style.width = w + 'px';
    loupe.style.setProperty('--w', w + 'px');
    loupe.style.setProperty('--h', actif.offsetHeight + 'px');
    loupe.style.setProperty('--barre-w', loupe.parentNode.clientWidth + 'px');
    marquerCopies(actif.dataset.view);
    suivreBulle(anime ? 520 : 0);
  }
  // Les copies des onglets que la bulle grossit (voir « La barre du bas, facon
  // iOS » dans index.html) suivent l'onglet actif, ou celui qu'on survole.
  function marquerCopies(vue){
    var loupe = document.getElementById('ongletLoupe');
    if (!loupe) return;
    loupe.querySelectorAll('.bulle-onglet').forEach(function(c){ c.classList.toggle('active', c.dataset.view === vue); });
  }
  // La copie doit rester alignee sur la vraie barre : elle se decale de la
  // position ou la bulle est vraiment dessinee. Pendant le trajet de 0,46 s,
  // on relit cette position a chaque image ; sinon la bulle montrerait deja
  // l'onglet d'arrivee pendant tout le trajet.
  function poserCopies(loupe, x){
    var w = loupe.offsetWidth;
    loupe.querySelectorAll('.bulle-vue').forEach(function(v){
      v.style.left = (v.parentNode.classList.contains('bulle-ancre') ? -(x + w / 2) : -x) + 'px';
    });
  }
  var boucleBulle = 0;
  function suivreBulle(duree){
    var loupe = document.getElementById('ongletLoupe');
    if (!loupe) return;
    var fin = performance.now() + duree;
    cancelAnimationFrame(boucleBulle);
    (function image(){
      poserCopies(loupe, parseFloat(getComputedStyle(loupe).translate) || 0);
      if (performance.now() < fin) boucleBulle = requestAnimationFrame(image);
    })();
  }
  window.addEventListener('resize', function(){ placerLoupe(false); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ placerLoupe(false); });
  // La loupe se fait aussi glisser du doigt, comme la barre d'onglets d'iOS :
  // passe 8 px de deplacement horizontal, elle suit le doigt, et l'onglet le
  // plus proche s'ouvre au lacher. Un simple appui reste un clic normal.
  (function(){
    var barre = document.getElementById('mainTabs');
    var loupe = document.getElementById('ongletLoupe');
    if (!barre || !loupe) return;
    function onglets(){ return barre.querySelectorAll('.topbar-tab'); }
    // La bulle porte sa copie des onglets : une au centre, trois colorees et
    // une blanche pour le bord. Le CSS ne les montre que sur telephone.
    var copie = '';
    onglets().forEach(function(b){ copie += '<span class="bulle-onglet" data-view="' + b.dataset.view + '">' + b.innerHTML + '</span>'; });
    function vue(sorte){ return '<span class="bulle-ancre ' + sorte + '"><span class="bulle-vue">' + copie + '</span></span>'; }
    loupe.innerHTML = '<span class="bulle-coeur"><span class="bulle-vue">' + copie + '</span></span>'
      + '<span class="bulle-bord">' + vue('cyan') + vue('jaune') + vue('magenta') + vue('blanc') + '</span>';
    placerLoupe(false);
    if (!window.PointerEvent) return;
    var doigt = null, tenue = false, sansClic = false, minuteurBulle = null;
    function plusProche(centre){
      var meilleur = null, ecart = Infinity;
      onglets().forEach(function(b){
        var d = Math.abs(b.offsetLeft + b.offsetWidth / 2 - centre);
        if (d < ecart){ ecart = d; meilleur = b; }
      });
      return meilleur;
    }
    barre.addEventListener('pointerdown', function(e){
      if (!e.isPrimary || e.button > 0 || loupe.hidden) return;
      doigt = { id: e.pointerId, x: e.clientX, y: e.clientY };
      tenue = false;
      clearTimeout(minuteurBulle);
      loupe.classList.add('bulle');
    });
    barre.addEventListener('pointermove', function(e){
      if (!doigt || e.pointerId !== doigt.id) return;
      var dx = e.clientX - doigt.x;
      if (!tenue){
        if (Math.abs(dx) < 8) return;
        if (Math.abs(e.clientY - doigt.y) > Math.abs(dx)){ doigt = null; loupe.classList.remove('bulle'); return; }
        tenue = true;
        try { barre.setPointerCapture(e.pointerId); } catch (err) {}
        clearTimeout(minuteurLoupe);
        loupe.classList.remove('pose', 'glisse');
        loupe.classList.add('tenue');
        barre.classList.add('tenu');
      }
      var liste = onglets(), w = loupe.offsetWidth;
      var min = liste[0].offsetLeft, max = liste[liste.length - 1].offsetLeft + liste[liste.length - 1].offsetWidth - w;
      var r = barre.getBoundingClientRect();
      var x = Math.max(min, Math.min(max, e.clientX - r.left - barre.clientLeft - w / 2));
      loupe.style.setProperty('--x', x + 'px');
      loupe.style.setProperty('--reflet', (90 + 240 * (max > min ? (x - min) / (max - min) : 0)) + 'deg');
      var vise = plusProche(x + w / 2);
      liste.forEach(function(b){ b.classList.toggle('vise', b === vise); });
      marquerCopies(vise.dataset.view);
      poserCopies(loupe, x);
      e.preventDefault();
    });
    function lacher(e){
      if (!doigt || e.pointerId !== doigt.id) return;
      var etaitTenue = tenue;
      doigt = null; tenue = false;
      clearTimeout(minuteurBulle);
      // Un simple appui : la bulle retombe, ou le changement d'onglet la reprend.
      if (!etaitTenue){ minuteurBulle = setTimeout(function(){ loupe.classList.remove('bulle'); }, 160); return; }
      loupe.classList.remove('bulle');
      var cible = plusProche(parseFloat(loupe.style.getPropertyValue('--x')) + loupe.offsetWidth / 2);
      loupe.classList.remove('tenue');
      barre.classList.remove('tenu');
      onglets().forEach(function(b){ b.classList.remove('vise'); });
      // Le navigateur peut envoyer un clic juste apres : il ne doit rien rouvrir.
      sansClic = true;
      setTimeout(function(){ sansClic = false; }, 400);
      if (e.type === 'pointerup' && cible && !cible.classList.contains('active')) montrerVue(cible.dataset.view);
      else placerLoupe(true);
    }
    barre.addEventListener('pointerup', lacher);
    barre.addEventListener('pointercancel', lacher);
    barre.addEventListener('click', function(e){
      if (!sansClic) return;
      sansClic = false;
      e.stopImmediatePropagation();
      e.preventDefault();
    }, true);
  })();
  // Sur telephone, la barre d'onglets vit en bas. Quand le clavier sort, elle
  // monterait avec lui et couvrirait la ligne qu'on remplit : elle se range le
  // temps de la saisie. Une case a cocher ou un fichier n'ouvrent pas de clavier.
  function ouvreClavier(el){
    return !!el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && el.type !== 'checkbox' && el.type !== 'file';
  }
  //
  // Elle ne doit JAMAIS rester rangee (retour du 18/09 : « le bandeau
  // disparait et j'ai pas de moyen de le recuperer »). Sur iPhone, un champ
  // peut garder le focus sans clavier a l'ecran (clavier ferme d'un geste,
  // retour depuis une page d'Apprendre), et « clavier » restait colle au body.
  // On ne se fie donc plus seulement au focus : le clavier est la quand la
  // zone visible a reellement retreci, et tout ce qui peut laisser un etat
  // perime (changement de vue, retour sur la page) recalcule la barre.
  var hauteurPleine = window.visualViewport ? window.visualViewport.height : 0;
  function clavierVisible(){
    var vv = window.visualViewport;
    if (!vv) return true;
    return vv.height < hauteurPleine - 120;
  }
  function majClavier(){
    var vv = window.visualViewport;
    if (vv && !ouvreClavier(document.activeElement)) hauteurPleine = vv.height;
    else if (vv && vv.height > hauteurPleine) hauteurPleine = vv.height;
    document.body.classList.toggle('clavier', ouvreClavier(document.activeElement) && clavierVisible());
  }
  document.addEventListener('focusin', function(e){
    if (!ouvreClavier(e.target)) return;
    // Tout de suite, pour que la barre parte avec le clavier qui monte ; puis
    // on verifie qu'il est vraiment sorti.
    document.body.classList.add('clavier');
    setTimeout(majClavier, 700);
  });
  document.addEventListener('focusout', function(){
    setTimeout(majClavier, 80);
  });
  if (window.visualViewport){
    window.visualViewport.addEventListener('resize', function(){ setTimeout(majClavier, 60); });
  }
  // Retour sur la page (depuis Apprendre, ou l'app remise au premier plan) :
  // plus aucun etat de la page precedente ne tient la barre cachee.
  function remettreBarre(){
    var champ = document.activeElement;
    if (ouvreClavier(champ) && !clavierVisible() && champ.blur) champ.blur();
    majClavier();
    if (state.view !== 'messages') document.body.classList.remove('en-conv');
    var ecran = document.getElementById('bilanEcran');
    if (!ecran || ecran.hidden) document.body.classList.remove('en-bilan');
  }
  window.addEventListener('pageshow', remettreBarre);
  document.addEventListener('visibilitychange', function(){ if (!document.hidden) remettreBarre(); });

  // Revenir en haut : des qu'on a descendu d'un ecran, un bouton apparait en
  // bas a droite. C'est la ou les sites le mettent sur telephone, sous le
  // pouce. Le defilement est ecoute en mode passif, et le calcul attend la
  // frame suivante : aucun a-coup pendant qu'on fait defiler.
  var hautBtn = document.getElementById('hautBtn');
  var hautPrevu = false;
  function majBoutonHaut(){
    hautPrevu = false;
    if (!hautBtn) return;
    var loin = window.scrollY > Math.max(420, window.innerHeight * 0.7);
    hautBtn.hidden = !loin;
  }
  window.addEventListener('scroll', function(){
    if (hautPrevu) return;
    hautPrevu = true;
    requestAnimationFrame(majBoutonHaut);
  }, { passive:true });
  hautBtn.addEventListener('click', function(){
    var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top:0, behavior: calme ? 'auto' : 'smooth' });
  });

  document.getElementById('mainTabs').addEventListener('click', function(e){
    var btn = e.target.closest('.topbar-tab'); if (!btn) return;
    montrerVue(btn.dataset.view);
  });

  document.getElementById('seancesTabs').addEventListener('click', function(e){
    var btn = e.target.closest('.seg-btn'); if (!btn) return;
    seancesOnglet = btn.dataset.onglet;
    renderSeances();
    window.scrollTo(0, 0);
  });

  document.getElementById('subTabs').addEventListener('click', function(e){
    var btn = e.target.closest('.seg-btn'); if (!btn) return;
    state.recapPeriod = btn.dataset.period;
    // Portee au recap : « .seg-btn » tout court attrapait aussi les onglets de
    // la vue SEANCES, qui portent les memes classes, et les eteignait au
    // passage.
    document.querySelectorAll('#subTabs .seg-btn').forEach(function(b){ b.classList.toggle('active', b===btn); });
    renderRecap();
  });

  // Le logo ramene a la seance du jour, comme sur tout site (demande du
  // 18/09). C'est un vrai lien vers « / » : sans JavaScript, il recharge
  // simplement l'app, qui s'ouvre deja la.
  document.getElementById('marqueAccueil').addEventListener('click', function(e){
    e.preventDefault();
    if (typeof fermerFeuilles === 'function') fermerFeuilles();
    allerAuJour(toDateStr(new Date()));
  });

  // Sur un autre jour qu'aujourd'hui, la seance du jour propose d'y revenir.
  document.getElementById('jourAuj').addEventListener('click', function(){
    state.selectedDay = toDateStr(new Date());
    renderSeanceJour(true);
    window.scrollTo(0, 0);
  });

  document.getElementById('calVues').addEventListener('click', function(e){
    var b = e.target.closest('[data-cal]'); if (!b) return;
    calVue = b.dataset.cal;
    renderCalendrier();
  });
  document.getElementById('calPrec').addEventListener('click', function(){ decalerCalendrier(-1); });
  document.getElementById('calSuiv').addEventListener('click', function(){ decalerCalendrier(1); });
  document.getElementById('calAuj').addEventListener('click', function(){
    calRef = toDateStr(new Date());
    renderCalendrier();
  });
  document.getElementById('calCorps').addEventListener('click', function(e){
    var b = e.target.closest('[data-cal-jour]'); if (!b) return;
    var ds = b.dataset.calJour;
    // Un jour vide n'a pas de fiche : on l'ouvre la ou l'on note.
    if (etatJour(ds)) ouvrirSeance(ds, 'planning'); else allerAuJour(ds);
  });

  var exListEl = document.getElementById('exList');

  // Un input[type=number] focus capte la molette (comportement natif du navigateur) au lieu
  // de laisser la page défiler — on le désactive : un blur() sur wheel rend le scroll à la page.
  exListEl.addEventListener('wheel', function(e){
    var t = e.target;
    if (t && t.tagName==='INPUT' && t.type==='number' && document.activeElement===t) t.blur();
  }, { passive:true });

  exListEl.addEventListener('input', function(e){
    var t = e.target;
    var field = t.dataset.field;
    if (!field) return;

    if (t.dataset.serieId){
      var day = getOrCreateDay(state.selectedDay);
      var found = findSerie(day, t.dataset.serieId);
      if (!found) return;
      if (field==='poids') found.serie.poids = poidsLu(t.value);
      else if (field==='duree'){
        // Des chiffres seuls : ce sont des secondes. « 1:30 » se lit aussi,
        // pour qui tape au clavier d'un ordinateur. Une saisie a moitie
        // tapee (« 1: ») ne remplace pas la derniere valeur lisible.
        var v = String(t.value || '').trim();
        var sec = /^\d+$/.test(v) ? Number(v) : TS.dureeSecondes(v);
        if (v === '' || sec === 0) found.serie.reps = '';
        else if (sec) found.serie.reps = TS.ecrireDuree(sec);
      }
      else if (field==='minutes'){
        var mn = minutesLues(t.value);
        if (mn === 0) found.serie.reps = '';
        else if (mn) found.serie.reps = TS.ecrireDuree(mn);
      }
      else if (field==='vitesse' || field==='inclinaison'){
        // « 10, » en cours de frappe se lit 10 ; vide ou hors bornes, rien.
        var nb = field === 'vitesse' ? vitesseSure(t.value) : inclinaisonSure(t.value);
        if (nb === undefined) delete found.serie[field]; else found.serie[field] = nb;
      }
      else if (field==='rpe'){
        found.serie.rpe = t.value==='' ? null : Number(t.value);
        t.classList.toggle('vide', found.serie.rpe==null);
        t.title = t.dataset.mode === 'temps'
          ? (found.serie.rpe==null ? 'Difficulté ressentie, de 1 à 10' : diffLabel(found.serie.rpe))
          : (found.serie.rpe==null
              ? "Reps en réserve : 10 = à l'échec, 9 = 1 rep en réserve"
              : rpeLabel(found.serie.rpe));
        // La cellule n'a la place que du chiffre, et une infobulle ne
        // s'affiche pas sur un telephone : la phrase passe un instant.
        if (found.serie.rpe != null) showToast(t.dataset.mode === 'temps' ? diffLabel(found.serie.rpe) : rpeLabel(found.serie.rpe));
      }
      else found.serie[field] = t.value;
      // Un commentaire efface ne laisse pas de champ vide derriere lui.
      if (field === 'note'){
        if (!t.value.trim()) delete found.serie.note;
        var outil = t.closest('.serie-card') && t.closest('.serie-card').querySelector('[data-action="note-serie"]');
        if (outil) outil.classList.toggle('actif', !!found.serie.note);
      }

      // L'étoile de record suit la saisie sans reconstruire le panneau, qui
      // ferait perdre le focus. Ce bloc visait « .serie-row », un sélecteur
      // qui n'existe plus depuis que les séries sont des « .serie-card » :
      // l'étoile ne bougeait donc jamais pendant la frappe.
      if (field === 'poids' || field === 'reps' || field === 'duree' || field === 'minutes'){
        majEtoilesRecord(t.closest('.ex-card'));
      }

      scheduleSave(state.selectedDay);
      renderBandeau();
      return;
    }

    var id = t.dataset.id;
    if (!id) return;
    var day2 = getOrCreateDay(state.selectedDay);
    var ex = findExercise(day2, id);
    if (!ex) return;

    ex[field] = t.value;

    if (field==='nom'){
      var match = findExerciseMatch(t.value);
      var card = t.closest('.ex-card');
      if (match && match!==ex.groupe){
        ex.groupe = match;
      }
      majPastilleGroupe(card, ex.groupe, ex);
      // Le bloc « dernière fois » ne se recalculait qu'au rendu complet —
      // jamais pendant la saisie du nom, qui est justement le moment où il
      // devient utile. Mis à jour ici, sans reconstruire la carte.
      majBlocPrecedent(card, ex);
      repeindreSeries(card, ex);
      // Une abreviation connue se propose pendant la frappe : attendre de
      // quitter le champ, c'est deja trop tard, on est passe a la suite.
      var pourSyn = synonymeDe(t.value);
      var boite = card && card.querySelector('.alias-prompt');
      if (pourSyn && (!boite || boite.dataset.pour !== cleExo(t.value))) proposerRattachement(card, ex);
      else if (!pourSyn && boite && boite.dataset.syn === '1') boite.remove();
    }
    scheduleSave(state.selectedDay);
    renderBandeau();
  });

  exListEl.addEventListener('change', function(e){
    var t = e.target;
    // En quittant le champ, on reaffiche ce qui a ete retenu : « 1:30 »
    // tape au clavier devient 90, ce que montrent les boutons de pas.
    if (t.classList.contains('serie-duree')){
      var fd = findSerie(getOrCreateDay(state.selectedDay), t.dataset.serieId);
      if (fd) t.value = secondesAffichees(fd.serie);
      return;
    }
    if (t.classList.contains('serie-type')){
      var jour = getOrCreateDay(state.selectedDay);
      var trouve = findSerie(jour, t.dataset.serieId);
      if (!trouve) return;
      if (t.value) trouve.serie.type = t.value; else delete trouve.serie.type;
      // On repeint la carte sur place plutot que de refaire le panneau :
      // renderDayPanel refuse de se rejouer tant qu'un champ a le focus, et
      // le select l'a encore a cet instant.
      var carte = t.closest('.serie-card');
      if (carte){
        if (t.value) carte.dataset.type = t.value; else delete carte.dataset.type;
        var etiquette = carte.querySelector('.serie-num-txt');
        var lignes = Array.prototype.slice.call(carte.parentNode.querySelectorAll('.serie-card'));
        if (etiquette) etiquette.textContent = TYPE_COURT[t.value] || String(lignes.indexOf(carte) + 1);
      }
      scheduleSave(state.selectedDay, true);
      majEtoilesRecord(t.closest('.ex-card'));
      return;
    }
    if (!t.classList.contains('ex-groupe')) return;
    var id = t.dataset.id;
    var day = getOrCreateDay(state.selectedDay);
    var ex = null;
    for (var i=0;i<day.exercises.length;i++){ if (day.exercises[i].id===id){ ex=day.exercises[i]; break; } }
    if (!ex) return;
    var choix = String(t.value).split('|');
    ex.groupe = groupeSur(choix[0]);
    if (ex.nom && String(ex.nom).trim().length >= 2){
      choisirMuscle(ex.nom, ex.groupe, choix[1] || '');
      populateDatalist();
    }
    majPastilleGroupe(t.closest('.ex-card'), ex.groupe, ex);
    scheduleSave(state.selectedDay,true);
    renderBandeau();
  });

  // Recopier une performance : action volontairement discrete, jamais
  // confondable avec la validation d'une serie.
  exListEl.addEventListener('click', function(e){
    var btn = e.target.closest('[data-copier]');
    if (!btn) return;
    var brut = btn.dataset.poids;
    var poids = brut === '' ? null : Number(brut);
    if (poids !== null && isNaN(poids)) poids = null;
    var serie = copierPerf(btn.dataset.copier, poids, btn.dataset.reps || '', btn.dataset.type || '');
    if (!serie) return;
    scheduleSave(state.selectedDay, true);
    renderDayPanel(true);
    renderBandeau();
    showToast('Série remplie — à toi de valider');
    requestAnimationFrame(function(){
      var el = exListEl.querySelector('.serie-poids[data-serie-id="' + serie.id + '"]');
      if (el) el.focus();
    });
    e.stopPropagation();
  });

  // Revoir la seance d'avant. On y va pour de vrai — le planning de ce
  // jour-la, avec ses commentaires —, et une barre en bas ramene a la seance
  // en cours, sur l'exercice d'ou l'on est parti.
  var retourSeance = null;
  var retourBtn = document.getElementById('retourSeance');
  function majRetour(){
    if (!retourBtn) return;
    if (retourSeance && state.selectedDay === retourSeance.ds) retourSeance = null;
    var montrer = !!retourSeance && state.view === 'seances' && seancesOnglet === 'jour';
    retourBtn.hidden = !montrer;
    document.body.classList.toggle('avec-retour', montrer);
    if (!montrer) return;
    var d = fromDateStr(retourSeance.ds);
    retourBtn.querySelector('.retour-quand').textContent =
      DAY_NAMES[(d.getDay()+6)%7].slice(0, 3).toUpperCase() + '. ' + d.getDate() + ' ' + MONTH_ABBR[d.getMonth()].toUpperCase();
  }
  exListEl.addEventListener('click', function(e){
    var lien = e.target.closest('[data-action="voir-prec"]');
    if (!lien) return;
    lacherFocus(exListEl);
    // Un aller-retour, pas une chaine : depuis la seance d'avant, sa propre
    // date mene plus loin, mais la barre ramene toujours au point de depart.
    if (!retourSeance) retourSeance = { ds: state.selectedDay, ex: lien.dataset.ex };
    allerAuJour(lien.dataset.date);
    e.stopPropagation();
  });
  if (retourBtn) retourBtn.addEventListener('click', function(){
    var r = retourSeance;
    if (!r) return;
    retourSeance = null;
    allerAuJour(r.ds);
    var carte = exListEl.querySelector('.ex-card[data-id="' + (window.CSS && CSS.escape ? CSS.escape(r.ex) : r.ex) + '"]');
    if (carte) carte.scrollIntoView({ block:'center' });
  });

  // Increments de poids : eviter d'ouvrir le clavier pour 2,5 kg.
  exListEl.addEventListener('click', function(e){
    var stepBtn = e.target.closest('[data-action="step"]');
    if (!stepBtn) return;
    var day = getOrCreateDay(state.selectedDay);
    var found = findSerie(day, stepBtn.dataset.serieId);
    if (!found) return;
    var delta = Number(stepBtn.dataset.delta);
    var val = (typeof found.serie.poids === 'number' && !isNaN(found.serie.poids) ? found.serie.poids : 0) + delta;
    if (val < 0) val = 0;
    // Evite 62.500000000000004 : on reste sur un quart de kilo.
    val = Math.round(val * 4) / 4;
    found.serie.poids = val;
    var input = exListEl.querySelector('.serie-poids[data-serie-id="'+found.serie.id+'"]');
    if (input) input.value = poidsAffiche(val);
    scheduleSave(state.selectedDay, true);
    renderBandeau();
    e.stopPropagation();
  });

  // Au temps : cinq secondes par appui, le pas qu'on ajoute d'une semaine a
  // l'autre sur une planche.
  exListEl.addEventListener('click', function(e){
    var b = e.target.closest('[data-action="step-temps"]');
    if (!b) return;
    var found = findSerie(getOrCreateDay(state.selectedDay), b.dataset.serieId);
    if (!found) return;
    var val = Math.max(0, secondesDe(found.serie) + Number(b.dataset.delta));
    found.serie.reps = val ? TS.ecrireDuree(val) : '';
    var input = exListEl.querySelector('.serie-duree[data-serie-id="'+found.serie.id+'"]');
    if (input) input.value = val ? String(val) : '';
    var champMin = exListEl.querySelector('.serie-minutes[data-serie-id="'+found.serie.id+'"]');
    if (champMin) champMin.value = minutesAffichees(found.serie);
    scheduleSave(state.selectedDay, true);
    majEtoilesRecord(b.closest('.ex-card'));
    renderBandeau();
    e.stopPropagation();
  });

  // ---------- reprendre la derniere fois ----------
  // « ↺ DERNIÈRE FOIS » : les series de la derniere seance sur cet exercice,
  // la 3e en face de la 3e. Une serie deja remplie n'est pas touchee ; rien
  // n'est coche, et le RPE reste a dire aujourd'hui.
  function repriseSerie(s, cible){
    cible.poids = (typeof s.poids === 'number') ? s.poids : null;
    cible.reps = s.reps || '';
    cible.rpe = null;
    cible.fait = false;
    if (s.type) cible.type = s.type; else delete cible.type;
    if (s.repos) cible.repos = s.repos;
    ['vitesse', 'inclinaison'].forEach(function(f){
      if (typeof s[f] === 'number') cible[f] = s[f]; else delete cible[f];
    });
    return cible;
  }
  exListEl.addEventListener('click', function(e){
    var b = e.target.closest('[data-action="comme-avant"]');
    if (!b) return;
    var day = getOrCreateDay(state.selectedDay);
    var ex = findExercise(day, b.dataset.id);
    var p = ex && precedentDe(ex);
    if (!p) return;
    if (!ex.series) ex.series = [];
    var n = 0;
    p.prec.series.forEach(function(s, i){
      var cible = ex.series[i];
      if (cible && hasData(cible)) return;
      if (!cible){
        cible = { id:genSerieId(), poids:null, reps:'', rpe:null, repos:'', fait:false };
        ex.series.push(cible);
      }
      repriseSerie(s, cible);
      n++;
    });
    delete serieOuverte[ex.id];
    scheduleSave(state.selectedDay, true);
    repeindreCarte(b.closest('.ex-card'), ex);
    var d = fromDateStr(p.prec.date);
    showToast(n + (n > 1 ? ' séries reprises du ' : ' série reprise du ') + d.getDate() + ' ' + MONTH_NAMES[d.getMonth()]);
    renderBandeau();
  });

  // ---------- ajouter a ma seance du jour ----------
  // Depuis une seance passee et faite, un exercice se recopie dans celle
  // d'aujourd'hui avec ses series, poids, reps et RPE compris ; « fait »
  // repart a faux. Une seance d'avant la validation compte comme faite des
  // qu'elle a des series : sinon aucun ancien carnet n'en profiterait.
  function seanceFaite(ds){
    var auj = toDateStr(new Date());
    if (!ds || ds === auj || !state.sessions[ds]) return false;
    return estTerminee(ds) || (ds < auj && compterJour(state.sessions[ds]) > 0);
  }
  function ajouterAuJour(dsSource, exId){
    var src = state.sessions[dsSource];
    var ex = src && findExercise(src, exId);
    var series = ex ? seriesRemplies(ex) : [];
    if (!series.length) return null;
    var auj = toDateStr(new Date());
    var jour = getOrCreateDay(auj);
    var copies = series.map(function(s){
      return { id:genSerieId(), poids:s.poids, reps:s.reps, rpe:s.rpe,
               vitesse:s.vitesse, inclinaison:s.inclinaison,
               repos:s.repos || '', type:s.type, fait:false };
    });
    // Le meme exercice deja pose aujourd'hui, encore vide, recoit les series
    // au lieu d'un doublon.
    var cle = ex.nom ? cleCanonique(ex.nom) : '';
    var vide = cle && jour.exercises.filter(function(x){
      return x.nom && cleCanonique(x.nom) === cle && !(x.series || []).some(hasData);
    })[0];
    if (vide){
      vide.series = copies;
      if (ex.mesure) vide.mesure = ex.mesure;
    } else {
      jour.exercises.push({ id:genId(), nom:ex.nom || '', groupe:ex.groupe || 'Autre',
                            repos:ex.repos || '', mesure:ex.mesure, series:copies });
    }
    scheduleSave(auj, true);
    populateDatalist();
    if (state.selectedDay === auj) renderSeanceJour(true);
    return normalizeName(ex.nom) || 'L\'exercice';
  }
  function marquerAjoute(bouton, nom){
    bouton.disabled = true;
    bouton.textContent = '✓ AJOUTÉ À TA SÉANCE DU JOUR';
    showToast(nom + ' ajouté à ta séance du jour');
  }
  exListEl.addEventListener('click', function(e){
    var b = e.target.closest('[data-action="ajout-jour"]');
    if (!b) return;
    var nom = ajouterAuJour(state.selectedDay, b.dataset.id);
    if (nom) marquerAjoute(b, nom);
  });

  // ---------- refaire une seance, sur un jour vide ----------
  // Celle du meme jour la semaine d'avant, et la toute derniere si ce n'est
  // pas la meme. Tout se recopie, valeurs comprises (selectionnerSeance).
  function seancesARefaire(ds){
    var out = [];
    var semaine = toDateStr(addDays(fromDateStr(ds), -7));
    if (state.sessions[semaine] && compterJour(state.sessions[semaine]) > 0) out.push({ ds:semaine, semaine:true });
    var dates = Object.keys(state.sessions).filter(function(x){
      return x < ds && compterJour(state.sessions[x]) > 0;
    }).sort();
    var derniere = dates[dates.length - 1];
    if (derniere && derniere !== semaine) out.push({ ds:derniere, semaine:false });
    return out;
  }
  function refaireHTML(ds){
    return seancesARefaire(ds).map(function(r){
      var d = fromDateStr(r.ds);
      var quoi = r.semaine
        ? 'CELLE DE ' + DAY_NAMES[(d.getDay()+6)%7].toUpperCase() + ' DERNIER'
        : 'MA DERNIÈRE SÉANCE · ' + d.getDate() + ' ' + MONTH_ABBR[d.getMonth()].toUpperCase();
      return '<button type="button" class="btn-refaire" data-refaire="' + esc(r.ds) + '">'
        + '<span class="btn-refaire-quoi">↺ REFAIRE ' + esc(quoi) + '</span>'
        + '<span class="btn-refaire-titre">' + esc(titreSeance(r.ds)) + '</span></button>';
    }).join('');
  }
  exListEl.addEventListener('click', function(e){
    var b = e.target.closest('[data-refaire]');
    if (!b) return;
    var n = selectionnerSeance(b.dataset.refaire);
    if (!n){ showToast('Cette séance est vide'); return; }
    scheduleSave(state.selectedDay, true);
    populateDatalist();
    renderSeanceJour(true);
    showToast(n + (n > 1 ? ' exercices repris' : ' exercice repris'));
  });

  // ---------- ce que tu avais fait avec ----------
  // Sous « + AJOUTER UN EXERCICE » : les exercices de la meme seance la
  // semaine d'avant (seanceComparable) qui ne sont pas encore dans celle-ci.
  // Un appui pose l'exercice vide, avec autant de series que ce jour-la : la
  // colonne de la derniere fois et ↺ DERNIÈRE FOIS font le reste. Rien sur une
  // seance deja faite.
  function suggestionsExo(ds){
    if (!state.sessions[ds] || estTerminee(ds) || seanceFaite(ds)) return null;
    var cles = clesDuJour(ds, false);
    var ref = seanceComparable(ds, cles, 1);
    if (!ref) return null;
    var vus = {}, exos = [];
    state.sessions[ref].exercises.forEach(function(e){
      if (!e.nom || !e.nom.trim() || !seriesRemplies(e).length) return;
      var cle = cleCanonique(e.nom);
      if (cles[cle] || vus[cle]) return;
      vus[cle] = true;
      exos.push(e);
    });
    return exos.length ? { ds:ref, exos:exos.slice(0, 4) } : null;
  }
  function majSuggestions(){
    var zone = document.getElementById('suggestExo');
    if (!zone) return;
    var s = state.loading ? null : suggestionsExo(state.selectedDay);
    if (!s){ zone.hidden = true; zone.innerHTML = ''; return; }
    zone.hidden = false;
    zone.innerHTML = '<p class="suggest-tete">' + esc(jourDe(s.ds).toUpperCase()) + ', TU AVAIS AUSSI FAIT</p>'
      + '<div class="suggest-liste">' + s.exos.map(function(e){
          return '<button type="button" class="suggest-btn" data-suggestion="' + esc(e.id) + '" data-depuis="' + esc(s.ds) + '">+ '
            + esc(nomCanonique(e.nom) || e.nom) + '</button>';
        }).join('') + '</div>';
  }
  document.getElementById('suggestExo').addEventListener('click', function(e){
    var b = e.target.closest('[data-suggestion]');
    if (!b) return;
    var src = state.sessions[b.dataset.depuis];
    var ex = src && findExercise(src, b.dataset.suggestion);
    if (!ex) return;
    var day = getOrCreateDay(state.selectedDay);
    var n = Math.max(1, Math.min(10, seriesRemplies(ex).length));
    var series = [];
    for (var i = 0; i < n; i++) series.push({ id:genSerieId(), poids:null, reps:'', rpe:null, repos:'', fait:false });
    var nouveau = { id:genId(), nom:ex.nom, groupe:ex.groupe || 'Autre', repos:ex.repos || '', series:series };
    if (ex.mesure) nouveau.mesure = ex.mesure;
    day.exercises.push(nouveau);
    scheduleSave(state.selectedDay, true);
    renderDayPanel(true);
    renderBandeau();
    showToast((normalizeName(ex.nom) || 'L\'exercice') + ' ajouté · ↺ DERNIÈRE FOIS reprend ses séries');
  });

  // ---------- chrono des exercices au temps ----------
  // Un appui lance, le suivant met en pause : la duree tenue remplit la
  // premiere serie encore vide (un lest deja note reste), la coche, et le
  // chrono repart de zero au prochain appui. L'heure de depart est gardee
  // dans le telephone : une app que l'iPhone a fermee pendant la planche
  // retrouve son chrono. L'ecran reste allume tant qu'il tourne.
  var CLE_CHRONO = 'topset_chrono';
  var chrono = null, tickChrono = null, verrouEcran = null, repos = null;
  try { chrono = JSON.parse(localStorage.getItem(CLE_CHRONO) || 'null'); } catch (err) { chrono = null; }
  if (!chrono || typeof chrono.debut !== 'number' || !chrono.exId || !chrono.ds) chrono = null;
  function garderChrono(){
    try {
      if (chrono) localStorage.setItem(CLE_CHRONO, JSON.stringify(chrono));
      else localStorage.removeItem(CLE_CHRONO);
    } catch (err) {}
  }
  function secondesChrono(){ return chrono ? Math.max(0, Math.floor((Date.now() - chrono.debut) / 1000)) : 0; }
  function texteChrono(sec){ return Math.floor(sec / 60) + ':' + ('0' + (sec % 60)).slice(-2); }
  function boutonChronoHTML(ex){
    var enCours = !!chrono && chrono.exId === ex.id && chrono.ds === state.selectedDay;
    return '<button type="button" class="btn-chrono' + (enCours ? ' en-cours' : '') + '" data-action="chrono" data-id="' + esc(ex.id) + '"'
      + ' aria-label="' + (enCours ? 'Mettre le chrono en pause et noter la série' : 'Lancer le chrono') + '">'
      + (enCours ? '❚❚ <span class="chrono-temps">' + texteChrono(secondesChrono()) + '</span>' : '▶ CHRONO')
      + '</button>';
  }
  function tenirEcran(oui){
    try {
      if (oui && !verrouEcran && navigator.wakeLock){
        navigator.wakeLock.request('screen').then(function(v){ verrouEcran = v; }).catch(function(){});
      } else if (!oui && verrouEcran){
        verrouEcran.release().catch(function(){});
        verrouEcran = null;
      }
    } catch (err) {}
  }
  function suivreChrono(){
    clearInterval(tickChrono);
    tickChrono = null;
    tenirEcran(!!(chrono || repos));
    if (!chrono) return;
    tickChrono = setInterval(function(){
      var txt = texteChrono(secondesChrono());
      document.querySelectorAll('.chrono-temps').forEach(function(el){ el.textContent = txt; });
    }, 250);
  }
  // Le navigateur rend le verrou de l'ecran quand l'app passe en arriere-plan.
  document.addEventListener('visibilitychange', function(){
    if (!document.hidden && (chrono || repos)){ verrouEcran = null; tenirEcran(true); }
  });
  function arreterChrono(){
    if (!chrono) return null;
    var sec = secondesChrono(), c = chrono;
    chrono = null;
    garderChrono();
    suivreChrono();
    var day = state.sessions[c.ds];
    var ex = day && findExercise(day, c.exId);
    if (!ex || sec < 1) return null;
    if (!ex.series) ex.series = [];
    var cible = null;
    for (var i = 0; i < ex.series.length; i++){
      if (!ex.series[i].fait && !String(ex.series[i].reps || '').trim()){ cible = ex.series[i]; break; }
    }
    if (!cible){
      var derniere = ex.series[ex.series.length - 1];
      cible = { id:genSerieId(), poids:(derniere && derniere.poids != null) ? derniere.poids : null, reps:'', rpe:null,
                repos:(derniere && derniere.repos) || ex.repos || '', fait:false };
      ex.series.push(cible);
    }
    cible.reps = TS.ecrireDuree(sec);
    cible.fait = true;
    if (serieOuverte[ex.id] === cible.id) delete serieOuverte[ex.id];
    scheduleSave(c.ds, true);
    return { ex:ex, num:ex.series.indexOf(cible) + 1, sec:sec, ds:c.ds, serieId:cible.id };
  }
  if (chrono) suivreChrono();

  // ---------- repos entre les series ----------
  // Une serie cochee, ou un chrono de gainage mis en pause, lance le repos :
  // il monte depuis 0 dans la pastille en bas a gauche. La serie suivante
  // cochee, ou le chrono relance, l'arrete et ecrit sa duree dans le REPOS de
  // la serie qui l'a lance ; un appui sur la pastille aussi. Moins de 10 s
  // (des series cochees apres coup) ou plus de 20 min (un repos oublie) :
  // rien n'est ecrit. Seulement le jour meme, et garde dans le telephone
  // comme le chrono.
  var CLE_REPOS = 'topset_repos';
  var REPOS_MIN = 10, REPOS_MAX = 1200;
  var tickRepos = null;
  var reposPastille = document.getElementById('reposPastille');
  try { repos = JSON.parse(localStorage.getItem(CLE_REPOS) || 'null'); } catch (err) { repos = null; }
  if (!repos || typeof repos.debut !== 'number' || !repos.serieId || !repos.ds) repos = null;
  function garderRepos(){
    try {
      if (repos) localStorage.setItem(CLE_REPOS, JSON.stringify(repos));
      else localStorage.removeItem(CLE_REPOS);
    } catch (err) {}
  }
  function secondesRepos(){ return repos ? Math.max(0, Math.floor((Date.now() - repos.debut) / 1000)) : 0; }
  function lancerRepos(ds, serieId){
    if (!serieId || ds !== toDateStr(new Date())) return;
    repos = { ds:ds, serieId:serieId, debut:Date.now() };
    garderRepos();
    suivreRepos();
  }
  // noter : faux quand le repos ne veut plus rien dire (serie decochee,
  // seance validee). Rend les secondes ecrites, ou null.
  function finirRepos(noter){
    if (!repos) return null;
    var sec = secondesRepos(), r = repos;
    repos = null;
    garderRepos();
    suivreRepos();
    if (!noter || sec < REPOS_MIN || sec > REPOS_MAX) return null;
    var day = state.sessions[r.ds];
    var found = day && findSerie(day, r.serieId);
    if (!found) return null;
    found.serie.repos = String(sec);
    scheduleSave(r.ds, true);
    var champ = document.querySelector('.serie-repos[data-serie-id="' + r.serieId + '"]');
    if (champ) champ.value = String(sec);
    return sec;
  }
  function suivreRepos(){
    clearInterval(tickRepos);
    tickRepos = null;
    document.body.classList.toggle('en-repos', !!repos);
    reposPastille.hidden = !repos;
    tenirEcran(!!(chrono || repos));
    // Le repos fini (ou oublie), le plein ecran revient a la saisie.
    if (!repos){ if (focus && focus.phase === 'repos') rendreFocus(); return; }
    poserPastille();
    var temps = reposPastille.querySelector('.repos-temps');
    function pas(){
      var sec = secondesRepos();
      if (sec > REPOS_MAX){ finirRepos(false); return; }
      temps.textContent = texteChrono(sec);
      majTempsFocus();
      reposPastille.setAttribute('aria-label', 'Repos ' + texteChrono(sec) + ' : toucher pour l\'arrêter');
    }
    pas();
    if (repos) tickRepos = setInterval(pas, 500);
  }
  // ---- la pastille se deplace, et s'ouvre en grand (demande du 18/09) -----
  // « Je coche ma serie, ca enclenche le chrono » reste tel quel. En plus :
  // on pose la pastille ou on veut (du doigt, elle reste a sa place d'une
  // seance a l'autre), et un appui ouvre l'exercice en plein ecran, sur le
  // repos : le temps en grand, la prochaine serie et ses champs.
  var CLE_POS_REPOS = 'topset_repos_pos';
  var sansClicRepos = false;
  function bornerPastille(x, y){
    var w = reposPastille.offsetWidth || 130, h = reposPastille.offsetHeight || 52;
    return { x:Math.min(Math.max(8, x), innerWidth - w - 8), y:Math.min(Math.max(8, y), innerHeight - h - 8) };
  }
  function placerPastilleA(x, y){
    var p = bornerPastille(x, y);
    reposPastille.style.left = p.x + 'px';
    reposPastille.style.top = p.y + 'px';
    reposPastille.classList.add('deplacee');
  }
  function poserPastille(){
    var pos = null;
    try { pos = JSON.parse(localStorage.getItem(CLE_POS_REPOS) || 'null'); } catch (err) { pos = null; }
    if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number'){
      reposPastille.style.left = ''; reposPastille.style.top = '';
      reposPastille.classList.remove('deplacee');
      return;
    }
    placerPastilleA(pos.x * innerWidth, pos.y * innerHeight);
  }
  window.addEventListener('resize', function(){ if (repos) poserPastille(); });
  (function glisserPastille(){
    var depart = null, bouge = false;
    reposPastille.addEventListener('pointerdown', function(e){
      var r = reposPastille.getBoundingClientRect();
      depart = { x:e.clientX, y:e.clientY, l:r.left, t:r.top, id:e.pointerId };
      bouge = false;
    });
    reposPastille.addEventListener('pointermove', function(e){
      if (!depart || e.pointerId !== depart.id) return;
      var dx = e.clientX - depart.x, dy = e.clientY - depart.y;
      // Huit pixels avant de parler de glisser : un appui qui tremble reste un appui.
      if (!bouge && Math.abs(dx) + Math.abs(dy) < 8) return;
      if (!bouge){
        bouge = true;
        try { reposPastille.setPointerCapture(e.pointerId); } catch (err) {}
        reposPastille.classList.add('tenue');
      }
      placerPastilleA(depart.l + dx, depart.t + dy);
      e.preventDefault();
    });
    function lacher(){
      if (!depart) return;
      if (bouge){
        // La position posee, pas celle du rectangle grossi pendant qu'on la tient.
        reposPastille.classList.remove('tenue');
        var x = parseFloat(reposPastille.style.left) || 0, y = parseFloat(reposPastille.style.top) || 0;
        try { localStorage.setItem(CLE_POS_REPOS, JSON.stringify({ x:x / innerWidth, y:y / innerHeight })); } catch (err) {}
        sansClicRepos = true;
        setTimeout(function(){ sansClicRepos = false; }, 350);
      }
      depart = null;
    }
    reposPastille.addEventListener('pointerup', lacher);
    reposPastille.addEventListener('pointercancel', lacher);
  })();
  reposPastille.addEventListener('click', function(e){
    if (sansClicRepos){ sansClicRepos = false; e.preventDefault(); return; }
    if (!repos) return;
    var jourR = state.sessions[repos.ds];
    var fR = jourR && findSerie(jourR, repos.serieId);
    if (fR) ouvrirFocus(repos.ds, fR.exercise.id, 'repos');
  });

  // La prochaine serie a faire apres celle qui a lance le repos. Dans un
  // superset, c'est l'exercice suivant du bloc, a tour de role ; sinon la
  // suivante du meme exercice, puis le premier exercice qui en attend une.
  function prochaineSerie(){
    if (!repos) return null;
    var day = state.sessions[repos.ds];
    var f = day && findSerie(day, repos.serieId);
    if (!f) return null;
    var exs = day.exercises;
    function premiereLibre(ex){
      var ss = ex.series || [];
      for (var j = 0; j < ss.length; j++) if (!ss[j].fait) return { exercise:ex, serie:ss[j], num:j + 1 };
      return null;
    }
    var i = exs.indexOf(f.exercise), trouve = null;
    if (f.exercise.bloc){
      var bloc = exs.filter(function(e){ return e.bloc === f.exercise.bloc; });
      var k = bloc.indexOf(f.exercise);
      for (var n = 1; n <= bloc.length && !trouve; n++) trouve = premiereLibre(bloc[(k + n) % bloc.length]);
    }
    if (!trouve) trouve = premiereLibre(f.exercise);
    for (var a = i + 1; a < exs.length && !trouve; a++) trouve = premiereLibre(exs[a]);
    for (var b = 0; b < i && !trouve; b++) trouve = premiereLibre(exs[b]);
    return trouve || { exercise:f.exercise, serie:null, num:(f.exercise.series || []).length + 1 };
  }

  // ---------- l'exercice en plein ecran (demande du 19/09/2026) ----------
  // Un appui sur l'icone d'une carte ouvre l'exercice en grand : seule la
  // serie a faire s'affiche, avec de gros -/+ et une molette au toucher du
  // chiffre. Valider (le bouton, ou un swipe vers la droite) l'ecrit dans la
  // carte comme la coche de sa ligne, et le repos monte en plein ecran. Un
  // swipe vers la gauche supprime la serie, avec « Annuler ». Le ✕ ferme
  // sans rien valider ni supprimer : ce qui est regle reste dans la serie.
  // Un superset montre ses exercices ensemble, a tour de role. Le cardio
  // reste sur sa carte : il n'a ni serie a enchainer ni repos.
  var focusEl = document.getElementById('focus');
  var focusCorps = document.getElementById('focusCorps');
  var focus = null;          // { ds, exId, phase:'saisie'|'repos' }
  var focusAnnule = null;    // la derniere serie supprimee, le temps d'annuler
  var focusAnnuleMinuterie = null;
  var fondFocus = null;      // le fond anime, branche plus bas avec la braise
  var RPE_CHIPS = [6, 7, 8, 9, 10];

  function premiereAFaire(ex){
    var ss = ex.series || [];
    for (var i = 0; i < ss.length; i++) if (!ss[i].fait) return { serie:ss[i], num:i + 1 };
    return null;
  }
  function nbFaites(ex){ return (ex.series || []).filter(function(s){ return s.fait; }).length; }
  // Les exercices de la seance, un superset comptant pour un.
  function unitesDuJour(day){
    var vus = {}, out = [];
    (day.exercises || []).forEach(function(ex){
      if (estCardio(ex) && estAuTemps(ex)) return;
      if (ex.bloc){ if (vus[ex.bloc]) return; vus[ex.bloc] = true; }
      out.push(ex);
    });
    return out;
  }
  function membresDe(day, ex){
    return ex.bloc ? day.exercises.filter(function(e){ return e.bloc === ex.bloc; }) : [ex];
  }
  // Dans un superset, c'est au tour de celui qui a le moins de series faites.
  function tourDe(membres){
    var choisi = null, min = Infinity;
    membres.forEach(function(m){
      if (!premiereAFaire(m)) return;
      var n = nbFaites(m);
      if (n < min){ min = n; choisi = m; }
    });
    return choisi;
  }
  function focusJour(){ return focus && state.sessions[focus.ds]; }
  function focusExo(){ var d = focusJour(); return d && findExercise(d, focus.exId); }

  function valeurHTML(champ, texte, unite, sid, label){
    return '<button type="button" class="fs-val" data-fs="roue" data-champ="' + champ + '" data-serie-id="' + sid + '" aria-label="' + label + ' : ' + (texte || 'vide') + ', toucher pour choisir">'
      + '<b>' + (texte || '—') + '</b>' + (unite ? '<small>' + unite + '</small>' : '') + '</button>';
  }
  function ligneHTML(champ, texte, unite, sid, label, pas, pasTexte){
    return '<div class="fs-ligne">'
      + '<button type="button" class="fs-pm" data-fs="pas" data-champ="' + champ + '" data-delta="-' + pas + '" data-serie-id="' + sid + '" aria-label="' + label + ' : moins ' + pasTexte + '">−</button>'
      + valeurHTML(champ, texte, unite, sid, label)
      + '<button type="button" class="fs-pm" data-fs="pas" data-champ="' + champ + '" data-delta="' + pas + '" data-serie-id="' + sid + '" aria-label="' + label + ' : plus ' + pasTexte + '">+</button>'
      + '</div>';
  }
  function puces(s, auTemps){
    return '<div class="fs-rpe" role="group" aria-label="' + (auTemps ? 'Difficulté' : 'RPE') + '">'
      + RPE_CHIPS.map(function(v){
        var demi = typeof s.rpe === 'number' && Math.floor(s.rpe) === v && s.rpe !== v;
        var on = s.rpe === v || demi;
        return '<button type="button" class="fs-puce' + (on ? ' on' : '') + '" data-fs="rpe" data-v="' + v + '" data-serie-id="' + esc(s.id) + '" aria-pressed="' + on + '">'
          + (demi ? String(s.rpe).replace('.', ',') : v) + '</button>';
      }).join('') + '</div>';
  }
  // Les champs d'une serie. compact : cote a cote, pour un superset ou la
  // serie d'apres pendant le repos.
  function champsHTML(ex, s, compact){
    var sid = esc(s.id), auTemps = estAuTemps(ex);
    if (auTemps){
      var sec = secondesAffichees(s);
      return '<div class="fs-champ"><span class="fs-label">Durée</span>'
        + ligneHTML('duree', sec, 's', sid, 'Durée', 5, '5 secondes') + '</div>'
        + (compact ? '' : '<div class="fs-champ"><span class="fs-label">Difficulté</span>' + puces(s, true) + '</div>');
    }
    var kg = poidsAffiche(s.poids), reps = s.reps == null ? '' : String(s.reps);
    if (compact){
      return '<div class="fs-deux">'
        + '<div class="fs-champ">' + ligneHTML('poids', kg, 'kg', sid, 'Charge', 2.5, '2,5 kg') + '</div>'
        + '<div class="fs-champ">' + ligneHTML('reps', reps, 'reps', sid, 'Répétitions', 1, 'une répétition') + '</div>'
        + '</div>';
    }
    return '<div class="fs-champ"><span class="fs-label">Charge</span>' + ligneHTML('poids', kg, 'kg', sid, 'Charge', 2.5, '2,5 kg') + '</div>'
      + '<div class="fs-champ"><span class="fs-label">Reps</span>' + ligneHTML('reps', reps, '', sid, 'Répétitions', 1, 'une répétition') + '</div>'
      + '<div class="fs-champ"><span class="fs-label">RPE</span>' + puces(s, false) + '</div>';
  }
  function derniereFois(ex, num){
    var pr = precedentDe(ex);
    var ps = pr && pr.prec && pr.prec.series[num - 1];
    return ps ? 'La dernière fois : ' + esc(perfTexte(ps)) : '';
  }
  function tampons(){
    return '<span class="fs-tampon ok" aria-hidden="true">VALIDÉE</span><span class="fs-tampon suppr" aria-hidden="true">SUPPRIMER</span>';
  }
  function hautHTML(day, unite){
    var unites = unitesDuJour(day), i = unites.indexOf(unite);
    var points = unites.length > 1 ? unites.map(function(u, k){ return '<i' + (k === i ? ' class="on"' : '') + '></i>'; }).join('') : '';
    return '<div class="fs-haut">'
      + '<button type="button" class="fs-rond" data-fs="fermer" aria-label="Fermer, la série reste en cours"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>'
      + '<div class="fs-points" aria-label="Exercice ' + (i + 1) + ' sur ' + unites.length + '">' + points + '</div>'
      + '<span class="fs-rond fs-vide" aria-hidden="true"></span>'
      + '</div>';
  }

  function rendreFocus(){
    var day = focusJour(), ex = focusExo();
    if (!ex){ fermerFocus(); return; }
    var unites = unitesDuJour(day);
    var unite = ex.bloc ? (unites.filter(function(u){ return u.bloc === ex.bloc; })[0] || ex) : ex;
    var membres = membresDe(day, ex);
    var numUnite = unites.indexOf(unite) + 1;
    var dernier = numUnite >= unites.length;
    var html = hautHTML(day, unite);
    if (focus.phase === 'repos' && repos && repos.ds === focus.ds){
      html += reposFocusHTML(day, membres, dernier);
      focusCorps.innerHTML = html;
      majTempsFocus();
      if (fondFocus) fondFocus.regler(1.7, [1, .36, .22]);
      return;
    }
    focus.phase = 'saisie';
    var actif = tourDe(membres);
    var cl = classement(membres[0]);
    if (membres.length > 1){
      var tours = Math.max.apply(null, membres.map(function(m){ return (m.series || []).length; }));
      var tour = Math.min(tours, Math.min.apply(null, membres.map(nbFaites)) + 1);
      html += '<div class="fs-titre"><p class="fs-eyebrow">Superset · tour ' + tour + ' sur ' + tours + '</p>'
        + '<h2 class="fs-nom" id="focusTitre">' + esc(membres.map(function(m){ return normalizeName(m.nom) || 'Sans nom'; }).join(' + ')) + '</h2></div>';
      html += '<div class="fs-pile">' + membres.map(function(m, k){
        var af = premiereAFaire(m), lettre = String.fromCharCode(65 + k);
        var clm = classement(m);
        if (!af) return '<div class="fs-carte fs-ss fini"><div class="fs-ss-tete"><span class="fs-lettre">' + lettre + '</span><b>' + esc(normalizeName(m.nom) || 'Sans nom') + '</b><span>✓ fini</span></div></div>';
        var estActif = m === actif;
        return '<div class="fs-carte fs-ss' + (estActif ? ' actif' : ' en-attente') + '" data-ex-id="' + esc(m.id) + '" data-serie-id="' + esc(af.serie.id) + '">'
          + (estActif ? tampons() : '')
          + '<div class="fs-ss-tete"><span class="fs-lettre">' + lettre + '</span><b>' + esc(normalizeName(m.nom) || 'Sans nom') + '</b><span>' + esc(libelleMuscle(clm)) + ' · S' + af.num + '</span></div>'
          + champsHTML(m, af.serie, true)
          + '</div>';
      }).join('') + '</div>';
    } else {
      var af1 = premiereAFaire(ex);
      var faites = (ex.series || []).map(function(s, k){ return s.fait ? '<span>S' + (k + 1) + ' ' + esc(perfCourt(s)) + '<b aria-hidden="true">✓</b></span>' : ''; }).join('');
      html += '<div class="fs-titre"><p class="fs-eyebrow">Exo ' + numUnite + ' sur ' + unites.length + '</p>'
        + '<h2 class="fs-nom" id="focusTitre">' + esc(normalizeName(ex.nom) || 'Exercice sans nom') + '</h2>'
        + '<span class="fs-chip" style="--c:' + (GROUP_COLORS[cl.groupe] || GROUP_COLORS['Autre']) + '">' + esc(libelleMuscle(cl)) + '</span></div>'
        + (faites ? '<div class="fs-faites">' + faites + '</div>' : '');
      if (af1){
        var total = (ex.series || []).length;
        html += '<div class="fs-pile"><div class="fs-carte actif" data-ex-id="' + esc(ex.id) + '" data-serie-id="' + esc(af1.serie.id) + '">' + tampons()
          + '<div class="fs-carte-tete"><span class="fs-num">Série ' + af1.num + ' sur ' + total + '</span><span class="fs-avant">' + derniereFois(ex, af1.num) + '</span></div>'
          + champsHTML(ex, af1.serie, false)
          + '</div></div>';
      }
    }
    if (actif){
      var lettreA = membres.length > 1 ? String.fromCharCode(65 + membres.indexOf(actif)) : '';
      var suivant = null;
      if (membres.length > 1){
        var reste = membres.filter(function(m){ return m !== actif && premiereAFaire(m) && nbFaites(m) <= nbFaites(actif); });
        suivant = reste.length ? String.fromCharCode(65 + membres.indexOf(reste[0])) : null;
      }
      html += '<p class="fs-aide">Glisse la série : à droite pour la valider, à gauche pour la supprimer.</p>'
        + '<div class="fs-bas"><button type="button" class="fs-cta" data-fs="valider">' + (lettreA ? 'VALIDER ' + lettreA + (suivant ? ' · PUIS ' + suivant : '') : 'VALIDER LA SÉRIE') + '</button>'
        + '<button type="button" class="fs-ghost" data-fs="suivant">' + (dernier ? 'Fermer' : 'Exo suivant →') + '</button></div>';
    } else {
      html += '<div class="fs-fini"><p>Toutes les séries prévues sont faites.</p></div>'
        + '<div class="fs-bas"><button type="button" class="fs-cta secondaire" data-fs="ajouter">+ AJOUTER UNE SÉRIE</button>'
        + '<button type="button" class="fs-ghost" data-fs="suivant">' + (dernier ? 'Fermer' : 'Exo suivant →') + '</button></div>';
    }
    focusCorps.innerHTML = html;
    if (fondFocus) fondFocus.regler(.6, [1, .36, .22]);
  }

  function reposFocusHTML(day, membres, dernier){
    var f = findSerie(day, repos.serieId);
    var p = prochaineSerie();
    var html = '<div class="fs-titre"><p class="fs-eyebrow">Repos · ' + esc(f ? normalizeName(f.exercise.nom) || 'Exercice' : 'Exercice') + '</p></div>'
      + '<div class="fs-anneau" id="focusAnneau"><div class="fs-temps"><b id="focusTemps">0:00</b><small>'
      + (f ? 'depuis la série ' + ((f.exercise.series || []).indexOf(f.serie) + 1) : '') + '</small></div></div>';
    if (f) html += '<p class="fs-note">✓ Série enregistrée : ' + esc(perfTexte(f.serie)) + (typeof f.serie.rpe === 'number' ? ' · RPE ' + String(f.serie.rpe).replace('.', ',') : '') + '</p>';
    if (p && p.serie){
      var autre = membres.indexOf(p.exercise) < 0;
      html += '<div class="fs-mini"><div class="fs-mini-tete"><span>Prochaine · ' + (autre || membres.length > 1 ? esc(normalizeName(p.exercise.nom)) + ' · ' : '') + 'série ' + p.num + '</span><span>modifiable</span></div>'
        + champsHTML(p.exercise, p.serie, true) + '</div>'
        + '<div class="fs-bas"><button type="button" class="fs-cta" data-fs="reprendre">PASSER À LA SÉRIE SUIVANTE</button>'
        + '<button type="button" class="fs-ghost" data-fs="suivant">' + (dernier ? 'Fermer' : 'Terminer l\'exo') + '</button></div>';
    } else {
      html += '<div class="fs-fini"><p>Toutes les séries prévues sont faites.</p></div>'
        + '<div class="fs-bas"><button type="button" class="fs-cta secondaire" data-fs="ajouter">+ AJOUTER UNE SÉRIE</button>'
        + '<button type="button" class="fs-ghost" data-fs="suivant">' + (dernier ? 'Fermer' : 'Exo suivant →') + '</button></div>';
    }
    return html;
  }
  // Le repos vise celui de la serie d'avant, ou 90 s : l'anneau se remplit
  // jusque-la, puis passe au vert. Le temps, lui, continue de monter.
  function majTempsFocus(){
    if (!focus || focus.phase !== 'repos' || !repos) return;
    var t = document.getElementById('focusTemps'), a = document.getElementById('focusAnneau');
    if (!t || !a) return;
    var sec = secondesRepos();
    t.textContent = texteChrono(sec);
    var day = state.sessions[repos.ds], f = day && findSerie(day, repos.serieId);
    var cible = Number(f && (f.serie.repos || f.exercise.repos)) || 90;
    if (f && f.serie.repos && String(f.serie.repos) === String(sec)) cible = 90;
    a.style.setProperty('--p', Math.min(1, sec / cible));
    a.classList.toggle('pret', sec >= cible);
  }

  function ouvrirFocus(ds, exId, phase){
    var day = state.sessions[ds];
    var ex = day && findExercise(day, exId);
    if (!ex) return;
    focus = { ds:ds, exId:exId, phase:phase || 'saisie' };
    focusEl.hidden = false;
    document.body.classList.add('en-focus');
    rendreFocus();
    // Le focus sur le dialogue lui-meme : un lecteur d'ecran l'annonce, et
    // aucun bouton ne s'allume d'un contour qu'on n'a pas demande.
    focusEl.focus({ preventScroll:true });
  }
  function fermerFocus(){
    if (!focus) return;
    focus = null;
    fermerRoue(false);
    focusEl.hidden = true;
    document.body.classList.remove('en-focus');
    if (state.view === 'seances') renderDayPanel(true);
    renderBandeau();
  }
  function allerUniteSuivante(){
    var day = focusJour(), ex = focusExo();
    var unites = unitesDuJour(day);
    var unite = ex.bloc ? unites.filter(function(u){ return u.bloc === ex.bloc; })[0] : ex;
    var i = unites.indexOf(unite);
    if (i < 0 || i + 1 >= unites.length){ fermerFocus(); return; }
    focus.exId = unites[i + 1].id;
    focus.phase = 'saisie';
    rendreFocus();
  }

  // Valider : la meme chose que la coche de la ligne.
  function validerFocus(exId, serieId){
    var day = focusJour();
    var f = day && findSerie(day, serieId);
    if (!f || f.serie.fait) return;
    var ds = focus.ds;
    f.serie.fait = true;
    if (serieOuverte[f.exercise.id] === serieId) delete serieOuverte[f.exercise.id];
    scheduleSave(ds, true);
    var noteSec = finirRepos(true);
    lancerRepos(ds, serieId);
    var num = f.exercise.series.indexOf(f.serie) + 1;
    // Dans un superset, on enchaine l'autre exercice sans repos.
    var membres = membresDe(day, f.exercise);
    var encore = membres.length > 1 && membres.some(function(m){ return m !== f.exercise && premiereAFaire(m) && nbFaites(m) < nbFaites(f.exercise); });
    focus.phase = (!encore && repos && repos.ds === ds) ? 'repos' : 'saisie';
    rendreFocus();
    renderBandeau();
    showToast('Série ' + num + ' notée' + (noteSec ? ' · repos ' + texteChrono(noteSec) : ''));
  }
  function supprimerFocus(serieId){
    var day = focusJour();
    var f = day && findSerie(day, serieId);
    if (!f) return;
    var idx = f.exercise.series.indexOf(f.serie);
    f.exercise.series.splice(idx, 1);
    if (repos && repos.serieId === serieId) finirRepos(false);
    scheduleSave(focus.ds, true);
    focusAnnule = { ds:focus.ds, exId:f.exercise.id, serie:f.serie, idx:idx };
    rendreFocus();
    renderBandeau();
    montrerAnnuler('Série ' + (idx + 1) + ' supprimée');
  }
  function montrerAnnuler(texte){
    var barre = document.getElementById('focusAnnuler');
    barre.querySelector('span').textContent = texte;
    barre.hidden = false;
    clearTimeout(focusAnnuleMinuterie);
    focusAnnuleMinuterie = setTimeout(function(){ barre.hidden = true; focusAnnule = null; }, 5000);
  }
  function annulerSuppression(){
    var a = focusAnnule;
    document.getElementById('focusAnnuler').hidden = true;
    clearTimeout(focusAnnuleMinuterie);
    focusAnnule = null;
    if (!a) return;
    var day = state.sessions[a.ds], ex = day && findExercise(day, a.exId);
    if (!ex) return;
    if (!ex.series) ex.series = [];
    ex.series.splice(Math.min(a.idx, ex.series.length), 0, a.serie);
    scheduleSave(a.ds, true);
    if (focus) rendreFocus();
    renderBandeau();
    showToast('Série remise');
  }

  // Ecrire dans la serie comme sa ligne : meme lecture, meme sauvegarde.
  function ecrireFocus(serieId, champ, valeur){
    var day = focusJour();
    var f = day && findSerie(day, serieId);
    if (!f) return;
    var s = f.serie;
    if (champ === 'poids') s.poids = valeur == null ? null : Math.max(0, Math.round(valeur * 100) / 100);
    else if (champ === 'reps') s.reps = valeur == null ? '' : String(Math.max(0, Math.round(valeur)));
    else if (champ === 'duree') s.reps = valeur ? TS.ecrireDuree(Math.max(0, Math.round(valeur))) : '';
    else if (champ === 'rpe') s.rpe = valeur;
    scheduleSave(focus.ds);
  }
  function valeurDe(s, champ){
    if (champ === 'poids') return typeof s.poids === 'number' ? s.poids : null;
    if (champ === 'reps'){ var r = parseInt(s.reps, 10); return isNaN(r) ? null : r; }
    if (champ === 'duree'){ var d = secondesAffichees(s); return d === '' ? null : Number(d); }
    return null;
  }

  // ---- la molette : un toucher sur le chiffre -----
  // Des colonnes qui defilent et s'arretent d'elles-memes sur une valeur
  // (scroll-snap) : le defilement natif du telephone, son elan compris.
  var roueEl = document.getElementById('focusRoue');
  var roue = null;           // { serieId, champ }
  var HAUT_ITEM = 44;
  function colonneHTML(valeurs, choisie, fmt){
    return '<div class="roue-col" tabindex="0">' + '<div class="roue-marge"></div><div class="roue-marge"></div>'
      + valeurs.map(function(v){ return '<div class="roue-item" data-v="' + v + '">' + fmt(v) + '</div>'; }).join('')
      + '<div class="roue-marge"></div><div class="roue-marge"></div></div>';
  }
  function plage(a, b, pas){ var out = []; for (var v = a; v <= b + 1e-9; v += pas) out.push(Math.round(v * 100) / 100); return out; }
  function ouvrirRoue(serieId, champ){
    var day = focusJour();
    var f = day && findSerie(day, serieId);
    if (!f) return;
    var v = valeurDe(f.serie, champ);
    roue = { serieId:serieId, champ:champ };
    var cols, choix;
    if (champ === 'poids'){
      var base = v == null ? 20 : v;
      var ent = Math.floor(base), dec = Math.round((base - ent) * 100);
      dec = [0, 25, 50, 75].reduce(function(m, d){ return Math.abs(d - dec) < Math.abs(m - dec) ? d : m; }, 0);
      cols = [colonneHTML(plage(0, 400, 1), ent, String), colonneHTML([0, 25, 50, 75], dec, function(d){ return ',' + (d === 0 ? '0' : d === 50 ? '5' : d); })];
      choix = [ent, dec];
    } else if (champ === 'reps'){
      cols = [colonneHTML(plage(0, 100, 1), v || 0, String)];
      choix = [v == null ? 8 : v];
    } else {
      cols = [colonneHTML(plage(0, 900, 5), v || 0, String)];
      choix = [v == null ? 30 : Math.round(v / 5) * 5];
    }
    var titre = champ === 'poids' ? 'Charge' : champ === 'reps' ? 'Répétitions' : 'Durée';
    var unite = champ === 'poids' ? 'kg' : champ === 'reps' ? 'reps' : 's';
    roueEl.innerHTML = '<div class="roue-feuille" role="dialog" aria-modal="true" aria-label="' + titre + '">'
      + '<div class="roue-poignee" aria-hidden="true"></div>'
      + '<div class="roue-tete"><b>' + titre + '</b><button type="button" class="roue-ok" data-roue="ok">OK</button></div>'
      + '<div class="roue-cols"><div class="roue-bande" aria-hidden="true"></div>' + cols.join('') + '<span class="roue-unite">' + unite + '</span></div>'
      + '</div>';
    roueEl.hidden = false;
    var colsEl = roueEl.querySelectorAll('.roue-col');
    colsEl.forEach(function(col, k){
      var items = col.querySelectorAll('.roue-item');
      var idx = 0;
      for (var i = 0; i < items.length; i++) if (Number(items[i].dataset.v) === choix[k]) { idx = i; break; }
      col.scrollTop = idx * HAUT_ITEM;
      marquerRoue(col);
      var attente = null;
      col.addEventListener('scroll', function(){ clearTimeout(attente); attente = setTimeout(function(){ marquerRoue(col); }, 60); marquerRoue(col); }, { passive:true });
      col.addEventListener('click', function(e){
        var it = e.target.closest('.roue-item');
        if (!it) return;
        var n = Array.prototype.indexOf.call(col.querySelectorAll('.roue-item'), it);
        col.scrollTo({ top:n * HAUT_ITEM, behavior:'smooth' });
      });
    });
  }
  function marquerRoue(col){
    var items = col.querySelectorAll('.roue-item');
    var n = Math.max(0, Math.min(items.length - 1, Math.round(col.scrollTop / HAUT_ITEM)));
    for (var i = 0; i < items.length; i++) items[i].classList.toggle('sel', i === n);
    return items[n] ? Number(items[n].dataset.v) : 0;
  }
  function fermerRoue(garder){
    if (!roue) return;
    if (garder){
      var cols = roueEl.querySelectorAll('.roue-col');
      var v = marquerRoue(cols[0]);
      if (roue.champ === 'poids') v = v + marquerRoue(cols[1]) / 100;
      ecrireFocus(roue.serieId, roue.champ, v);
    }
    roue = null;
    roueEl.hidden = true;
    roueEl.innerHTML = '';
    if (garder && focus) rendreFocus();
  }
  if (roueEl){
    roueEl.addEventListener('click', function(e){
      if (e.target.closest('[data-roue="ok"]')) fermerRoue(true);
      else if (e.target === roueEl) fermerRoue(false);
    });
  }

  // ---- le swipe, facon Tinder -----
  // La carte suit le doigt en penchant. Lachee au-dela d'un tiers de
  // l'ecran, ou lancee d'un geste vif, elle part : a droite, la serie est
  // validee ; a gauche, supprimee. Sinon elle revient. Un appui sur un
  // bouton reste un appui : on ne glisse qu'a partir de 10 px a l'horizontale.
  (function swipeFocus(){
    if (!focusEl) return;
    var g = null;
    focusEl.addEventListener('pointerdown', function(e){
      var carte = e.target.closest('.fs-carte.actif');
      if (!carte || roue || e.button > 0) return;
      g = { carte:carte, x:e.clientX, y:e.clientY, t:performance.now(), id:e.pointerId, dx:0, parti:false, vx:0, lx:e.clientX, lt:performance.now() };
    });
    focusEl.addEventListener('pointermove', function(e){
      if (!g || e.pointerId !== g.id) return;
      var dx = e.clientX - g.x, dy = e.clientY - g.y;
      if (!g.parti){
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)){ g = null; return; }
        if (Math.abs(dx) < 10) return;
        g.parti = true;
        try { g.carte.setPointerCapture(e.pointerId); } catch (err) {}
        g.carte.classList.add('tenue');
      }
      var now = performance.now();
      if (now > g.lt){ g.vx = (e.clientX - g.lx) / (now - g.lt); g.lx = e.clientX; g.lt = now; }
      g.dx = dx;
      g.carte.style.transform = 'translateX(' + dx + 'px) rotate(' + (dx / 18) + 'deg)';
      var force = Math.min(1, Math.abs(dx) / 110);
      g.carte.style.setProperty('--sw-ok', dx > 0 ? force : 0);
      g.carte.style.setProperty('--sw-suppr', dx < 0 ? force : 0);
      if (fondFocus) fondFocus.regler(.6 + force * .9, dx > 0 ? [.17, .82, .54] : [1, .25, .2], force);
      e.preventDefault();
    });
    function lacher(e){
      if (!g || (e && e.pointerId !== g.id)) return;
      var c = g.carte, dx = g.dx, parti = g.parti, v = g.vx;
      g = null;
      if (!parti) return;
      c.classList.remove('tenue');
      var largeur = focusEl.clientWidth || innerWidth;
      var sens = (dx > largeur / 3 || (v > .6 && dx > 40)) ? 1 : (dx < -largeur / 3 || (v < -.6 && dx < -40)) ? -1 : 0;
      if (!sens){
        c.style.transform = '';
        c.style.setProperty('--sw-ok', 0); c.style.setProperty('--sw-suppr', 0);
        if (fondFocus) fondFocus.regler(.6, [1, .36, .22]);
        return;
      }
      c.classList.add('part');
      c.style.transform = 'translateX(' + (sens * largeur * 1.3) + 'px) rotate(' + (sens * 24) + 'deg)';
      var exId = c.dataset.exId, sid = c.dataset.serieId;
      setTimeout(function(){
        if (!focus) return;
        if (sens > 0) validerFocus(exId, sid); else supprimerFocus(sid);
      }, 220);
    }
    focusEl.addEventListener('pointerup', lacher);
    focusEl.addEventListener('pointercancel', lacher);
  })();

  if (focusEl){
    focusEl.addEventListener('click', function(e){
      var b = e.target.closest('[data-fs]');
      if (!b || !focus) return;
      var quoi = b.dataset.fs, day = focusJour();
      if (quoi === 'fermer'){ fermerFocus(); return; }
      if (quoi === 'suivant'){ allerUniteSuivante(); return; }
      if (quoi === 'valider'){
        var c = focusCorps.querySelector('.fs-carte.actif');
        if (c) validerFocus(c.dataset.exId, c.dataset.serieId);
        return;
      }
      if (quoi === 'reprendre'){
        var p = prochaineSerie();
        if (p && p.exercise && membresDe(day, focusExo()).indexOf(p.exercise) < 0) focus.exId = p.exercise.id;
        focus.phase = 'saisie';
        rendreFocus();
        return;
      }
      if (quoi === 'ajouter'){
        var membres = membresDe(day, focusExo());
        membres.forEach(function(m){
          var ss = m.series || (m.series = []);
          var der = ss[ss.length - 1];
          ss.push({ id:genSerieId(), poids:der ? der.poids : null, reps:der ? der.reps : '', rpe:null, repos:(der && der.repos) || m.repos || '', fait:false });
        });
        scheduleSave(focus.ds, true);
        focus.phase = 'saisie';
        rendreFocus();
        return;
      }
      if (quoi === 'roue'){ ouvrirRoue(b.dataset.serieId, b.dataset.champ); return; }
      var f = day && findSerie(day, b.dataset.serieId);
      if (!f) return;
      if (quoi === 'pas'){
        var champ = b.dataset.champ, d = Number(b.dataset.delta);
        var v = valeurDe(f.serie, champ);
        ecrireFocus(f.serie.id, champ, Math.max(0, (v == null ? 0 : v) + d));
      } else if (quoi === 'rpe'){
        var n = Number(b.dataset.v);
        var avant = f.serie.rpe;
        ecrireFocus(f.serie.id, 'rpe', (typeof avant === 'number' && Math.floor(avant) === n) ? (avant === n ? null : n) : n);
      }
      rendreFocus();
    });
    document.getElementById('focusAnnuler').addEventListener('click', function(e){
      if (e.target.closest('button')) annulerSuppression();
    });
    document.addEventListener('keydown', function(e){
      if (e.key !== 'Escape' || !focus) return;
      if (roue) fermerRoue(false); else fermerFocus();
    });
  }

  // L'icone de chaque carte ouvre l'exercice en grand.
  exListEl.addEventListener('click', function(e){
    var b = e.target.closest('[data-action="focus"]');
    if (!b) return;
    ouvrirFocus(state.selectedDay, b.dataset.id, 'saisie');
  });

  if (repos) suivreRepos();

  exListEl.addEventListener('click', function(e){
    var b = e.target.closest('[data-action="chrono"]');
    if (!b) return;
    var enCours = !!chrono && chrono.exId === b.dataset.id && chrono.ds === state.selectedDay;
    // Un seul chrono : en lancer un autre note d'abord celui qui tournait.
    var notee = arreterChrono();
    var reposNote = null;
    if (!enCours){
      // Relancer, c'est la fin du repos.
      reposNote = finirRepos(true);
      chrono = { exId:b.dataset.id, ds:state.selectedDay, debut:Date.now() };
      garderChrono();
      suivreChrono();
    } else if (notee) lancerRepos(notee.ds, notee.serieId);
    var exC = findExercise(getOrCreateDay(state.selectedDay), b.dataset.id);
    if (notee && notee.ex !== exC) renderDayPanel(true);
    else repeindreCarte(b.closest('.ex-card'), exC);
    if (notee) showToast('Série ' + notee.num + ' notée : ' + TS.formatDuree(notee.sec));
    else if (reposNote) showToast('Repos ' + texteChrono(reposNote) + ' noté');
    renderBandeau();
  });

  exListEl.addEventListener('click', function(e){
    var mesBtn = e.target.closest('[data-action="mesure"]');
    if (mesBtn){
      var dayM = getOrCreateDay(state.selectedDay);
      var exM = findExercise(dayM, mesBtn.dataset.id);
      if (!exM) return;
      exM.mesure = estAuTemps(exM) ? 'reps' : (cardioParDefaut(exM) ? 'cardio' : 'temps');
      scheduleSave(state.selectedDay, true);
      renderDayPanel(true);
      showToast(exM.mesure === 'cardio' ? 'Cardio : minutes, vitesse et inclinaison moyennes'
        : (exM.mesure === 'temps' ? 'Au temps : la durée se note en secondes' : 'En répétitions'));
      return;
    }

    var delBtn = e.target.closest('.ex-del');
    if (delBtn){
      var id = delBtn.dataset.id;
      var day = getOrCreateDay(state.selectedDay);
      day.exercises = day.exercises.filter(function(x){ return x.id!==id; });
      nettoyerBlocs(day);
      scheduleSave(state.selectedDay,true);
      renderDayPanel(true);
      renderBandeau();
      return;
    }

    var supBtn = e.target.closest('[data-action="superset"]');
    if (supBtn){
      var dayS = getOrCreateDay(state.selectedDay);
      var idx = -1;
      for (var k=0;k<dayS.exercises.length;k++){ if (dayS.exercises[k].id===supBtn.dataset.id){ idx=k; break; } }
      if (idx < 0) return;
      var source = dayS.exercises[idx];
      if (!source.bloc) source.bloc = genId();
      // Insere juste apres, jamais a la fin : un superset dont les membres sont
      // separes par trois autres exercices n'a plus aucun sens a l'ecran.
      var suivant = { id:genId(), nom:'', groupe:'Autre', repos:'', bloc:source.bloc,
                      series:[{ id:genSerieId(), poids:null, reps:'', rpe:null, repos:'', fait:false }] };
      dayS.exercises.splice(idx + 1, 0, suivant);
      scheduleSave(state.selectedDay,true);
      renderDayPanel(true);
      renderBandeau();
      requestAnimationFrame(function(){
        var el = exListEl.querySelector('.ex-name[data-id="'+suivant.id+'"]');
        if (el) el.focus();
      });
      return;
    }

    var detBtn = e.target.closest('[data-action="detacher"]');
    if (detBtn){
      var dayD = getOrCreateDay(state.selectedDay);
      var exD = findExercise(dayD, detBtn.dataset.id);
      if (!exD) return;
      delete exD.bloc;
      nettoyerBlocs(dayD);
      scheduleSave(state.selectedDay,true);
      renderDayPanel(true);
      renderBandeau();
      return;
    }

    var addSerieBtn = e.target.closest('[data-action="add-serie"]');
    if (addSerieBtn){
      var exId = addSerieBtn.dataset.id;
      var day2 = getOrCreateDay(state.selectedDay);
      var ex2 = findExercise(day2, exId);
      if (!ex2) return;
      if (!ex2.series) ex2.series = [];
      // Recopie la derniere serie : sur 5 series identiques, on ne retape rien.
      // "fait" repart a faux, c'est le seul champ qui ne se duplique pas.
      var last = ex2.series[ex2.series.length - 1];
      // Le type se recopie aussi — on enchaine deux echauffements, jamais
      // deux top sets : apres un top set la serie suivante repart neutre.
      var typeSuivant = (last && last.type && last.type !== TS.TYPES.TOP) ? last.type : undefined;
      var newSerie = last
        ? { id:genSerieId(), poids:last.poids, reps:last.reps, rpe:last.rpe, vitesse:last.vitesse, inclinaison:last.inclinaison, repos:last.repos, type:typeSuivant, fait:false }
        : { id:genSerieId(), poids:null, reps:'', rpe:null, repos:'', fait:false };
      ex2.series.push(newSerie);
      serieOuverte[ex2.id] = newSerie.id;
      // La ligne s'ajoute a la carte, sans rien refaire autour. Refaire le
      // panneau supprimait le champ ou l'on venait de taper — sur iPhone,
      // un appui sur un bouton ne le quitte pas —, et Safari renvoyait la
      // page tout en haut. Pas de clavier non plus : la serie est deja
      // remplie, et − / + corrigent le poids sans lui.
      var carteS = addSerieBtn.closest('.ex-card');
      var listeS = carteS && carteS.querySelector('.series-list');
      if (ex2.series.length === 1 || !listeS) repeindreCarte(carteS, ex2);
      else {
        lacherFocus(carteS);
        var pS = precedentDe(ex2);
        var tmpS = document.createElement('div');
        tmpS.innerHTML = serieRowHTML(newSerie, ex2.series.length - 1, ex2, estAuTemps(ex2), pS && pS.prec, true);
        listeS.appendChild(tmpS.firstChild);
        ouvrirSerie(carteS, newSerie.id);
      }
      scheduleSave(state.selectedDay,true);
      renderBandeau();
      var ligneS = exListEl.querySelector('.serie-card[data-serie-id="'+newSerie.id+'"]');
      if (ligneS && ligneS.scrollIntoView) ligneS.scrollIntoView({ block:'nearest' });
      return;
    }

    var delSerieBtn = e.target.closest('[data-action="del-serie"]');
    if (delSerieBtn){
      var serieId = delSerieBtn.dataset.serieId;
      var day3 = getOrCreateDay(state.selectedDay);
      var found3 = findSerie(day3, serieId);
      if (!found3) return;
      found3.exercise.series = found3.exercise.series.filter(function(s){ return s.id!==serieId; });
      scheduleSave(state.selectedDay,true);
      renderDayPanel(true);
      renderBandeau();
      return;
    }

    var faitBtn = e.target.closest('[data-action="toggle-fait"]');
    if (faitBtn){
      var serieId2 = faitBtn.dataset.serieId;
      var day4 = getOrCreateDay(state.selectedDay);
      var found4 = findSerie(day4, serieId2);
      if (!found4) return;
      found4.serie.fait = !found4.serie.fait;
      scheduleSave(state.selectedDay,true);
      // Cochee : le repos d'avant s'arrete, le sien commence. Decochee : son
      // repos est annule.
      if (found4.serie.fait){
        finirRepos(true);
        lancerRepos(state.selectedDay, serieId2);
      } else if (repos && repos.serieId === serieId2) finirRepos(false);
      // Faite, la serie se replie et la suivante s'ouvre ; decochee, elle
      // se rouvre pour qu'on la corrige.
      if (found4.serie.fait){
        if (serieOuverte[found4.exercise.id] === serieId2) delete serieOuverte[found4.exercise.id];
      } else serieOuverte[found4.exercise.id] = serieId2;
      repeindreCarte(faitBtn.closest('.ex-card'), found4.exercise);
      return;
    }

    var menuBtn = e.target.closest('[data-action="menu-exo"]');
    if (menuBtn){
      var carteM = menuBtn.closest('.ex-card');
      var ouvert = carteM.classList.toggle('menu-ouvert');
      menuBtn.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
      return;
    }

    // Le commentaire d'une serie : depuis sa barre d'outils, ou depuis
    // « + COMMENTAIRE », qui vise la derniere serie faite — celle dont on
    // sort, au moment ou on y pense.
    var noteBtn = e.target.closest('[data-action="note-serie"], [data-action="ajout-note"]');
    if (noteBtn){
      var dayN = getOrCreateDay(state.selectedDay);
      var cibleN = null;
      if (noteBtn.dataset.serieId) cibleN = findSerie(dayN, noteBtn.dataset.serieId);
      else {
        var exN = findExercise(dayN, noteBtn.dataset.id);
        var liste = (exN && exN.series) || [];
        var faites = liste.filter(function(s){ return s.fait; });
        var remplies = liste.filter(hasData);
        var s = faites[faites.length - 1] || remplies[remplies.length - 1] || liste[liste.length - 1];
        if (s) cibleN = { exercise: exN, serie: s };
      }
      if (!cibleN) return;
      var ligneN = exListEl.querySelector('.serie-card[data-serie-id="' + cibleN.serie.id + '"]');
      if (!ligneN) return;
      var champ = ligneN.querySelector('.serie-note');
      if (!champ){
        var num = Array.prototype.slice.call(ligneN.parentNode.querySelectorAll('.serie-card')).indexOf(ligneN) + 1;
        ligneN.insertAdjacentHTML('beforeend', noteSerieHTML(cibleN.serie, num));
        champ = ligneN.querySelector('.serie-note');
      }
      champ.focus();
      return;
    }
  });

  // Toucher une serie l'ouvre : sa barre d'outils (pas de 2,5 kg, repos,
  // commentaire, suppression) vient avec elle. Sans rendu : le champ garde
  // le focus et le clavier reste ouvert.
  // Seuls un champ ou un menu ouvrent : un bouton qui prend le focus (Chrome
  // le lui donne a l'appui) deplacerait la barre entre l'appui et le
  // relachement, et l'appui tomberait a cote — la coche ou PRÉC. ne
  // repondraient pas.
  exListEl.addEventListener('focusin', function(e){
    if (!/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    var ligne = e.target.closest && e.target.closest('.serie-card');
    if (!ligne || ligne.classList.contains('ouverte')) return;
    ouvrirSerie(ligne.closest('.ex-card'), ligne.dataset.serieId);
  });

  // Un commentaire ouvert puis laisse vide disparait : pas de ligne morte.
  exListEl.addEventListener('focusout', function(e){
    var t = e.target;
    if (!t.classList || !t.classList.contains('serie-note') || t.value.trim()) return;
    var ligne = t.closest('.serie-note-ligne');
    if (ligne) ligne.remove();
  });

  // Un nom tape a la main ("bench leger") rejoint la liste de suggestions
  // au moment ou l'utilisateur quitte le champ, pas a chaque frappe.
  exListEl.addEventListener('focusout', function(e){
    var t = e.target;
    if (!t.classList || !t.classList.contains('ex-name')) return;
    var day = getOrCreateDay(state.selectedDay);
    var ex = findExercise(day, t.dataset.id);
    if (!ex || !ex.nom) return;
    // Le nom est-il deja connu AVANT qu'on l'enregistre ? C'est la seule
    // fenetre ou la question « c'est le meme exercice ? » a un sens.
    var etaitConnu = !!CUSTOM_PAR_CLE[cleExo(ex.nom)] ||
                     !!EXERCISE_DB_LOWER[String(ex.nom).trim().toLowerCase()];
    if (rememberExercise(ex.nom, ex.groupe)) populateDatalist();
    if (!etaitConnu) proposerRattachement(t.closest('.ex-card'), ex);
    majSuggestions();
  });

  // Affiche la proposition dans la carte, sans re-render : re-dessiner ferait
  // perdre le focus et la position de scroll au moment precis ou l'utilisateur
  // est en train de saisir.
  //
  // Deux questions, et une seule a la fois : « c'est le meme exercice que … ? »
  // quand quelque chose ressemble, sinon « on le garde comme nouvel exercice ».
  // Les deux sorties sont toujours ecrites en toutes lettres : avant, la carte
  // annoncait juste « ajoute a tes exercices » et personne ne savait qu'on
  // pouvait le rattacher.
  function proposerRattachement(card, ex){
    if (!card) return;
    var vieux = card.querySelector('.alias-prompt');
    if (vieux) vieux.remove();
    var choix = candidatsAlias(ex.nom);
    var liste = tousLesExos(cleExo(ex.nom));
    if (!choix.length && !liste.length) return;
    var syn = synonymeDe(ex.nom);

    var box = document.createElement('div');
    box.className = 'alias-prompt';
    box.dataset.pour = cleExo(ex.nom);
    box.dataset.syn = syn ? '1' : '0';
    var nomAffiche = normalizeName(ex.nom);
    var html = '<p><b>« ' + esc(nomAffiche) + ' »</b> n\'est pas encore dans tes exercices.</p>';
    if (syn){
      // Une abreviation connue : le plus souvent, c'est le nom entier qu'on veut.
      html += '<p class="alias-question">C\'est <b>' + esc(syn) + '</b>&nbsp;?</p>'
           +  '<button type="button" class="alias-choix" data-action="renommer" data-nom="' + esc(syn) + '">OUI : ' + esc(syn.toUpperCase()) + '</button>'
           +  '<button type="button" class="alias-choix alias-lien" data-cle="' + esc(cleExo(syn)) + '">GARDER « ' + esc(nomAffiche.toUpperCase()) +' » ET LE RELIER</button>';
    } else if (choix.length){
      html += '<p class="alias-question">C\'est le même exercice que&nbsp;?</p>';
      choix.forEach(function(c){
        var quand = '';
        if (c.quand){
          var d = fromDateStr(c.quand);
          quand = ' <span style="color:var(--dim);font-weight:700;">· ' + d.getDate() + ' ' + MONTH_ABBR[d.getMonth()] + '</span>';
        }
        html += '<button type="button" class="alias-choix alias-lien" data-cle="' + esc(c.cle) + '">' + esc(c.nom) + quand + '</button>';
      });
    }
    html += '<button type="button" class="alias-choix alias-garder" data-action="garder">'
         +    (syn || choix.length ? 'NON, C\'EST UN NOUVEL EXERCICE' : 'L\'AJOUTER À MES EXERCICES') + '</button>'
         +  '<button type="button" class="alias-non" data-action="ouvrir-liste">LE RELIER À UN EXERCICE EXISTANT…</button>'
         +  '<div class="alias-liste" hidden>'
         +    '<select class="alias-select" aria-label="Exercice auquel rattacher ce nom">'
         +      '<option value="">Choisis l\'exercice…</option>'
         +      liste.map(function(c){ return '<option value="' + esc(c.cle) + '">' + esc(c.nom) + '</option>'; }).join('')
         +    '</select>'
         +    '<button type="button" class="alias-choix" data-action="rattacher">RATTACHER</button>'
         +  '</div>';
    box.innerHTML = html;

    function relier(cle){
      definirAlias(ex.nom, cle);
      var g = groupeCanonique(ex.nom); if (g) ex.groupe = g;
      scheduleSave(state.selectedDay, true);
      box.remove();
      // L'historique change de sens d'un coup : « derniere fois », records et
      // recap doivent refleter le rattachement tout de suite.
      renderDayPanel(true);
      renderBandeau();
      showToast('« ' + nomAffiche + ' » rejoint ton historique');
    }

    box.addEventListener('click', function(e){
      var lien = e.target.closest('.alias-lien[data-cle]');
      if (lien){ relier(lien.dataset.cle); return; }

      var ren = e.target.closest('[data-action="renommer"]');
      if (ren){
        // Renommer plutot que rattacher : un seul nom dans le carnet, donc un
        // seul historique, et rien a expliquer plus tard.
        var neuf = ren.dataset.nom;
        // L'abreviation reste, rattachee au vrai nom : la prochaine fois
        // qu'on tape « RDL », l'app sait de quoi il s'agit, et l'historique
        // ne se coupe pas en deux. (Un nom efface ici reviendrait du cloud :
        // la synchro des noms fusionne, elle ne supprime pas.)
        definirAlias(ex.nom, cleExo(neuf));
        ex.nom = neuf;
        var gr = findExerciseMatch(neuf); if (gr) ex.groupe = gr;
        scheduleSave(state.selectedDay, true);
        box.remove();
        renderDayPanel(true);
        renderBandeau();
        showToast('Renommé en « ' + neuf + ' »');
        return;
      }

      if (e.target.closest('[data-action="garder"]')){
        definirAlias(ex.nom, null);
        box.remove();
        showToast('« ' + nomAffiche + ' » est dans tes exercices');
        return;
      }
      if (e.target.closest('[data-action="ouvrir-liste"]')){
        box.querySelector('.alias-liste').hidden = false;
        e.target.closest('[data-action="ouvrir-liste"]').hidden = true;
        return;
      }
      if (e.target.closest('[data-action="rattacher"]')){
        var sel = box.querySelector('.alias-select');
        if (!sel.value){ sel.focus(); return; }
        relier(sel.value);
        return;
      }
      if (e.target.closest('.alias-non')){
        definirAlias(ex.nom, null);
        box.remove();
      }
    });

    // En tete du corps de la carte : le groupe musculaire est remonte dans
    // l'en-tete, et inserer « apres lui » jetait une erreur.
    var corps = card.querySelector('.ex-body');
    if (corps) corps.insertBefore(box, corps.firstChild);
  }

  // ---------- l'ecran de fin de seance ----------
  // Trois temps sur le meme ecran : la question, une seconde de chargement,
  // puis le bilan qui se pose ligne par ligne. Le chargement n'est pas du
  // decor : il separe « je valide » de « voici ce que j'ai fait », et evite
  // que les chiffres apparaissent avant qu'on ait fini d'appuyer.
  var bilanEcran = document.getElementById('bilanEcran');
  var bilanCorps = document.getElementById('bilanCorps');
  var bilanJour = null;

  function ouvrirEcranFin(ds, direct){
    bilanJour = ds;
    bilanEcran.hidden = false;
    document.body.classList.add('en-bilan');
    // Revoir le bilan passe aussi par la barre, en plus court : le meme
    // geste, le meme moment. Sans serie notee, rien a charger.
    if (!direct) demanderFin(ds);
    else if (bilanDuJour(ds)) chargerPuisBilan(ds, true);
    else montrerBilan(ds);
  }
  function fermerEcranFin(){
    bilanEcran.hidden = true;
    bilanCorps.innerHTML = '';
    document.body.classList.remove('en-bilan');
  }

  function demanderFin(ds){
    var day = state.sessions[ds] || { exercises:[] };
    var restantes = 0;
    (day.exercises || []).forEach(function(e){
      (e.series || []).forEach(function(s){ if (hasData(s) && !s.fait) restantes++; });
    });
    bilanCorps.innerHTML = '<div class="bilan-demande">'
      + '<h2 class="bilan-question" id="bilanTitre">C\'est fini pour aujourd\'hui&nbsp;?</h2>'
      + '<p class="bilan-sous">On valide ta séance, et on regarde ce que tu viens de faire.</p>'
      + (restantes
          ? '<p class="bilan-alerte">' + restantes + (restantes > 1 ? ' séries notées ne sont pas cochées' : ' série notée n\'est pas cochée')
            + '. Elles comptent quand même dans le bilan.</p>'
          : '')
      + '<button type="button" class="btn-sheet primary" id="finOui">OUI, C\'EST PLIÉ</button>'
      + '<button type="button" class="btn-sheet" id="finNon">PAS ENCORE</button>'
      + '</div>';
  }

  function validerFin(ds){
    finirRepos(false);
    marquerSeanceFinie(ds, new Date().toISOString());
    renderBandeau();
    majBoutonFin(ds);
    chargerPuisBilan(ds);
  }

  // Le chargement charge une barre : un disque par exercice, a la couleur de
  // son groupe, le plus haut pour celui qui a le plus pese. Les compteurs
  // montent pendant que les noms defilent, puis la barre se leve. Un appui
  // passe directement au bilan : on ne fait pas attendre qui a compris.
  // Assez lent pour qu'on voie chaque disque se poser : ca doit ressembler a
  // un vrai chargement, pas a un flash (3,2 s).
  // rapide : pour revoir un bilan deja vu, la meme scene plus vite (2 s).
  var minuteurBilan = null;
  function chargerPuisBilan(ds, rapide){
    var day = state.sessions[ds] || { exercises:[] };
    var exos = (day.exercises || []).map(function(e){
      var vol = 0, n = 0;
      (e.series || []).forEach(function(s){
        if (!hasData(s)) return;
        n++;
        vol += (typeof s.poids === 'number' ? s.poids : 0) * (parseInt(s.reps, 10) || 0);
      });
      return { nom: (e.nom || '').trim() || 'Exercice', groupe: e.groupe, vol: vol, n: n };
    }).filter(function(x){ return x.n; });
    var volMax = exos.reduce(function(m, x){ return Math.max(m, x.vol); }, 0);
    // Les memes chiffres que le bilan qui suit : un compteur qui s'arrete sur
    // un autre total que la tuile d'apres ferait douter des deux.
    var b = bilanDuJour(ds);
    var nSeries = b ? b.series : 0;
    var nExos = b ? b.exos : 0;
    var disques = exos.slice(0, 5).map(function(x, i){
      var h = volMax ? 46 + Math.round(54 * x.vol / volMax) : 70;
      return '<i class="disque" style="--h:' + h + 'px;--c:' + (GROUP_COLORS[x.groupe] || GROUP_COLORS.Autre) + ';--i:' + i + '"></i>';
    }).join('');
    // Le collier claque apres le dernier disque : --n donne son tour.
    var nDisques = Math.max(1, Math.min(exos.length, 5));
    function cote(sens){
      return '<div class="barre-cote ' + sens + '" style="--n:' + nDisques + '"><div class="disques">' + disques + '</div><i class="collier"></i></div>';
    }
    bilanCorps.innerHTML = '<div class="bilan-chargement' + (rapide ? ' rapide' : '') + '" role="status">'
      + '<div class="barre-scene" aria-hidden="true">'
      +   '<i class="barre-ombre"></i>'
      +   '<div class="barre-leve">' + cote('gauche') + '<div class="barre-tige"></div>' + cote('droite') + '</div>'
      + '</div>'
      + '<p class="barre-compteurs"><b data-vers="' + nSeries + '">0</b> ' + (nSeries > 1 ? 'séries' : 'série')
      +   ' · <b data-vers="' + nExos + '">0</b> ' + (nExos > 1 ? 'exos' : 'exo') + '</p>'
      + '<p class="barre-defile" aria-hidden="true">' + esc(exos.length ? exos[0].nom : '') + '</p>'
      + '<p class="barre-passer">Touche pour voir ton bilan</p>'
      + '</div>';
    var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var duree = reduit ? 600 : (rapide ? 2000 : 3200);
    var debut = performance.now();
    var scene = bilanCorps.querySelector('.bilan-chargement');
    var compteurs = scene.querySelectorAll('.barre-compteurs b');
    var defile = scene.querySelector('.barre-defile');
    function image(t){
      if (bilanJour !== ds || bilanEcran.hidden || !scene.isConnected) return;
      var k = reduit ? 1 : Math.max(0, Math.min(1, (t - debut) / (duree * 0.8)));
      var ease = 1 - Math.pow(1 - k, 3);
      compteurs.forEach(function(el){ el.textContent = Math.round(Number(el.dataset.vers) * ease).toLocaleString('fr-FR'); });
      if (exos.length > 1) defile.textContent = exos[Math.min(exos.length - 1, Math.floor(k * exos.length))].nom;
      if (k < 1) requestAnimationFrame(image); else scene.classList.add('leve');
    }
    requestAnimationFrame(image);
    clearTimeout(minuteurBilan);
    minuteurBilan = setTimeout(function(){ passerAuBilan(ds); }, duree);
  }
  function passerAuBilan(ds){
    clearTimeout(minuteurBilan);
    minuteurBilan = null;
    if (bilanJour === ds && !bilanEcran.hidden && bilanCorps.querySelector('.bilan-chargement')) montrerBilan(ds);
  }

  function montrerBilan(ds){
    var b = bilanDuJour(ds);
    if (!b){
      bilanCorps.innerHTML = '<div class="bilan-demande"><h2 class="bilan-question" id="bilanTitre">Rien à afficher</h2>'
        + '<p class="bilan-sous">Cette séance n\'a aucune série notée.</p>'
        + '<button type="button" class="btn-sheet" id="finFermer">FERMER</button></div>';
      return;
    }
    var d = fromDateStr(ds);
    var html = '<div class="bilan-fini">'
      + '<p class="bilan-tag anim" style="--i:0">SÉANCE TERMINÉE</p>'
      + '<h2 class="bilan-titre anim" id="bilanTitre" style="--i:1">' + esc(b.titre) + '</h2>'
      + '<p class="bilan-date anim" style="--i:1">' + esc(majuscule(DAY_NAMES[(d.getDay()+6)%7]) + ' ' + d.getDate() + ' ' + MONTH_NAMES[d.getMonth()]) + '</p>';
    var c = b.comparaison;
    if (c){
      var n = c.lignes.length;
      html += '<div class="bilan-volume anim" style="--i:2">'
        +   '<span class="bilan-volume-num" data-compteur="' + c.hausse + '">0</span>'
        +   '<span class="bilan-volume-unite">sur ' + n + (n > 1 ? ' exos' : ' exo') + ' en hausse par rapport à ' + esc(jourDe(c.ds)) + '</span>'
        + '</div>';
    }
    html += '<div class="bilan-tuiles anim" style="--i:3">'
      +   '<div class="bilan-tuile"><b>' + b.series + '</b><span>' + (b.series > 1 ? 'SÉRIES' : 'SÉRIE') + '</span></div>'
      +   '<div class="bilan-tuile"><b>' + b.exos + '</b><span>' + (b.exos > 1 ? 'EXOS' : 'EXO') + '</span></div>'
      +   '<div class="bilan-tuile' + (b.records ? ' or' : '') + '"><b>' + b.records + '</b><span>' + (b.records > 1 ? 'RECORDS' : 'RECORD') + '</span></div>'
      + '</div>';

    if (c){
      html += '<div class="bilan-bloc anim" style="--i:4">'
        + '<div class="bilan-bloc-tete">PAR RAPPORT À ' + esc(jourDe(c.ds).toUpperCase()) + '</div>'
        + c.lignes.map(function(l){
            return '<div class="bilan-ligne bilan-compare"><b>' + esc(l.nom) + '</b>'
              + '<span>' + esc(l.texte) + (l.texte === l.avant ? ', comme ce jour-là' : ' contre ' + esc(l.avant)) + '</span>'
              + '<i class="bilan-sens ' + l.sens + '">' + sensTexte(l) + '</i></div>';
          }).join('')
        + '<div class="bilan-bloc-note">Séance « ' + esc(titreSeance(c.ds)) + ' », comparée sur le 1RM estimé (ou la durée tenue)</div>'
        + '</div>';
    }
    if (b.top){
      html += '<div class="bilan-bloc anim" style="--i:5">'
        + '<div class="bilan-bloc-tete">TOP SET DU JOUR</div>'
        + '<div class="bilan-ligne"><b>' + esc(b.top.nom) + '</b><span>' + esc(b.top.texte) + '</span></div>'
        + '<div class="bilan-bloc-note">1RM estimé : ' + esc(formatWeight(Math.round(b.top.rm))) + ' kg</div>'
        + '</div>';
    }
    if (b.progres.length){
      html += '<div class="bilan-bloc vert anim" style="--i:6">'
        + '<div class="bilan-bloc-tete">MIEUX QUE LA DERNIÈRE FOIS</div>'
        + b.progres.slice(0, 4).map(function(p){
            return '<div class="bilan-ligne"><b>' + esc(p.nom) + '</b><span>' + esc(p.texte) + '</span></div>';
          }).join('')
        + '</div>';
    }
    html += '<p class="bilan-mot anim" style="--i:7">«\u00a0' + esc(b.mot) + '\u00a0»</p>'
      + '<button type="button" class="btn-sheet primary anim" style="--i:8" id="finFiche">VOIR LA FICHE DE LA SÉANCE</button>'
      + '<button type="button" class="btn-sheet anim" style="--i:8" id="finFermer">FERMER</button>'
      + '</div>';
    bilanCorps.innerHTML = html;
    animerCompteur(bilanCorps.querySelector('[data-compteur]'));
  }

  // Le volume monte de 0 a sa valeur : c'est le chiffre qu'on retient, et le
  // voir grimper dit « tout ca, aujourd'hui ». Coupe quand l'appareil demande
  // moins d'animation.
  function animerCompteur(el){
    if (!el) return;
    var cible = Number(el.dataset.compteur) || 0;
    var sobre = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (sobre || cible <= 0){ el.textContent = formatWeight(cible); return; }
    var debut = 0, duree = 900;
    function pas(t){
      if (!debut) debut = t;
      var k = Math.min(1, (t - debut) / duree);
      // Ralentit a l'arrivee : le dernier chiffre se lit.
      var val = Math.round(cible * (1 - Math.pow(1 - k, 3)));
      el.textContent = formatWeight(val);
      if (k < 1) requestAnimationFrame(pas);
    }
    requestAnimationFrame(pas);
  }

  document.getElementById('finZone').addEventListener('click', function(e){
    if (e.target.closest('#finBtn')) ouvrirEcranFin(state.selectedDay, false);
    else if (e.target.closest('#finRevoir')) ouvrirEcranFin(state.selectedDay, true);
  });
  bilanEcran.addEventListener('click', function(e){
    if (e.target.closest('#finOui')) validerFin(bilanJour);
    else if (e.target.closest('#finNon') || e.target.closest('#finFermer')) fermerEcranFin();
    else if (e.target.closest('#finFiche')){
      var ds = bilanJour;
      fermerEcranFin();
      ouvrirSeance(ds);
    }
    else if (e.target.closest('.bilan-chargement')) passerAuBilan(bilanJour);
  });

  // On reprend d'abord ce qu'on a deja fait : l'historique.
  document.getElementById('reprendreBtn').addEventListener('click', function(){
    seancesOnglet = 'histo';
    montrerVue('seances');
    window.scrollTo(0, 0);
  });
  document.getElementById('recapJourBtn').addEventListener('click', function(){
    ouvrirSeance(state.selectedDay);
  });
  document.getElementById('exoRetour').addEventListener('click', function(){
    montrerVue(state.exoRetour === 'seance' ? 'seance' : state.exoRetour);
    window.scrollTo(0, 0);
  });

  document.getElementById('exoDetail').addEventListener('click', function(e){
    var p = e.target.closest('[data-periode]');
    if (p){
      state.exoPeriode = p.dataset.periode;
      renderExerciceDetail();
      return;
    }
    var j = e.target.closest('[data-jour]');
    if (j) ouvrirSeance(j.dataset.jour);
  });

  document.getElementById('seanceRetour').addEventListener('click', function(){
    montrerVue(state.ficheRetour || 'seances');
    window.scrollTo(0, 0);
  });
  document.getElementById('seancesListe').addEventListener('click', function(e){
    var o = e.target.closest('[data-ouvrir]');
    if (o) ouvrirSeance(o.dataset.ouvrir);
  });

  document.getElementById('seanceCreer').addEventListener('click', function(){
    var champ = document.getElementById('seanceDate');
    var ds = champ.value;
    if (!ds){ showToast('Choisis une date'); champ.focus(); return; }
    // Creer une seance qui existe deja, c'est simplement l'ouvrir : on ne
    // detruit jamais ce qui est note, meme si l'utilisateur insiste.
    var existante = state.sessions[ds] && (state.sessions[ds].exercises || []).length > 0;
    getOrCreateDay(ds);
    persistDay(ds);
    modifierSeance(ds);
    showToast(existante ? 'Cette séance existait déjà — la voici' : 'Séance créée — ajoute tes exercices');
  });
  document.getElementById('seanceDetail').addEventListener('click', function(e){
    if (e.target.closest('#ficheTitre') || e.target.closest('#ficheCrayon')){
      editerTitreFiche();
      return;
    }
    if (e.target.closest('#ficheModifier')){
      modifierSeance(state.seanceOuverte);
      return;
    }
    var ajout = e.target.closest('[data-ajout-jour]');
    if (ajout){
      var nomA = ajouterAuJour(state.seanceOuverte, ajout.dataset.ajoutJour);
      if (nomA) marquerAjoute(ajout, nomA);
      return;
    }
    var exoBtn = e.target.closest('[data-exo]');
    if (exoBtn && exoBtn.dataset.exo){
      ouvrirExercice(exoBtn.dataset.exo, 'seance');
      return;
    }
    if (!e.target.closest('#ficheSelectionner')) return;
    var ds = state.seanceOuverte;
    if (!ds || ds === state.selectedDay) return;
    var n = selectionnerSeance(ds);
    if (!n){ showToast('Cette séance est vide'); return; }
    scheduleSave(state.selectedDay, true);
    populateDatalist();
    allerAuJour(state.selectedDay);
    showToast(n + (n > 1 ? ' exercices ajoutés' : ' exercice ajouté'));
  });

  document.getElementById('addExerciseBtn').addEventListener('click', function(){
    var day = getOrCreateDay(state.selectedDay);
    var newEx = { id:genId(), nom:'', groupe:'Autre', repos:'', series:[{ id:genSerieId(), poids:null, reps:'', rpe:null, repos:'', fait:false }] };
    day.exercises.push(newEx);
    scheduleSave(state.selectedDay,true);
    renderDayPanel(true);
    renderBandeau();
    requestAnimationFrame(function(){
      var el = exListEl.querySelector('.ex-name[data-id="'+newEx.id+'"]');
      if (el) el.focus();
    });
  });

  // ---------- init ----------
  function populateDatalist(){
    var seen = {};
    var names = Object.keys(EXERCISE_DB).concat(Object.keys(customExercises))
      .filter(function(x){ var k=x.toLowerCase(); if (seen[k]) return false; seen[k]=1; return true; })
      .sort(function(a,b){ return a.localeCompare(b,'fr'); });
    document.getElementById('exerciseList').innerHTML = names.map(function(n){ return '<option value="'+esc(n)+'">'; }).join('');
  }

  function normalizeLocal(sessions){
    Object.keys(sessions).forEach(function(ds){
      sessions[ds].exercises = (sessions[ds].exercises||[]).map(normalizeExercise);
    });
    return sessions;
  }

  function init(){
    populateDatalist();
    renderSeanceJour(true);
    var local = loadLocal();
    if (local) state.sessions = normalizeLocal(local);
    state.loading = false;
    renderAll();
    Sync.demarrer();
  }


  // ---------- sauvegarde / restauration ----------
  // Le localStorage n'est pas une sauvegarde : il vit dans un seul navigateur,
  // sur un seul appareil, et disparait avec lui. Ces fonctions produisent un
  // fichier que l'utilisateur garde chez lui, et savent le relire.
  function backupPayload(){
    return { app:'topset', version:2, exportedAt:new Date().toISOString(),
             sessions:state.sessions, customExercises:customExercises };
  }
  function backupJSON(){ return JSON.stringify(backupPayload(), null, 2); }
  function backupFilename(){ return 'topset-' + toDateStr(new Date()) + '.json'; }

  // Le JSON est la sauvegarde : lui seul sait tout remettre en place. Le CSV
  // ne sert qu'a relire ailleurs — une ligne par serie, point-virgule en
  // separateur et virgule decimale, parce que c'est ce qu'attend un Excel
  // configure en francais.
  // Le commentaire vient en dernier : un tableur fait avec l'ancien export
  // reste lisible, et une colonne ajoutee a droite ne decale rien. C'est
  // celui de la serie de la ligne : une ligne par serie, un commentaire par
  // serie.
  var CSV_COLONNES = ['Date','Jour','Exercice','Groupe','Serie','Poids (kg)',
                      'Repetitions','RPE','Repos (s)','Volume (kg)','Fait','Commentaire',
                      'Vitesse (km/h)','Inclinaison (%)'];
  function csvChamp(v){
    var t = (v == null) ? '' : String(v);
    return /[";\r\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
  }
  // Excel et LibreOffice evaluent une cellule qui commence par = + - @ comme
  // une formule. Un nom d'exercice est du texte : on le prefixe d'une
  // apostrophe, que les deux tableurs lisent comme « ceci reste du texte ».
  //
  // Seules les colonnes de texte passent ici. Les colonnes numeriques sortent
  // de csvNombre(), qui n'emet que des chiffres, un signe et une virgule :
  // prefixer « -50 » en ferait du texte dans le tableur, et ce serait une
  // regression pour une charge negative parfaitement legitime.
  //
  // Impact sur le format : une cellule dont le contenu commence reellement par
  // l'un de ces caracteres s'affiche avec une apostrophe devant. Le retour
  // dans Top Set la retire (texteCsv, dans intelligence.js).
  function csvTexte(v){
    var t = (v == null) ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;
    return csvChamp(t);
  }
  function csvNombre(n){
    return (typeof n === 'number' && !isNaN(n)) ? String(n).replace('.', ',') : '';
  }
  function csvContent(){
    var lignes = [CSV_COLONNES.join(';')];
    Object.keys(state.sessions).sort().forEach(function(ds){
      var day = state.sessions[ds];
      if (!day) return;
      var d = new Date(ds + 'T00:00:00');
      var jour = DAY_NAMES[(d.getDay() + 6) % 7] || '';
      (day.exercises || []).forEach(function(ex){
        var n = 0;
        (ex.series || []).forEach(function(s){
          if (!serieRemplie(s)) return;
          n++;
          lignes.push([
            csvChamp(ds), csvChamp(jour),
            csvTexte(ex.nom || ''), csvTexte(ex.groupe || ''),
            csvChamp(n),
            csvChamp(csvNombre(s.poids)), csvTexte(s.reps || ''),
            csvChamp(csvNombre(s.rpe)),
            csvTexte(s.repos || ''), csvChamp(csvNombre(serieVolume(s))),
            csvChamp(s.fait ? 'oui' : 'non'),
            csvTexte((s.note || '').trim()),
            csvChamp(csvNombre(s.vitesse)), csvChamp(csvNombre(s.inclinaison))
          ].join(';'));
        });
      });
    });
    // Sans ce BOM, Excel lit le fichier en ANSI et massacre les accents.
    return '\ufeff' + lignes.join('\r\n') + '\r\n';
  }
  function csvFilename(){ return 'topset-' + toDateStr(new Date()) + '.csv'; }

  // Une ligne vierge n'est pas une donnee : le compteur doit dire la meme
  // chose que le recap, sinon il annonce des seances qui n'existent pas.
  function serieRemplie(s){
    return !!s && (s.poids != null || (s.reps != null && String(s.reps).trim() !== ''));
  }
  function compterJour(day){
    var n = 0;
    (day && day.exercises || []).forEach(function(ex){
      (ex.series || []).forEach(function(s){ if (serieRemplie(s)) n++; });
    });
    return n;
  }

  function backupStats(){
    var jours = 0, series = 0;
    Object.keys(state.sessions).forEach(function(ds){
      var n = compterJour(state.sessions[ds]);
      if (!n) return;
      jours++; series += n;
    });
    var ko = Math.max(1, Math.round(new Blob([backupJSON()]).size / 1024));
    return { jours:jours, series:series, ko:ko };
  }

  // Les exercices memorises d'un fichier importe etaient recopies tels quels
  // dans l'objet qui sert de dictionnaire a toute l'app : cles arbitraires,
  // valeurs arbitraires. On les repasse au meme moule que ceux que l'app
  // fabrique elle-meme.
  //
  // Le format legacy — « nom: 'Pectoraux' », une simple chaine — est conserve
  // tel quel quand c'est ce qu'on recoit : infoExo() lit les deux formes, et
  // reecrire la structure d'un ancien fichier n'apporterait rien.
  function nettoyerCustom(brut){
    var sortie = {};
    if (!brut || typeof brut !== 'object') return sortie;
    Object.keys(brut).forEach(function(k){
      // JSON.parse fait de « __proto__ » une propriete propre et non le
      // prototype, donc rien n'explose — mais ce n'est pas un nom d'exercice,
      // et ca perturbe tout ce qui itere sur ce dictionnaire.
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') return;
      // Un nom d'exercice devient une cle de ce dictionnaire et une entree de
      // la liste de saisie. Sans borne, un fichier hostile y met un mega-octet.
      var nom = String(k).trim().slice(0, 200);
      if (!nom) return;
      var v = brut[k];
      if (typeof v === 'string'){ sortie[nom] = groupeSur(v); return; }
      var info = infoExo(v, nom);
      sortie[nom] = {
        nom:    String(info.nom || nom).slice(0, 200),
        groupe: groupeSur(info.groupe),
        alias:  info.alias ? String(info.alias).slice(0, 200) : null
      };
      if (typeof info.sousGroupe === 'string') sortie[nom].sousGroupe = info.sousGroupe;
    });
    return sortie;
  }

  // Une sauvegarde de deux ans de seances pese moins d'un mega-octet. Huit
  // laissent une marge confortable et arretent le fichier qui n'est la que
  // pour figer l'onglet — le refus est explicite, pas un plantage.
  var IMPORT_MAX = 8 * 1024 * 1024;

  // Tolere le fichier complet {app,version,sessions} comme une carte de seances nue.
  function parseBackup(text){
    if (typeof text === 'string' && text.length > IMPORT_MAX){
      return { error: 'Fichier trop volumineux (' + Math.round(text.length / 1048576) +
                      ' Mo). La limite est de 8 Mo — une sauvegarde normale en fait moins d\'un.' };
    }
    var data;
    try { data = JSON.parse(text); }
    catch(e){ return { error:"Fichier illisible : ce n'est pas du JSON valide." }; }
    if (!data || typeof data !== 'object') return { error:'Fichier vide.' };
    var sessions = (data.sessions && typeof data.sessions === 'object') ? data.sessions : data;
    var keys = Object.keys(sessions).filter(function(k){ return /^\d{4}-\d{2}-\d{2}$/.test(k); });
    if (!keys.length) return { error:'Aucune s\u00e9ance trouv\u00e9e dans ce fichier.' };
    var clean = {}, series = 0, jours = 0;
    keys.forEach(function(ds){
      var day = sessions[ds];
      if (!day || typeof day !== 'object') return;
      var exs = Array.isArray(day.exercises) ? day.exercises.map(normalizeExercise) : [];
      clean[ds] = { date:ds, exercises:exs };
      // Le titre voyageait dans la sauvegarde sans jamais etre relu :
      // restaurer faisait perdre tous les noms donnes aux seances.
      if (typeof day.titre === 'string' && day.titre.trim()) clean[ds].titre = day.titre.trim().slice(0, 60);
      var n = compterJour(clean[ds]);
      if (n){ jours++; series += n; }
    });
    if (!Object.keys(clean).length) return { error:'Aucune s\u00e9ance exploitable dans ce fichier.' };
    var custom = (data.customExercises && typeof data.customExercises === 'object')
      ? nettoyerCustom(data.customExercises) : null;
    return { sessions:clean, jours:jours, series:series, customExercises:custom };
  }

  // Un fichier JSON de Top Set, ou le tableur qu'il exporte. Les deux passent
  // ensuite par le meme nettoyage : ce qui vient d'un fichier n'est jamais
  // cru sur parole, et le tableur n'a pas de passe-droit.
  function parseImport(text, nom){
    var t = String(text == null ? '' : text);
    if (t.length > IMPORT_MAX) return parseBackup(t);   // meme refus, meme message
    var brut = t.replace(/^\ufeff/, '').replace(/^\s+/, '');
    var csv = /\.csv$/i.test(nom || '') ||
      (brut.charAt(0) !== '{' && brut.charAt(0) !== '[' && /^[^\r\n]*exercice/i.test(brut));
    if (!csv) return parseBackup(t);
    var lu = TS.lireCsvCarnet(t);
    if (lu.erreur) return { error: lu.erreur };
    return parseBackup(JSON.stringify({ sessions: lu.sessions }));
  }

  function fabriqueId(prefixe){ return prefixe === 's' ? genSerieId() : genId(); }

  // Les exercices memorises du fichier qu'on n'a pas encore. Un nom deja
  // connu, quelle que soit sa casse, garde sa version d'ici.
  function customAbsents(custom){
    if (!custom) return [];
    var connus = Object.create(null);
    Object.keys(customExercises).forEach(function(k){ connus[k.toLowerCase()] = 1; });
    Object.keys(EXERCISE_DB).forEach(function(k){ connus[k.toLowerCase()] = 1; });
    return Object.keys(custom).filter(function(k){ return !connus[k.toLowerCase()]; });
  }

  function resumeImport(b, perso){
    var parts = [];
    var jours = b.dates.length;
    if (b.series){
      var surJours = ' sur ' + jours + (jours > 1 ? ' jours' : ' jour');
      // « sur 1 jour que tu n'avais pas » quand tous les jours sont neufs,
      // « (dont 2 que tu n'avais pas) » quand certains existaient deja.
      var neufs = !b.jours ? '' : (b.jours === jours ? ' que tu n\'avais pas'
                                 : ' (dont ' + b.jours + ' que tu n\'avais pas)');
      parts.push(b.series + (b.series > 1 ? ' séries' : ' série') + surJours + neufs);
    } else if (b.exercices){
      parts.push(b.exercices + (b.exercices > 1 ? ' exercices prévus' : ' exercice prévu'));
    }
    if (b.titres) parts.push(b.titres + (b.titres > 1 ? ' titres de séance' : ' titre de séance'));
    if (perso) parts.push(perso + (perso > 1 ? ' exercices mémorisés' : ' exercice mémorisé'));
    return parts.join(', ');
  }

  // Premier temps : on lit, on compare, on dit ce qui va arriver. Rien n'est
  // encore touche. Un import ne remplace plus rien, mais on montre quand meme
  // avant de faire : « 40 séries » quand on en attendait 400, ca se voit ici.
  function preparerImport(text, nom){
    var parsed = parseImport(text, nom);
    if (parsed.error){ disarmImport(); sheetMsg('err', parsed.error); return; }
    var essai = TS.fusionnerCarnets(state.sessions, parsed.sessions, fabriqueId);
    var perso = customAbsents(parsed.customExercises).length;
    var contenu = parsed.jours + (parsed.jours > 1 ? ' jours' : ' jour') + ', ' +
                  parsed.series + (parsed.series > 1 ? ' séries' : ' série');
    if (!essai.bilan.exercices && !essai.bilan.titres && !perso){
      disarmImport();
      sheetMsg('ok', 'Le fichier contient ' + contenu + ' — tout est déjà dans ton carnet. Rien à ajouter.');
      return;
    }
    pendingBackup = parsed;
    var btn = document.getElementById('dataImport');
    btn.classList.add('armed');
    btn.textContent = 'CONFIRMER L\'AJOUT';
    sheetMsg('warn', 'Le fichier contient ' + contenu + '. À ajouter : ' +
      resumeImport(essai.bilan, perso) + '. Rien de ce que tu as déjà ne sera modifié.');
  }

  // Second temps. La fusion est refaite sur le carnet de CET instant : entre
  // l'apercu et la confirmation, une synchro a pu passer.
  function appliquerImport(){
    var parsed = pendingBackup;
    if (!parsed) return;
    var r = TS.fusionnerCarnets(state.sessions, parsed.sessions, fabriqueId);
    state.sessions = r.sessions;
    var absents = customAbsents(parsed.customExercises);
    absents.forEach(function(k){ customExercises[k] = parsed.customExercises[k]; });
    if (absents.length){
      saveCustom();
      rebuildLower();
      if (Sync.marquerExos) Sync.marquerExos();
    }
    saveLocal();
    // Seules les journees qui ont bouge partent vers le compte : le reste
    // du carnet n'a pas change, il n'y a rien a renvoyer.
    r.bilan.dates.forEach(function(ds){
      Sync.marquerSale(ds);
      if (state.sessions[ds] && state.sessions[ds].titre) Sync.marquerTitre(ds);
    });
    populateDatalist();
    renderAll();
    disarmImport();
    document.getElementById('dataPaste').value = '';
    refreshSheet();
    sheetMsg('ok', 'Ajouté : ' + resumeImport(r.bilan, absents.length) + '. Rien n\'a été remplacé.');
    showToast('Ajouté à ton carnet');
  }

  var pendingBackup = null;

  function sheetMsg(kind, text){
    var el = document.getElementById('dataMsg');
    el.className = 'sheet-msg ' + kind;
    el.textContent = text;
    el.hidden = false;
  }
  function disarmImport(){
    pendingBackup = null;
    var b = document.getElementById('dataImport');
    b.classList.remove('armed');
    b.textContent = 'AJOUTER \u00c0 MES DONN\u00c9ES';
  }

  function refreshSheet(){
    majBoutonSecours();
    Sync.majUI();
    var s = backupStats();
    var el = document.getElementById('dataStat');
    if (!s.jours){ el.textContent = 'Aucune donn\u00e9e enregistr\u00e9e pour l\'instant'; return; }
    el.textContent =
      s.jours + (s.jours > 1 ? ' jours' : ' jour') + ' \u00b7 ' +
      s.series + (s.series > 1 ? ' s\u00e9ries' : ' s\u00e9rie') + ' \u00b7 ' + s.ko + ' Ko';
  }
  function majBoutonSecours(){
    var b = document.getElementById('dataRecover');
    var c = copieDeSecours();
    var actuel = backupStats();
    if (!c || c.series <= actuel.series){ b.hidden = true; b.onclick = null; return; }
    b.hidden = false;
    b.textContent = 'R\u00c9CUP\u00c9RER ' + c.jours + (c.jours > 1 ? ' JOURS' : ' JOUR') +
                    ' (' + c.series + (c.series > 1 ? ' S\u00c9RIES' : ' S\u00c9RIE') + ')';
    // Recuperer, c'est importer la copie : ce qui manque revient, et ce qui
    // est la ne bouge pas.
    b.onclick = function(){
      document.getElementById('dataPaste').value = c.texte;
      disarmImport();
      preparerImport(c.texte, '');
    };
  }

  function openDataSheet(){
    fermerFeuilles();
    refreshSheet();
    disarmImport();
    document.getElementById('dataMsg').hidden = true;
    document.getElementById('dataPaste').value = '';
    document.getElementById('dataSheet').hidden = false;
  }
  function closeDataSheet(){ document.getElementById('dataSheet').hidden = true; }

  // Le profil : le compte, le pseudo, le coach. Separe des donnees, qui
  // parlent de fichiers — deux questions differentes, deux portes.
  function openProfil(){
    fermerFeuilles();
    Sync.majUI();
    document.getElementById('profilSheet').hidden = false;
  }
  function closeProfil(){ document.getElementById('profilSheet').hidden = true; }

  // Ouvrir une page depuis une feuille, c'est quitter la feuille.
  function fermerFeuilles(){
    ['dataSheet', 'profilSheet', 'retourSheet'].forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.hidden = true;
    });
  }

  // ==================================================================
  // RETOURS
  // ==================================================================
  // Un retour n'est pas un ticket : personne ne s'engage a repondre sous
  // 24 heures. C'est un mot laisse a celui qui fait l'app, et c'est ce que
  // dit l'ecran.
  var retourType = 'bug';

  function contexteRetour(){
    // Strictement de quoi reproduire un bug, et rien qui vienne du carnet.
    // La contrainte de la table plafonne ce champ a 1000 caracteres : on
    // reste tres en dessous.
    return {
      vue:    state.view || '',
      ecran:  window.innerWidth + 'x' + window.innerHeight,
      nav:    String(navigator.userAgent || '').slice(0, 160),
      pwa:    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ? 1 : 0
    };
  }

  function quandCourt(iso){
    var d = new Date(iso);
    if (isNaN(d)) return '';
    return d.getDate() + ' ' + MONTH_ABBR[d.getMonth()] +
           ' ' + String(d.getHours()).padStart(2, '0') +
           'h' + String(d.getMinutes()).padStart(2, '0');
  }

  var RETOUR_MOT = { bug:'ÇA MARCHE PAS', idee:'IDÉE', question:'QUESTION' };
  var STATUT_MOT = { nouveau:'EN ATTENTE', vu:'LU', traite:'TRAITÉ' };

  function msgRetour(genre, texte){
    var el = document.getElementById('retourMsg');
    el.className = 'sheet-msg ' + genre;
    el.textContent = texte;
    el.hidden = false;
  }

  function majResteRetour(){
    var t = document.getElementById('retourCorps');
    var r = document.getElementById('retourReste');
    var n = t.value.length;
    r.textContent = n ? n + ' / 4000' : '';
  }

  function chargerMesRetours(){
    var bloc  = document.getElementById('retourMiens');
    var liste = document.getElementById('retourListe');
    if (!Sync.estConnecte()){ bloc.hidden = true; return; }
    Sync.mesRetours().then(function(rows){
      if (!rows.length){ bloc.hidden = true; return; }
      liste.innerHTML = rows.map(function(x){
        var st = STATUT_MOT[x.statut] || x.statut;
        return '<div class="retour-mien">'
          + '<div class="retour-mien-tete">'
          +   '<span>' + esc(RETOUR_MOT[x.type] || x.type) + ' · ' + esc(quandCourt(x.cree_le)) + '</span>'
          +   '<span class="retour-statut ' + esc(x.statut) + '">' + esc(st) + '</span>'
          + '</div>'
          + '<div class="retour-mien-corps">' + esc(x.corps) + '</div>'
          + '</div>';
      }).join('');
      bloc.hidden = false;
    }, function(){ bloc.hidden = true; });
  }

  // Deux voix, deux cotes. « moi » depend de qui regarde : le meme fil se
  // lit dans l'autre sens de l'autre cote, et c'est le seul parametre qui
  // change. Un seul rendu pour les quatre points de vue — membre, equipe,
  // coach, coache.
  //
  // Comme dans toutes les messageries, le jour s'ecrit une fois, en
  // intertitre, et chaque bulle ne porte que l'heure.
  function bullesHTML(rows, monAuteur, nomAutre, vide){
    if (!rows.length){
      return '<div class="fil-vide">' + esc(vide || 'Un souci, une question, une idée ? '
           + 'Écris ici, on te répond dans cette conversation.') + '</div>';
    }
    // Le nom ne se met qu'au-dessus de ce que dit l'autre : au-dessus des
    // siens il n'apprend rien, et il double la hauteur du fil pour rien.
    var autre = nomAutre || 'Top Set';
    var jourVu = '';
    return rows.map(function(m){
      // L'accuse automatique parle au nom de l'equipe : il est de son cote
      // du fil, et en face pour le membre. Il le dit, dans les deux cas.
      var sys = m.auteur === 'systeme';
      var moi = sys ? (monAuteur === 'admin') : (m.auteur === monAuteur);
      var qui = sys ? 'Top Set · automatique' : autre;
      var jour = jourConv(m.cree_le), sep = '';
      if (jour && jour !== jourVu){ jourVu = jour; sep = '<div class="conv-jour">' + esc(jour) + '</div>'; }
      return sep + '<div class="bulle' + (moi ? ' moi' : '') + (sys ? ' systeme' : '') + '">'
        + '<div class="bulle-corps">'
        +   (m.retour_id && m.auteur === 'membre' ? '<span class="bulle-tag">RETOUR</span>' : '')
        +   esc(m.corps) + '</div>'
        + '<div class="bulle-quand">' + (moi ? (sys ? 'automatique · ' : '') : esc(qui) + ' · ')
        + esc(heureCourte(m.cree_le)) + '</div>'
        + '</div>';
    }).join('');
  }

  // Fabriquee, jamais stockee : elle disparait d'elle-meme des qu'une reponse
  // arrive, parce qu'alors le dernier message n'est plus de celui qui attend.
  // Apres un retour, le dernier message est l'accuse : pas de bulle en plus,
  // l'accuse dit deja la meme chose.
  function attenteHTML(rows, monAuteur, texte){
    if (!rows.length || rows[rows.length - 1].auteur !== monAuteur) return '';
    return '<div class="bulle bulle-attente"><div class="bulle-corps">'
         + esc(texte || 'On te répond dès que possible.') + '</div></div>';
  }

  function heureCourte(iso){
    var d = new Date(iso);
    return isNaN(d) ? '' : pad2(d.getHours()) + 'h' + pad2(d.getMinutes());
  }
  function memeJour(a, b){ return a.toDateString() === b.toDateString(); }
  // « Aujourd'hui », « Hier », puis la date en toutes lettres.
  function jourConv(iso){
    var d = new Date(iso);
    if (isNaN(d)) return '';
    var auj = new Date();
    if (memeJour(d, auj)) return 'Aujourd\'hui';
    if (memeJour(d, addDays(auj, -1))) return 'Hier';
    return DAY_NAMES[(d.getDay()+6)%7] + ' ' + d.getDate() + ' ' + MONTH_NAMES[d.getMonth()]
         + (d.getFullYear() !== auj.getFullYear() ? ' ' + d.getFullYear() : '');
  }
  // Dans la liste : l'heure si c'est aujourd'hui, « hier », sinon la date.
  function quandListe(iso){
    var d = new Date(iso);
    if (isNaN(d)) return '';
    var auj = new Date();
    if (memeJour(d, auj)) return heureCourte(iso);
    if (memeJour(d, addDays(auj, -1))) return 'hier';
    return d.getDate() + ' ' + MONTH_ABBR[d.getMonth()] + (d.getFullYear() !== auj.getFullYear() ? ' ' + d.getFullYear() : '');
  }

  function ouvrirRetour(){
    document.getElementById('retourMsg').hidden = true;
    majResteRetour();
    var env = document.getElementById('retourEnvoyer');
    if (!Sync.estConnecte()){
      env.disabled = true;
      msgRetour('warn', 'Il faut un compte pour envoyer un retour : c\'est ce qui nous permet de te répondre, et d\'éviter les envois automatiques.');
    } else {
      env.disabled = false;
    }
    chargerMesRetours();
    document.getElementById('retourVersConv').hidden = !Sync.estConnecte();
    document.getElementById('retourSheet').hidden = false;
  }
  function fermerRetour(){ document.getElementById('retourSheet').hidden = true; }

  document.getElementById('lienRetour').addEventListener('click', ouvrirRetour);
  document.getElementById('retourVersMessages').addEventListener('click', function(){
    ouvrirBoite();
  });
  document.getElementById('retourClose').addEventListener('click', fermerRetour);
  document.getElementById('retourSheet').addEventListener('click', function(e){
    if (e.target === this) fermerRetour();
  });
  document.getElementById('retourTypes').addEventListener('click', function(e){
    var b = e.target.closest('.retour-type'); if (!b) return;
    retourType = b.dataset.type;
    this.querySelectorAll('.retour-type').forEach(function(x){ x.classList.toggle('active', x === b); });
  });
  document.getElementById('retourCorps').addEventListener('input', majResteRetour);

  document.getElementById('retourEnvoyer').addEventListener('click', function(){
    var champ = document.getElementById('retourCorps');
    var corps = champ.value.trim();
    if (!corps){ msgRetour('err', 'Écris quelque chose avant d\'envoyer.'); champ.focus(); return; }
    var btn = this, avant = btn.textContent;
    btn.disabled = true; btn.textContent = 'ENVOI…';
    Sync.envoyerRetour(retourType, corps, contexteRetour()).then(function(){
      champ.value = '';
      majResteRetour();
      chargerMesRetours();
      // Le retour vient d'ouvrir une conversation, et la reponse y arrivera :
      // c'est la qu'on emmene la personne. Son message y est deja, suivi de
      // l'accuse de reception — c'est ce qui dit que c'est bien parti.
      showToast('Reçu — la réponse arrivera ici');
      ouvrirConversation(convEquipe());
    }, function(e){
      msgRetour('err', Sync.messageErreur(e));
    }).then(function(){
      btn.disabled = false; btn.textContent = avant;
    });
  });

  // ==================================================================
  // MESSAGES
  // ==================================================================
  // Une seule boite pour toutes les conversations de l'app. Deux tables en
  // base — le support (un membre et l'equipe) et le coaching (un coach et
  // son coache) — parce que le droit d'ecrire ne s'y decide pas pareil. Mais
  // une seule porte a l'ecran : pour la personne, c'est la meme chose,
  // quelqu'un lui a ecrit.
  //
  // Une conversation se decrit par sa table, le cote ou l'on se tient, et
  // l'autre personne :
  //   { type:'support', je:'membre', autre:null }        un membre et l'equipe
  //   { type:'support', je:'admin',  autre:<membre> }    l'equipe et un membre
  //   { type:'coach',   je:'client', autre:<coach> }     un coache et son coach
  //   { type:'coach',   je:'coach',  autre:<coache> }    un coach et un coache
  //
  // Deux inconnus ne peuvent pas s'ecrire : il n'existe entre eux aucun lien
  // qui dise que l'un veut bien lire l'autre. C'est la base qui le refuse,
  // pas cet ecran.
  var conv = null;          // la conversation ouverte, ou null pour la boite
  var convCle = '';         // ce qu'elle affiche : on ne repeint qu'au changement
  var jetonBoite = 0;
  var minuteurMessages = null;
  var COULEUR_CONV = { membre:'var(--orange)', admin:'var(--yellow)', client:'var(--blue)', coach:'var(--green)' };

  function convEquipe(){
    return { type:'support', je:'membre', autre:null, nom:'Top Set', role:'L\'ÉQUIPE' };
  }

  // Ouvrir la boite recompte aussi la pastille : elle doit dire ce que la
  // liste montre, pas ce qui etait vrai il y a une minute.
  function ouvrirBoite(){
    fermerFeuilles();
    conv = null;
    montrerVue('messages');
    window.scrollTo(0, 0);
    majBadgeMessages(true);
  }

  // « depuis » : la page ou revenir. Sans elle, le retour mene a la boite.
  function ouvrirConversation(c, depuis){
    fermerFeuilles();
    conv = c;
    conv.depuis = depuis || null;
    convCle = '';
    document.getElementById('convFil').innerHTML = '<div class="fil-vide">' + attente() + '</div>';
    document.getElementById('convCorps').value = '';
    ajusterChamp();
    document.getElementById('convMsg').hidden = true;
    montrerVue('messages');
  }

  function renderMessages(){
    var liste = document.getElementById('messagesListe');
    var bloc  = document.getElementById('conv');
    document.body.classList.toggle('en-conv', !!conv && Sync.estConnecte());
    if (!Sync.estConnecte()){
      conv = null;
      document.getElementById('messagesTitre').textContent = 'MESSAGES';
      bloc.hidden = true;
      liste.hidden = false;
      liste.innerHTML = '<div class="seances-vide">Les messages demandent un compte : c\'est lui qui dit '
        + 'à qui tu écris, et qui peut te répondre. Sans compte, ton carnet marche exactement pareil.</div>'
        + '<button type="button" class="btn-sheet primary" id="messagesConnexion">SE CONNECTER OU CRÉER UN COMPTE</button>';
      return;
    }
    if (conv){
      liste.hidden = true;
      bloc.hidden = false;
      renderConv();
    } else {
      bloc.hidden = true;
      liste.hidden = false;
      document.getElementById('messagesTitre').textContent = 'MESSAGES';
      renderBoite();
    }
    relancerMinuteur();
  }

  // ------------------------------------------------------------ la boite
  function renderBoite(){
    var liste = document.getElementById('messagesListe');
    if (liste.dataset.pret !== '1') liste.innerHTML = '<div class="admin-vide">' + attente() + '</div>';
    var admin = Sync.estAdmin(), estCoach = Sync.estCoach();
    var jeton = ++jetonBoite;
    function rien(){ return []; }
    Promise.all([
      admin ? Promise.resolve(null) : Sync.apercuSupport().catch(function(e){ return { erreur:e }; }),
      Sync.apercuCoach().catch(rien),
      Sync.monCoach().catch(rien),
      estCoach ? Sync.mesCoaches().catch(rien) : Promise.resolve([]),
      admin ? Sync.adminFils().catch(rien) : Promise.resolve([])
    ]).then(function(r){
      if (jeton !== jetonBoite || conv || state.view !== 'messages') return;
      var lignes = conversationsDe(r[0], r[1] || [], r[2] || [], r[3] || [], r[4] || [], admin);
      liste.dataset.pret = '1';
      liste.innerHTML = (lignes.length
        ? lignes.map(ligneConvHTML).join('')
        : '<div class="admin-vide">Aucune conversation pour l\'instant.</div>')
        + '<p class="conv-aide">' + (admin
            ? 'Chaque membre qui écrit a sa conversation ici. Pour écrire à quelqu\'un qui n\'a encore rien envoyé : ÉCRIRE, dans l\'espace admin.'
            : 'L\'équipe Top Set, ton coach, tes coachés : chacun a sa conversation ici. Une pastille s\'allume sur la bulle quand quelqu\'un t\'a écrit.')
        + '</p>';
    });
  }

  function entreeCoach(je, autre, nom, role, apercu, ecrire){
    return { type:'coach', je:je, autre:autre, nom:nom, role:role,
             dernier: apercu ? apercu.dernier : null, nonLus: apercu ? apercu.nonLus : 0, ecrire:ecrire };
  }

  function conversationsDe(support, coachs, monCoachRows, coachesRows, fils, admin){
    var out = [], moi = Sync.userId();
    if (!admin){
      var e = convEquipe();
      e.dernier = support && support.dernier;
      e.nonLus  = (support && support.nonLus) || 0;
      e.erreur  = support && support.erreur;
      out.push(e);
    } else {
      fils.forEach(function(f){
        if (f.user_id === moi) return;
        out.push({ type:'support', je:'admin', autre:f.user_id, nom:f.pseudo || 'Sans pseudo', role:'MEMBRE',
                   dernier: f.dernier ? { corps:f.dernier, cree_le:f.dernier_le } : null,
                   nonLus: Number(f.non_lus) || 0 });
      });
    }
    var parCle = Object.create(null);
    coachs.forEach(function(c){ parCle[c.jeSuis + ':' + c.autre] = c; });
    var l = monCoachRows[0];
    if (l && l.statut === 'actif'){
      out.push(entreeCoach('client', l.coach_id, l.pseudo || 'Ton coach', 'TON COACH', parCle['client:' + l.coach_id], true));
      delete parCle['client:' + l.coach_id];
    }
    coachesRows.forEach(function(c){
      if (c.statut !== 'actif') return;
      out.push(entreeCoach('coach', c.client_id, c.pseudo || 'Sans pseudo', 'COACHÉ', parCle['coach:' + c.client_id], true));
      delete parCle['coach:' + c.client_id];
    });
    // Ce qui reste, c'est un suivi termine : le coache garde la conversation,
    // il la relit, il n'y ecrit plus.
    Object.keys(parCle).forEach(function(k){
      var c = parCle[k];
      out.push(entreeCoach(c.jeSuis, c.autre, c.jeSuis === 'client' ? 'Ton ancien coach' : 'Ancien coaché',
                           'SUIVI TERMINÉ', c, false));
    });
    // La plus recente en haut ; celles qui n'ont pas encore commence, apres.
    out.sort(function(a, b){
      var da = a.dernier ? a.dernier.cree_le : '', db = b.dernier ? b.dernier.cree_le : '';
      if (da === db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      return da < db ? 1 : -1;
    });
    return out;
  }

  function ligneConvHTML(c){
    var d = c.dernier, apercu;
    if (c.erreur) apercu = Sync.messageErreur(c.erreur);
    else if (!d) apercu = c.ecrire === false ? 'Suivi terminé.'
                        : (c.je === 'membre' ? 'Une question, un bug, une idée : écris-nous.'
                                             : 'Pas encore de message — écris le premier.');
    else apercu = (d.auteur === c.je ? 'Toi : ' : (d.auteur === 'systeme' ? 'Automatique : ' : ''))
                + String(d.corps || '').replace(/\s+/g, ' ').slice(0, 140);
    var initiale = String(c.nom || '?').trim().charAt(0) || '?';
    return '<button type="button" class="conv-ligne' + (c.nonLus ? ' nonlu' : '') + '"'
      + ' data-type="' + esc(c.type) + '" data-je="' + esc(c.je) + '" data-autre="' + esc(c.autre || '') + '"'
      + ' data-nom="' + esc(c.nom) + '" data-role="' + esc(c.role) + '"'
      + ' data-peut-ecrire="' + (c.ecrire === false ? '0' : '1') + '">'
      + '<span class="conv-avatar" style="--c:' + (COULEUR_CONV[c.je] || 'var(--orange)') + '" aria-hidden="true">' + esc(initiale) + '</span>'
      + '<span class="conv-milieu">'
      +   '<span class="conv-nom"><span class="conv-nom-texte">' + esc(c.nom) + '</span>'
      +     '<span class="conv-role">' + esc(c.role) + '</span></span>'
      +   '<span class="conv-apercu">' + esc(apercu) + '</span>'
      + '</span>'
      + '<span class="conv-droite">'
      +   (d ? '<span class="conv-quand">' + esc(quandListe(d.cree_le)) + '</span>' : '')
      +   (c.nonLus ? '<span class="conv-compte" aria-label="' + c.nonLus + ' non lu' + (c.nonLus > 1 ? 's' : '') + '">'
                    + (c.nonLus > 99 ? '99+' : c.nonLus) + '</span>' : '')
      + '</span>'
      + '</button>';
  }

  // ------------------------------------------------------ la conversation
  function phraseConv(c){
    if (c.ecrire === false) return 'Le suivi est terminé. Cette conversation reste la tienne : tu la relis quand tu veux.';
    if (c.je === 'membre') return 'L\'équipe Top Set lit tout ce qui arrive ici — un bug, une question, une idée — et te répond dans cette conversation.';
    if (c.je === 'admin') return 'Ta réponse arrive dans ses messages, avec une pastille sur la bulle en haut de son écran.';
    if (c.je === 'client') return 'Ton coach lit ton carnet : parle-lui d\'une séance précise, d\'une douleur, du programme.';
    return 'Il retrouve ton message dans la bulle en haut de son écran. Une séance à commenter ? Dis laquelle.';
  }

  function renderConv(){
    var c = conv; if (!c) return;
    document.getElementById('messagesTitre').textContent = String(c.nom || '').toUpperCase();
    document.getElementById('convQui').textContent = phraseConv(c);
    var peut = c.ecrire !== false;
    document.getElementById('convSaisie').hidden = !peut;
    var ferme = document.getElementById('convFerme');
    ferme.hidden = peut;
    ferme.textContent = peut ? '' : 'Tu peux relire cette conversation, plus y écrire.';
    chargerConv('ouvrir');
  }

  function lireConv(c){
    return c.type === 'coach' ? Sync.lireFilCoach(c.autre, c.je)
                              : Sync.lireFil(c.je === 'admin' ? c.autre : null);
  }

  // Le fil est la page : c'est la page qui descend, et le champ de saisie
  // reste colle en bas de l'ecran. Rien ne s'anime pour qui a demande le calme.
  function presDuBas(){
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 160;
  }
  function allerEnBas(doux){
    var calme = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: (doux && !calme) ? 'smooth' : 'auto' });
  }

  // mode : 'ouvrir' (tout repeindre, descendre d'un coup), 'envoi' (tout
  // repeindre, descendre en douceur), 'releve' (ne repeindre que si quelque
  // chose est arrive, et ne descendre que si on etait deja en bas).
  function chargerConv(mode){
    var c = conv; if (!c) return;
    var fil = document.getElementById('convFil');
    lireConv(c).then(function(rows){
      if (conv !== c) return;   // fermee ou changee pendant la requete
      var dernier = rows[rows.length - 1];
      var cle = rows.length + ':' + (dernier ? dernier.id : '');
      if (mode === 'releve' && cle === convCle) return;
      var enBas = mode !== 'releve' || presDuBas();
      convCle = cle;
      var vide = c.je === 'membre' ? null
        : (c.je === 'client' ? 'Pas encore de message. Ton ressenti sur une séance, une douleur, une question : écris-le ici.'
                             : 'Pas encore de message. Écris le premier.');
      var attente = c.je === 'membre' ? attenteHTML(rows, 'membre')
        : (c.je === 'client' ? attenteHTML(rows, 'client', 'Ton coach te répond dès que possible.') : '');
      fil.innerHTML = bullesHTML(rows, c.je, c.nom, vide) + attente;
      if (enBas) allerEnBas(mode === 'envoi');
      // Ouvrir le fil, c'est avoir lu ce que l'AUTRE a ecrit. Pour l'equipe,
      // l'accuse automatique est de son propre cote : il ne se « lit » pas.
      var aLire = rows.filter(function(m){
        return !m.lu && m.auteur !== c.je && !(c.je === 'admin' && m.auteur === 'systeme');
      }).map(function(m){ return m.id; });
      if (aLire.length){
        (c.type === 'coach' ? Sync.marquerLusCoach(aLire) : Sync.marquerLus(aLire))
          .then(function(){ majBadgeMessages(true); }, function(){});
      }
      // Cote equipe, chaque message d'un membre a aussi fait une notification
      // dans l'espace admin. Avoir lu le fil, c'est les avoir lues.
      if (c.je === 'admin' && (aLire.length || mode === 'ouvrir')) Sync.notifsLuesDe(c.autre).catch(function(){});
    }, function(e){
      if (conv !== c || mode === 'releve') return;
      fil.innerHTML = '<div class="fil-vide">' + esc(Sync.messageErreur(e)) + '</div>';
    });
  }

  function ajusterChamp(){
    var t = document.getElementById('convCorps');
    if (!t) return;
    t.style.height = 'auto';
    t.style.height = Math.min(t.scrollHeight + 4, 140) + 'px';
  }

  function envoyerConv(){
    var c = conv; if (!c || c.ecrire === false) return;
    var champ = document.getElementById('convCorps');
    var corps = champ.value.trim();
    if (!corps){ champ.focus(); return; }
    var b = document.getElementById('convEnvoyer');
    b.disabled = true;
    var envoi = c.type === 'coach'
      ? Sync.envoyerMessageCoach(c.autre, c.je, corps)
      : Sync.envoyerMessage(corps, c.je === 'admin' ? c.autre : null, c.je === 'admin');
    envoi.then(function(){
      if (conv !== c) return;
      champ.value = '';
      ajusterChamp();
      document.getElementById('convMsg').hidden = true;
      chargerConv('envoi');
    }, function(err){
      var m = document.getElementById('convMsg');
      m.className = 'sheet-msg err';
      m.textContent = Sync.messageErreur(err);
      m.hidden = false;
    }).then(function(){ b.disabled = false; });
  }

  // Les messages n'arrivent pas tout seuls : tant que la page est ouverte et
  // visible, on regarde toutes les dix secondes dans une conversation, toutes
  // les trente dans la boite. Rien quand l'onglet est cache ou ailleurs.
  function relancerMinuteur(){
    clearInterval(minuteurMessages);
    minuteurMessages = null;
    if (state.view !== 'messages' || document.hidden || !Sync.estConnecte()) return;
    minuteurMessages = setInterval(function(){
      if (state.view !== 'messages' || document.hidden){
        clearInterval(minuteurMessages); minuteurMessages = null; return;
      }
      if (conv) chargerConv('releve'); else renderBoite();
    }, conv ? 10000 : 30000);
  }

  // La pastille de la bulle, en haut de l'ecran : le total de ce qui attend,
  // toutes conversations confondues. Deux comptages, jamais le contenu. Elle
  // ne se rafraichit pas plus d'une fois toutes les huit secondes, sauf quand
  // on vient de lire quelque chose.
  // Deux comptages peuvent se croiser : seul le dernier demande a le droit
  // d'ecrire, sinon un vieux chiffre rallume la pastille qu'on vient d'eteindre.
  var badgeQuand = 0, badgeJeton = 0;
  function majBadgeMessages(forcer){
    var b = document.getElementById('messagesBadge');
    if (!b) return;
    if (!Sync.estConnecte()){ b.hidden = true; badgeJeton++; return; }
    if (!forcer && Date.now() - badgeQuand < 8000) return;
    badgeQuand = Date.now();
    var jeton = ++badgeJeton;
    Sync.nonLusTotal().then(function(n){
      if (jeton !== badgeJeton) return;
      b.hidden = !n;
      b.textContent = n > 99 ? '99+' : String(n);
      var btn = document.getElementById('messagesBtn');
      if (btn) btn.setAttribute('aria-label', n ? 'Messages — ' + n + ' non lu' + (n > 1 ? 's' : '') : 'Messages');
    });
  }
  setInterval(function(){ if (!document.hidden) majBadgeMessages(true); }, 60000);
  document.addEventListener('visibilitychange', function(){
    if (document.hidden) return;
    majBadgeMessages(true);
    if (state.view === 'messages'){
      if (conv) chargerConv('releve'); else renderBoite();
      relancerMinuteur();
    }
  });

  document.getElementById('messagesBtn').addEventListener('click', ouvrirBoite);
  document.getElementById('messagesRetour').addEventListener('click', function(){
    if (conv){
      var depuis = conv.depuis;
      conv = null;
      if (depuis){ montrerVue(depuis); window.scrollTo(0, 0); return; }
      renderMessages();
      window.scrollTo(0, 0);
      return;
    }
    montrerVue('seances');
    window.scrollTo(0, 0);
  });
  document.getElementById('messagesRafraichir').addEventListener('click', function(){
    if (conv) chargerConv('envoi'); else renderBoite();
    majBadgeMessages(true);
  });
  document.getElementById('messagesListe').addEventListener('click', function(e){
    if (e.target.closest('#messagesConnexion')){
      Sync.modeAccueil('connexion');
      Sync.montrerAccueil();
      return;
    }
    var l = e.target.closest('.conv-ligne'); if (!l) return;
    ouvrirConversation({ type:l.dataset.type, je:l.dataset.je, autre:l.dataset.autre || null,
                         nom:l.dataset.nom, role:l.dataset.role, ecrire:l.dataset.peutEcrire !== '0' });
  });
  document.getElementById('convEnvoyer').addEventListener('click', envoyerConv);
  // Entree envoie, Maj+Entree va a la ligne : la convention de toutes les
  // messageries. Sur telephone, la touche du clavier dit « Envoyer ».
  document.getElementById('convCorps').addEventListener('keydown', function(e){
    if (e.key === 'Enter' && !e.shiftKey){
      e.preventDefault();
      envoyerConv();
    }
  });
  document.getElementById('convCorps').addEventListener('input', ajusterChamp);

  // ==================================================================
  // COACH
  // ==================================================================
  // Deux directions, et il ne faut jamais les confondre : « mon coach »
  // (quelqu'un lit MON carnet) et « mes coaches » (je lis le carnet de
  // quelqu'un). L'ecran les separe franchement pour la meme raison.
  var coachClient = null;   // le coache dont on lit le carnet, ou null

  function msgCoach(genre, texte){
    var el = document.getElementById('coachMsg');
    if (!el) return;
    el.className = 'sheet-msg ' + genre;
    el.textContent = texte;
    el.hidden = false;
  }

  function majCoachUI(){
    var sec = document.getElementById('coachEtat');
    if (!sec || !Sync.estConnecte()) return;

    // --- etre coach
    var estC = Sync.estCoach();
    var code = Sync.codeCoach();
    document.getElementById('coachDevenir').hidden = estC;
    document.getElementById('coachOuvrir').hidden  = !estC;
    document.getElementById('coachCesser').hidden  = !estC;
    sec.innerHTML = estC && code
      ? '<div class="coach-code">' + esc(code) + '</div>'
        + '<p class="coach-code-aide">Donne ce code à la personne que tu coaches. '
        + 'Elle le saisit de son côté, et tu recevras sa demande ici.</p>'
      : '';

    // --- avoir un coach
    Sync.monCoach().then(function(rows){
      var etat   = document.getElementById('monCoachEtat');
      var saisie = document.getElementById('monCoachSaisie');
      var l = rows && rows[0];
      if (!l){
        etat.innerHTML = '';
        saisie.hidden = false;
        return;
      }
      saisie.hidden = true;
      var nom = l.pseudo ? esc(l.pseudo) : 'ton coach';
      etat.innerHTML =
        '<div class="coach-etat ' + (l.statut === 'actif' ? 'actif' : 'attente') + '">'
        + '<span class="pastille"></span>'
        + '<span>' + (l.statut === 'actif'
            ? '<b>' + nom + '</b> lit ce carnet'
            : 'Demande envoyée à <b>' + nom + '</b>, en attente de sa réponse')
        + '</span></div>'
        + (l.statut === 'actif'
            ? '<button type="button" class="btn-sheet primary" data-fil-coach="' + esc(l.coach_id)
              + '" data-nom="' + esc(l.pseudo || '') + '">ÉCRIRE À ' + (l.pseudo ? esc(l.pseudo.toUpperCase()) : 'TON COACH')
              + '<span class="compteur-fil" id="monCoachNonLus" hidden></span></button>'
            : '')
        + '<button type="button" class="btn-sheet danger" data-couper="' + esc(l.lien_id) + '">'
        + (l.statut === 'actif' ? 'COUPER L\'ACCÈS' : 'ANNULER LA DEMANDE') + '</button>';
      if (l.statut === 'actif'){
        Sync.nonLusCoach().then(function(par){
          var c = document.getElementById('monCoachNonLus');
          var n = par[l.coach_id] || 0;
          if (c){ c.textContent = n; c.hidden = !n; }
        });
      }
    }, function(){ /* le SQL n'est peut-etre pas encore passe */ });
  }

  document.getElementById('coachDevenir').addEventListener('click', function(){
    var b = this, avant = b.textContent;
    b.disabled = true; b.textContent = 'CRÉATION…';
    Sync.devenirCoach().then(function(code){
      msgCoach('ok', 'Te voilà coach. Ton code : ' + code);
      majCoachUI();
    }, function(e){ msgCoach('err', Sync.messageErreur(e)); })
     .then(function(){ b.disabled = false; b.textContent = avant; });
  });

  document.getElementById('coachCesser').addEventListener('click', function(){
    if (!confirm('Ne plus être coach ? Tous tes liens en cours seront coupés, et tes coachés en seront avertis à leur prochaine ouverture.')) return;
    Sync.cesserCoach().then(function(){
      msgCoach('ok', 'Tu n\'es plus coach. Les liens sont coupés.');
      majCoachUI();
    }, function(e){ msgCoach('err', Sync.messageErreur(e)); });
  });

  document.getElementById('coachDemander').addEventListener('click', function(){
    var champ = document.getElementById('coachCode');
    var code = champ.value.toUpperCase().trim();
    if (code.length !== 8){ msgCoach('err', 'Le code fait 8 caractères.'); champ.focus(); return; }
    var b = this, avant = b.textContent;
    b.disabled = true; b.textContent = 'ENVOI…';
    Sync.demanderCoach(code).then(function(d){
      champ.value = '';
      msgCoach('ok', 'Demande envoyée à ' + (d && d.coach ? d.coach : 'ton coach') + '. Il doit l\'accepter.');
      majCoachUI();
    }, function(e){ msgCoach('err', Sync.messageErreur(e)); })
     .then(function(){ b.disabled = false; b.textContent = avant; });
  });

  document.getElementById('monCoachEtat').addEventListener('click', function(e){
    var ecrire = e.target.closest('[data-fil-coach]');
    if (ecrire){
      ouvrirConversation({ type:'coach', je:'client', autre:ecrire.dataset.filCoach,
                           nom:ecrire.dataset.nom || 'Ton coach', role:'TON COACH' });
      return;
    }
    var b = e.target.closest('[data-couper]'); if (!b) return;
    if (!confirm('Couper l\'accès ? Ton coach ne verra plus rien immédiatement.')) return;
    Sync.revoquerLien(b.dataset.couper).then(function(){
      msgCoach('ok', 'Accès coupé.');
      majCoachUI();
    }, function(err){ msgCoach('err', Sync.messageErreur(err)); });
  });

  document.getElementById('coachOuvrir').addEventListener('click', function(){
    fermerFeuilles();
    coachClient = null;
    montrerVue('coach');
    window.scrollTo(0, 0);
  });

  // ------------------------------------------------------------ la vue
  function renderCoach(){
    var zone  = document.getElementById('coachContenu');
    var titre = document.getElementById('coachTitre');

    if (coachClient){
      titre.textContent = (coachClient.pseudo || 'CARNET').toUpperCase();
      zone.innerHTML = '<div class="admin-vide">' + attente('Lecture du carnet…') + '</div>';
      // Lire une seance et vouloir en parler, c'est le meme geste : le bouton
      // est la ou naissent les questions.
      var ecrire = '<div class="coache-actions">'
        + '<button type="button" class="coache-action oui" data-fil-client="' + esc(coachClient.client_id)
        + '" data-pseudo="' + esc(coachClient.pseudo || '') + '">ÉCRIRE À '
        + (coachClient.pseudo ? esc(coachClient.pseudo.toUpperCase()) : 'CE COACHÉ') + '</button></div>';
      Sync.tirerJoursDe(coachClient.client_id).then(function(jours){
        var dates = Object.keys(jours || {}).sort().reverse();
        if (!dates.length){
          zone.innerHTML = ecrire + '<div class="admin-vide">Aucune séance loguée pour l\'instant.</div>';
          return;
        }
        zone.innerHTML = ecrire + dates.map(function(ds){
          var j = jours[ds];
          var d = fromDateStr(ds);
          var quand = DAY_NAMES[(d.getDay()+6)%7] + ' ' + d.getDate() + ' ' +
                      MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
          var exos = (j.exercises || []).map(function(ex){
            var top = TS.calculerTopSet(ex.series || []);
            var series = (ex.series || []).map(function(s){
              var t = TS.typeSerie(s);
              var classe = (top && s === top) ? 'top' : (t !== TS.TYPES.TRAVAIL ? t : '');
              var txt = perfTexte({ poids: (s.poids != null && s.poids !== '') ? Number(s.poids) : null,
                                    reps: s.reps });
              if (s.rpe != null) txt += (TS.serieAuTemps(s) ? ' · difficulté ' : ' · RPE ') + s.rpe;
              return '<span class="lect-serie ' + classe + '">' + esc(txt) + '</span>';
            }).join('');
            // Les commentaires sont souvent ce qu'un coach veut lire en
            // premier : « assistée », « douleur au coude ».
            return '<div class="lect-exo">'
              + '<div class="lect-nom">' + esc(ex.nom || 'Sans nom') + '</div>'
              + '<div class="lect-series">' + (series || '<span class="lect-serie">aucune série</span>') + '</div>'
              + notesExo(ex).map(function(n){ return '<div class="lect-note">«\u00a0' + esc(n) + '\u00a0»</div>'; }).join('')
              + '</div>';
          }).join('');
          return '<div class="lect-jour">'
            + '<div class="lect-date">' + esc(quand.toUpperCase()) + (j.titre ? ' · ' + esc(j.titre) : '') + '</div>'
            + exos + '</div>';
        }).join('');
      }, function(e){
        zone.innerHTML = '<div class="admin-vide">' + esc(Sync.messageErreur(e)) + '</div>';
      });
      return;
    }

    titre.textContent = 'MES COACHÉS';
    zone.innerHTML = '<div class="admin-vide">' + attente() + '</div>';
    Promise.all([Sync.mesCoaches(), Sync.nonLusCoach()]).then(function(res){
      var rows = res[0], nonLus = res[1];
      if (!rows || !rows.length){
        zone.innerHTML = '<div class="admin-vide">Personne pour l\'instant. '
          + 'Donne ton code à quelqu\'un : sa demande apparaîtra ici.</div>';
        return;
      }
      zone.innerHTML = rows.map(function(c){
        var nom = c.pseudo ? esc(c.pseudo) : '<span class="anon">sans pseudo</span>';
        var attente = c.statut === 'en_attente';
        var derniere = c.derniere ? (function(){
          var d = fromDateStr(c.derniere);
          return d.getDate() + ' ' + MONTH_ABBR[d.getMonth()];
        })() : '—';
        return '<div class="coache-carte ' + (attente ? 'attente' : '') + '"'
          + (attente ? '' : ' data-ouvrir-coache="' + esc(c.client_id) + '" data-pseudo="' + esc(c.pseudo || '') + '"')
          + ' role="' + (attente ? 'group' : 'button') + '" tabindex="0">'
          + '<div class="coache-tete">'
          +   '<span class="coache-nom">' + nom + '</span>'
          +   (attente ? '<span class="coache-badge">DEMANDE</span>' : '')
          +   '<span class="coache-chiffres">' + (attente ? '' :
                c.nb_seances + ' séance' + (c.nb_seances > 1 ? 's' : '') + '<br>dernière ' + esc(derniere)) + '</span>'
          + '</div>'
          + (attente
              ? '<div class="coache-actions">'
                + '<button type="button" class="coache-action oui" data-repondre="' + esc(c.lien_id) + '" data-oui="1">ACCEPTER</button>'
                + '<button type="button" class="coache-action non" data-repondre="' + esc(c.lien_id) + '" data-oui="">REFUSER</button>'
                + '</div>'
              : '<div class="coache-actions">'
                + '<button type="button" class="coache-action oui" data-fil-client="' + esc(c.client_id)
                +   '" data-pseudo="' + esc(c.pseudo || '') + '">MESSAGES'
                +   (nonLus[c.client_id] ? '<span class="compteur-fil">' + nonLus[c.client_id] + '</span>' : '')
                + '</button>'
                + '<button type="button" class="coache-action non" data-couper-coache="' + esc(c.lien_id) + '">METTRE FIN AU SUIVI</button>'
                + '</div>')
          + '</div>';
      }).join('');
    }, function(e){
      zone.innerHTML = '<div class="admin-vide">' + esc(Sync.messageErreur(e)) + '</div>';
    });
  }

  document.getElementById('coachRetourBtn').addEventListener('click', function(){
    if (coachClient){ coachClient = null; renderCoach(); window.scrollTo(0,0); return; }
    montrerVue('seances');
  });
  document.getElementById('coachRafraichir').addEventListener('click', renderCoach);

  document.getElementById('coachContenu').addEventListener('click', function(e){
    // Avant la carte : le bouton est DANS la carte, et la carte ouvre le carnet.
    var msg = e.target.closest('[data-fil-client]');
    if (msg){
      ouvrirConversation({ type:'coach', je:'coach', autre:msg.dataset.filClient,
                           nom:msg.dataset.pseudo || 'Coaché', role:'COACHÉ' }, 'coach');
      return;
    }
    var rep = e.target.closest('[data-repondre]');
    if (rep){
      rep.disabled = true;
      Sync.repondreDemande(rep.dataset.repondre, !!rep.dataset.oui)
          .then(renderCoach, function(err){ rep.disabled = false; showToast(Sync.messageErreur(err)); });
      return;
    }
    var fin = e.target.closest('[data-couper-coache]');
    if (fin){
      if (!confirm('Mettre fin au suivi ? Tu ne verras plus son carnet.')) return;
      Sync.revoquerLien(fin.dataset.couperCoache)
          .then(renderCoach, function(err){ showToast(Sync.messageErreur(err)); });
      return;
    }
    var carte = e.target.closest('[data-ouvrir-coache]');
    if (carte){
      coachClient = { client_id: carte.dataset.ouvrirCoache, pseudo: carte.dataset.pseudo };
      renderCoach();
      window.scrollTo(0, 0);
    }
  });

  // ==================================================================
  // ADMINISTRATION
  // ==================================================================
  var adminFiltre = '';

  function tuile(val, lib){
    return '<div class="admin-tuile"><div class="admin-tuile-val">' + val +
           '</div><div class="admin-tuile-lib">' + lib + '</div></div>';
  }

  function renderAdmin(){
    var tuiles  = document.getElementById('adminTuiles');
    var retours = document.getElementById('adminRetoursListe');
    var membres = document.getElementById('adminMembresListe');

    Sync.adminApercu().then(function(a){
      tuiles.innerHTML =
          tuile(a.inscrits,         'INSCRITS')
        + tuile(a.inscrits_7j,      'NOUVEAUX 7 J')
        + tuile(a.actifs_7j,        'ACTIFS 7 J')
        + tuile(a.actifs_30j,       'ACTIFS 30 J')
        + tuile(a.seances,          'SÉANCES')
        + tuile(a.seances_7j,       'SÉANCES 7 J')
        + tuile(a.series,           'SÉRIES')
        + tuile(a.retours_nouveaux, 'RETOURS')
        + tuile(a.messages_nouveaux == null ? 0 : a.messages_nouveaux, 'MESSAGES')
        + tuile(a.notifs_nouvelles  == null ? 0 : a.notifs_nouvelles,  'NOTIFS');
    }, function(e){
      tuiles.innerHTML = '<div class="admin-vide">' + esc(Sync.messageErreur(e)) + '</div>';
    });

    Sync.adminRetours(adminFiltre).then(function(rows){
      if (!rows.length){
        retours.innerHTML = '<div class="admin-vide">Rien ici pour le moment.</div>';
        return;
      }
      retours.innerHTML = rows.map(function(x){
        var qui = x.pseudo ? esc(x.pseudo) : '<span class="anon">compte supprimé</span>';
        return '<div class="admin-carte ' + (x.statut === 'nouveau' ? 'nouveau' : '') + '">'
          + '<div class="admin-carte-tete">'
          +   '<span>' + (RETOUR_MOT[x.type] || esc(x.type)) + '</span>'
          +   '<span class="admin-qui">' + qui + '</span>'
          +   '<span class="admin-quand">' + esc(quandCourt(x.cree_le)) + '</span>'
          + '</div>'
          + '<div class="admin-corps">' + esc(x.corps) + '</div>'
          + (x.contexte && Object.keys(x.contexte).length
              ? '<div class="admin-ctx">' + esc(JSON.stringify(x.contexte)) + '</div>' : '')
          + '<div class="admin-actions">'
          // Un retour sans auteur (compte supprime) n'a plus personne a qui
          // repondre : pas de bouton plutot qu'un bouton qui echoue.
          +   (x.user_id ? '<button type="button" class="admin-action" data-ecrire="' + esc(x.user_id)
                         + '" data-pseudo="' + esc(x.pseudo || '') + '"'
                         + (x.statut === 'nouveau' ? ' data-retour="' + esc(x.id) + '"' : '') + '>RÉPONDRE</button>' : '')
          +   (x.statut !== 'vu'      ? '<button type="button" class="admin-action" data-marquer="' + esc(x.id) + '" data-statut="vu">MARQUER LU</button>' : '')
          +   (x.statut !== 'traite'  ? '<button type="button" class="admin-action" data-marquer="' + esc(x.id) + '" data-statut="traite">TRAITÉ</button>' : '')
          +   (x.statut !== 'nouveau' ? '<button type="button" class="admin-action" data-marquer="' + esc(x.id) + '" data-statut="nouveau">ROUVRIR</button>' : '')
          + '</div>'
          + '</div>';
      }).join('');
    }, function(e){
      retours.innerHTML = '<div class="admin-vide">' + esc(Sync.messageErreur(e)) + '</div>';
    });

    // --- notifications
    var notifs = document.getElementById('adminNotifsListe');
    Sync.lireNotifs().then(function(rows){
      if (!rows.length){ notifs.innerHTML = '<div class="admin-vide">Rien de neuf.</div>'; return; }
      notifs.innerHTML = rows.map(function(n){
        return '<div class="notif-ligne ' + (n.lu ? '' : 'neuf') + '">'
          + '<span class="notif-type ' + esc(n.type) + '">' + esc(n.type.toUpperCase()) + '</span>'
          + '<span class="notif-corps">' + esc(n.contenu || '') + '</span>'
          + '<span class="notif-quand">' + esc(quandCourt(n.cree_le)) + '</span>'
          + '</div>';
      }).join('');
    }, function(e){ notifs.innerHTML = '<div class="admin-vide">' + esc(Sync.messageErreur(e)) + '</div>'; });

    Sync.adminMembres().then(function(rows){
      if (!rows.length){
        membres.innerHTML = '<div class="admin-vide">Personne encore.</div>';
        return;
      }
      membres.innerHTML = rows.map(function(x){
        var nom = x.pseudo ? esc(x.pseudo) : '<span class="anon">sans pseudo</span>';
        return '<div class="admin-ligne">'
          + '<div class="admin-ligne-nom">' + nom
          +   (x.role === 'admin' ? ' <span class="admin-badge">ADMIN</span>' : '')
          + '</div>'
          + '<div class="admin-ligne-chiffres">'
          +   x.nb_seances + ' séance' + (x.nb_seances > 1 ? 's' : '') + '<br>'
          +   'vu ' + esc(quandCourt(x.vu_le))
          + '</div>'
          + '<button type="button" class="admin-action" data-ecrire="' + esc(x.user_id)
          +   '" data-pseudo="' + esc(x.pseudo || '') + '">ÉCRIRE</button>'
          + '</div>';
      }).join('');
    }, function(e){
      membres.innerHTML = '<div class="admin-vide">' + esc(Sync.messageErreur(e)) + '</div>';
    });
  }


  document.getElementById('adminNotifsLues').addEventListener('click', function(){
    var b = this; b.disabled = true;
    Sync.notifsLues().then(renderAdmin, function(e){ showToast(Sync.messageErreur(e)); })
        .then(function(){ b.disabled = false; });
  });

  document.getElementById('adminRetourBtn').addEventListener('click', function(){
    montrerVue('seances');
  });
  document.getElementById('adminVersMessages').addEventListener('click', function(){
    ouvrirBoite();
  });
  document.getElementById('adminRafraichir').addEventListener('click', renderAdmin);
  document.getElementById('adminFiltres').addEventListener('click', function(e){
    var b = e.target.closest('.admin-filtre'); if (!b) return;
    adminFiltre = b.dataset.statut || '';
    this.querySelectorAll('.admin-filtre').forEach(function(x){ x.classList.toggle('active', x === b); });
    renderAdmin();
  });
  // Ouvrir un fil, c'est pouvoir y ecrire — meme s'il est vide : une
  // conversation peut commencer par l'equipe. Repondre a un retour encore
  // nouveau le passe en LU, parce que c'est ce qu'on vient de faire.
  ['adminRetoursListe', 'adminMembresListe'].forEach(function(id){
    document.getElementById(id).addEventListener('click', function(e){
      var b = e.target.closest('[data-ecrire]'); if (!b) return;
      if (b.dataset.retour) Sync.adminMarquer(b.dataset.retour, 'vu').catch(function(){});
      ouvrirConversation({ type:'support', je:'admin', autre:b.dataset.ecrire,
                           nom:b.dataset.pseudo || 'Membre', role:'MEMBRE' }, 'admin');
    });
  });

  document.getElementById('adminRetoursListe').addEventListener('click', function(e){
    var b = e.target.closest('[data-marquer]'); if (!b) return;
    b.disabled = true;
    Sync.adminMarquer(b.dataset.marquer, b.dataset.statut)
        .then(renderAdmin, function(err){ b.disabled = false; showToast(Sync.messageErreur(err)); });
  });

  document.getElementById('compteAdmin').addEventListener('click', function(){
    fermerFeuilles();
    montrerVue('admin');
    window.scrollTo(0, 0);
  });

  document.getElementById('dataBtn').addEventListener('click', openDataSheet);
  document.getElementById('dataClose').addEventListener('click', closeDataSheet);
  document.getElementById('dataSheet').addEventListener('click', function(e){
    if (e.target === this) closeDataSheet();
  });
  document.getElementById('profilBtn').addEventListener('click', openProfil);
  document.getElementById('profilClose').addEventListener('click', closeProfil);
  document.getElementById('profilSheet').addEventListener('click', function(e){
    if (e.target === this) closeProfil();
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') fermerFeuilles();
  });

  function telechargerTexte(texte, nom, mime){
    var blob = new Blob([texte], { type:mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = nom;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(url); }, 1000);
  }

  document.getElementById('dataDownload').addEventListener('click', function(){
    try {
      telechargerTexte(backupJSON(), backupFilename(), 'application/json');
      showToast('Sauvegarde t\u00e9l\u00e9charg\u00e9e');
    } catch(e){
      sheetMsg('err', "Le t\u00e9l\u00e9chargement a echoue. Utilise \u00ab COPIER LE TEXTE \u00bb.");
    }
  });

  document.getElementById('dataCsv').addEventListener('click', function(){
    try {
      if (!backupStats().jours){
        sheetMsg('warn', 'Aucune s\u00e9rie \u00e0 exporter pour l\'instant.');
        return;
      }
      telechargerTexte(csvContent(), csvFilename(), 'text/csv;charset=utf-8');
      showToast('Tableur t\u00e9l\u00e9charg\u00e9');
    } catch(e){
      sheetMsg('err', "L'export tableur a \u00e9chou\u00e9.");
    }
  });

  // Sur mobile le partage natif est plus fiable qu'un telechargement.
  (function(){
    var btn = document.getElementById('dataShare');
    if (!navigator.share) return;
    btn.hidden = false;
    btn.addEventListener('click', function(){
      var file = null;
      try {
        file = new File([backupJSON()], backupFilename(), { type:'application/json' });
      } catch(e){ /* File non constructible : on partagera le texte */ }
      var payload = (file && navigator.canShare && navigator.canShare({ files:[file] }))
        ? { files:[file] }
        : { title:'Sauvegarde Top Set', text:backupJSON() };
      navigator.share(payload).catch(function(){ /* annule par l'utilisateur */ });
    });
  })();

  document.getElementById('dataCopy').addEventListener('click', function(){
    var text = backupJSON();
    function fallback(){
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch(e){}
      ta.remove();
      if (ok) showToast('Sauvegarde copi\u00e9e');
      else sheetMsg('err', 'Copie impossible. Utilise le t\u00e9l\u00e9chargement.');
    }
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){ showToast('Sauvegarde copi\u00e9e'); }, fallback);
    } else fallback();
  });

  document.getElementById('dataFile').addEventListener('change', function(e){
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    // Refuser avant de lire : passe cette taille, c'est FileReader lui-meme
    // qui fige l'onglet, et le message d'erreur n'arrive jamais.
    if (f.size > IMPORT_MAX){
      sheetMsg('err', 'Fichier trop volumineux (' + Math.round(f.size / 1048576) +
                      ' Mo). La limite est de 8 Mo — une sauvegarde normale en fait moins d\'un.');
      e.target.value = '';
      return;
    }
    var fr = new FileReader();
    var nomFichier = f.name || '';
    fr.onload = function(){
      document.getElementById('dataPaste').value = String(fr.result);
      disarmImport();
      preparerImport(String(fr.result), nomFichier);
    };
    fr.onerror = function(){ sheetMsg('err', 'Lecture du fichier impossible.'); };
    fr.readAsText(f);
    e.target.value = '';
  });

  document.getElementById('dataPaste').addEventListener('input', disarmImport);

  // Un import AJOUTE, il ne remplace plus. Remplacer effacait le carnet en
  // place par celui du fichier : une vieille sauvegarde importee par erreur
  // faisait disparaitre des mois de seances. Ce qui est deja la ne bouge
  // pas, ce qui manque arrive — voir fusionnerCarnets() dans intelligence.js.
  document.getElementById('dataImport').addEventListener('click', function(){
    if (pendingBackup){ appliquerImport(); return; }
    var text = document.getElementById('dataPaste').value.trim();
    if (!text){ sheetMsg('err', 'Choisis un fichier, ou colle le contenu d\'une sauvegarde.'); return; }
    preparerImport(text, '');
  });

  // ==========================================================================
  // COMPTE ET SYNCHRONISATION
  // ==========================================================================
  // Regle unique : le localStorage reste la source de verite de l'interface.
  // Tout s'ecrit en local d'abord, immediatement ; l'ecran ne depend jamais du
  // reseau. Supabase est une copie qui suit. Sans compte, ou hors ligne, l'app
  // se comporte exactement comme avant.
  //
  // L'unite de synchro est la JOURNEE, parce que c'est deja l'unite de l'app :
  // state.sessions est une carte date -> journee. pousser_jour() reecrit une
  // journee entiere de facon atomique, ce qui elimine par construction les
  // doublons, les fusions partielles et les series orphelines.

  // Version de la politique de confidentialite, enregistree avec chaque
  // consentement : a l'inscription, et a chaque demande de coaching. Elle suit
  // le numero ecrit en haut de confidentialite.html.
  //
  // La 3.0 ne redemande rien aux comptes existants : elle decrit ce que les
  // gens declenchent eux-memes (un message, un retour) et le coaching, qui a
  // deja son propre accord. Une version qui ajouterait un traitement que
  // personne n'a demande, lui, devrait reposer la question.
  //
  // La 3.1 non plus : le commentaire d'un exercice est tape par la personne
  // elle-meme, et le reste nomme des intervenants qui etaient deja la
  // (l'editeur, Resend, OVH, et Claude qui n'a acces a rien). Elle retire la
  // promesse « aucune mesure d'audience » sans en ajouter une : le jour ou il
  // y en aura une, la page le dira avant, et la question se reposera ici.
  var VERSION_POLITIQUE = '3.2';
  var SYNC_KEY      = 'topset_sync';
  var CONFLITS_KEY  = 'topset_conflits';

  var Sync = (function(){
    var cfg = window.TOPSET_SUPABASE || null;
    var sb = null, libPromise = null, clientPromise = null;
    var user = null;
    var enCours = false, minuteur = null, echec = '';

    function dispo(){ return !!(cfg && cfg.url && cfg.anonKey); }

    function lireMeta(){
      try { return JSON.parse(localStorage.getItem(SYNC_KEY)) || {}; } catch(e){ return {}; }
    }
    function majMeta(f){
      var m = lireMeta(); f(m);
      try { localStorage.setItem(SYNC_KEY, JSON.stringify(m)); } catch(e){}
      return m;
    }
    function sales(){ return lireMeta().sales || {}; }
    function nbSales(){ return Object.keys(sales()).length; }

    // Rien n'est jamais jete en silence : la version perdante d'un conflit est
    // mise de cote plutot que remplacee. C'est ce qui permet de dire honnetement
    // que la synchro ne peut pas faire perdre une seance.
    function garderConflit(ds, contenu){
      try {
        var c = JSON.parse(localStorage.getItem(CONFLITS_KEY)) || {};
        c[ds + '@' + new Date().toISOString()] = contenu;
        localStorage.setItem(CONFLITS_KEY, JSON.stringify(c));
      } catch(e){}
    }

    // Une session Supabase vit sous une cle sb-<ref>-auth-token. La reperer
    // evite de telecharger 209 Ko de bibliotheque pour quelqu'un qui n'a pas de
    // compte, c'est-a-dire l'immense majorite des visites.
    function sessionStockee(){
      try {
        for (var i = 0; i < localStorage.length; i++){
          var k = localStorage.key(i);
          if (k && k.indexOf('sb-') === 0 && k.indexOf('-auth-token') > 0) return true;
        }
      } catch(e){}
      return false;
    }

    function charger(){
      if (window.supabase) return Promise.resolve();
      if (libPromise) return libPromise;
      libPromise = new Promise(function(res, rej){
        var s = document.createElement('script');
        s.src = 'vendor/supabase.umd.js';
        s.onload = function(){ res(); };
        s.onerror = function(){ libPromise = null; rej(new Error('Bibliotheque indisponible')); };
        document.head.appendChild(s);
      });
      return libPromise;
    }

    function client(){
      if (!dispo()) return Promise.reject(new Error('Comptes non configures'));
      if (clientPromise) return clientPromise;
      clientPromise = charger().then(function(){
        // detectSessionInUrl etait a false parce que rien n'arrivait par URL.
        // Le lien « mot de passe oublie » en est un : sans ca, le code repartait
        // avec la page sans jamais ouvrir de session.
        sb = window.supabase.createClient(cfg.url, cfg.anonKey, {
          auth: { persistSession:true, autoRefreshToken:true, detectSessionInUrl:true }
        });
        sb.auth.onAuthStateChange(function(_evt, session){
          var avant = user ? user.id : null;
          user = session ? session.user : null;
          // Un autre compte, c'est un autre role : le profil de l'ancien ne
          // doit pas servir a compter la pastille du nouveau.
          if ((user ? user.id : null) !== avant){ profil = null; profilCharge = null; }
          majUI();
        });
        return sb.auth.getSession().then(function(r){
          user = (r.data && r.data.session) ? r.data.session.user : null;
          return sb;
        });
      });
      return clientPromise;
    }

    function jourLocal(ds){
      return state.sessions[ds] || { date:ds, exercises:[] };
    }
    function jourDistant(ds, d){
      // Une base qui n'a pas encore la colonne « note » renvoie des exercices
      // sans la cle. Ce n'est pas « commentaire efface » : c'est « la base
      // ne sait pas ». Le commentaire d'ici reste, au lieu de disparaitre au
      // premier tirage. Une base a jour renvoie note:null, et la, on suit.
      // Les identifiants locaux (« x… ») ne sont pas ceux de la base, qui en
      // fabrique des neufs : on retrouve l'exercice par sa place et son nom.
      // Meme regle pour le commentaire d'une serie : une base sans la
      // colonne series.note rend des series sans la cle, et celui d'ici
      // reste — retrouve par identifiant, sinon par sa place.
      // Meme regle pour la vitesse et l'inclinaison du cardio.
      var CHAMPS_SERIE_RECENTS = ['note', 'vitesse', 'inclinaison'];
      var locaux = (state.sessions[ds] || {}).exercises || [];
      function copie(o){ var c = {}; Object.keys(o).forEach(function(k){ c[k] = o[k]; }); return c; }
      var distants = (d && d.exercises || []).map(function(e, i){
        if (!e) return e;
        var l = locaux.filter(function(x){ return x.id === e.id; })[0];
        if (!l && locaux[i] && (locaux[i].nom || '') === (e.nom || '')) l = locaux[i];
        if (!l) return e;
        var c = e;
        if (!('note' in e) && l.note){ c = copie(e); c.note = l.note; }
        var ls = l.series || [];
        function locale(s, k){ return ls.filter(function(x){ return x.id === s.id; })[0] || ls[k]; }
        function manquants(s, k){
          var lse = s && locale(s, k);
          return lse ? CHAMPS_SERIE_RECENTS.filter(function(f){ return !(f in s) && lse[f] != null && lse[f] !== ''; }) : [];
        }
        if (Array.isArray(e.series) && e.series.some(function(s, k){ return manquants(s, k).length; })){
          if (c === e) c = copie(e);
          c.series = e.series.map(function(s, k){
            var m = manquants(s, k);
            if (!m.length) return s;
            var lse = locale(s, k), cs = copie(s);
            m.forEach(function(f){ cs[f] = lse[f]; });
            return cs;
          });
        }
        return c;
      });
      var j = { date:ds, exercises:distants.map(normalizeExercise) };
      if (d && typeof d.titre === 'string' && d.titre.trim()) j.titre = d.titre.trim();
      // « Séance terminée » suit la même règle que les commentaires : une base
      // sans la colonne rend une journée SANS la clé, et la validation d'ici
      // reste. Une base à jour rend termine:null, et là, on suit.
      if (d && ('termine' in d)){ if (d.termine) j.termine = d.termine; }
      else if (state.sessions[ds] && state.sessions[ds].termine) j.termine = state.sessions[ds].termine;
      return j;
    }

    // ------------------------------------------------------------ ecriture
    function marquerSale(ds){
      if (!dispo()) return;
      majMeta(function(m){ m.sales = m.sales || {}; m.sales[ds] = 1; });
      if (user) planifier(2500);
      else majUI();
    }

    // On n'envoie pas une requete par frappe au clavier : la journee est
    // marquee tout de suite, l'envoi attend deux secondes et demie de calme.
    function planifier(delai){
      if (!dispo() || !user) return;
      clearTimeout(minuteur);
      minuteur = setTimeout(function(){ pousser(); }, delai || 2500);
    }

    function pousser(){
      if (!user || enCours) return Promise.resolve(0);
      var dates = Object.keys(sales());
      // Un titre, une fin de séance ou un nom d'exercice partent même si
      // aucune journée n'a bougé : sinon ils attendaient la prochaine série
      // notée, parfois des jours.
      var enAttente = lireMeta();
      if (!dates.length && !Object.keys(enAttente.titres || {}).length
          && !Object.keys(enAttente.fins || {}).length && !enAttente.exosSales) return Promise.resolve(0);
      enCours = true; echec = ''; majUI();
      return client().then(function(c){
        var chaine = Promise.resolve();
        dates.forEach(function(ds){
          chaine = chaine.then(function(){
            return c.rpc('pousser_jour', { p_date:ds, p_exercices:jourLocal(ds).exercises })
              .then(function(r){
                if (r.error) throw r.error;
                // La journee ne quitte la file QUE si le serveur a confirme.
                majMeta(function(m){
                  if (m.sales) delete m.sales[ds];
                  if (r.data && (!m.depuis || r.data > m.depuis)) m.depuis = r.data;
                });
              });
          });
        });
        // Les noms memorises ne doivent jamais retenir les seances en otage :
        // un echec ici laisse le drapeau leve, et repartira au prochain envoi.
        return chaine
          .then(function(){
            return lireMeta().exosSales ? pousserExos().catch(function(){}) : null;
          })
          .then(function(){ return pousserTitres().catch(function(){}); })
          .then(function(){ return pousserFins().catch(function(){}); })
          .then(function(){ return dates.length; });
      }).then(function(n){
        enCours = false; majUI();
        return n;
      }).catch(function(e){
        // Rien n'est perdu : les journees restent marquees et repartiront.
        enCours = false;
        echec = messageErreur(e);
        majUI();
        planifier(30000);
        return 0;
      });
    }

    // ------------------------------------------------------------- lecture
    function tirer(tout){
      if (!user) return Promise.resolve(0);
      return client().then(function(c){
        var depuis = tout ? null : (lireMeta().depuis || null);
        return c.rpc('tirer_jours', { p_depuis: depuis }).then(function(r){
          if (r.error) throw r.error;
          var distant = r.data || {};
          var enAttente = sales(), adoptes = 0, maxMaj = lireMeta().depuis || null;
          Object.keys(distant).forEach(function(ds){
            var d = distant[ds];
            if (d.updatedAt && (!maxMaj || d.updatedAt > maxMaj)) maxMaj = d.updatedAt;
            // Une journee modifiee ici et pas encore envoyee gagne : c'est ce
            // que l'utilisateur vient de taper. L'autre version est gardee.
            if (enAttente[ds]){ garderConflit(ds, d); return; }
            state.sessions[ds] = jourDistant(ds, d);
            adoptes++;
          });
          if (adoptes){ saveLocal(); renderAll(); }
          majMeta(function(m){ m.depuis = maxMaj; });
          return adoptes;
        });
      });
    }

    // ------------------------------------------------ exercices memorises
    // La liste est minuscule — quelques dizaines de noms — donc on l'envoie
    // entiere plutot que de tenir une file par nom. Un diff ici couterait
    // plus de code qu'il n'economise d'octets.
    function exosLocaux(){
      return Object.keys(customExercises).map(function(nom){
        var info = infoExo(customExercises[nom], nom);
        var e = { cle:cleExo(nom), nom:info.nom || nom, groupe:info.groupe, alias:info.alias };
        if (typeof info.sousGroupe === 'string') e.sous = info.sousGroupe;
        return e;
      }).filter(function(e){ return e.cle; });
    }

    function pousserExos(){
      if (!user) return Promise.resolve();
      var liste = exosLocaux();
      if (!liste.length){ majMeta(function(m){ m.exosSales = false; }); return Promise.resolve(); }
      return client().then(function(c){
        return c.rpc('pousser_exos_perso', { p_exos: liste });
      }).then(function(r){
        if (r.error) throw r.error;
        // Le drapeau ne tombe qu'apres confirmation du serveur.
        majMeta(function(m){ m.exosSales = false; });
      });
    }

    function tirerExos(){
      if (!user) return Promise.resolve(0);
      return client().then(function(c){
        return c.rpc('tirer_exos_perso');
      }).then(function(r){
        if (r.error) throw r.error;
        var distants = r.data || [], nouveaux = 0;
        distants.forEach(function(d){
          if (!d || !d.cle) return;
          var local = CUSTOM_PAR_CLE[d.cle];
          // Le local gagne quand il porte un rattachement et pas le distant :
          // un choix explicite ne doit pas etre efface par un appareil qui ne
          // l'a jamais vu.
          if (local && local.alias && !d.alias) return;
          // Un serveur sans la colonne sous_groupe (SQL pas encore relance) ne
          // renvoie pas la cle : le choix local reste.
          var sousDistant = Object.prototype.hasOwnProperty.call(d, 'sous') && d.sous !== null
            ? sousGroupeSur(d.sous) : (local ? local.sousGroupe : undefined);
          if (local && local.nom === d.nom && local.groupe === d.groupe &&
              (local.alias || null) === (d.alias || null) && local.sousGroupe === sousDistant) return;
          if (local && local.nom !== d.nom) delete customExercises[local.nom];
          customExercises[d.nom] = { nom:d.nom, groupe:d.groupe || 'Autre', alias:d.alias || null };
          if (typeof sousDistant === 'string') customExercises[d.nom].sousGroupe = sousDistant;
          nouveaux++;
        });
        if (nouveaux){
          saveCustom();
          rebuildLower();
          populateDatalist();
          renderDayPanel(true);
        }
        return nouveaux;
      });
    }

    // Les titres partent a part, comme les noms d'exercices : un appel
    // separe echoue seul, et les journees passent quand meme.
    function titresLocaux(){
      return Object.keys(state.sessions).filter(function(ds){
        var t = state.sessions[ds].titre;
        return typeof t === 'string' && t.trim();
      });
    }

    function pousserTitres(){
      if (!user) return Promise.resolve();
      var m = lireMeta();
      var dates = Object.keys(m.titres || {});
      if (!dates.length) return Promise.resolve();
      return client().then(function(c){
        var chaine = Promise.resolve();
        dates.forEach(function(ds){
          chaine = chaine.then(function(){
            var t = (state.sessions[ds] && state.sessions[ds].titre) || null;
            return c.rpc('pousser_titre', { p_date:ds, p_titre:t }).then(function(r){
              if (r.error) throw r.error;
              // La date ne quitte la file qu'apres confirmation du serveur.
              majMeta(function(x){ if (x.titres) delete x.titres[ds]; });
            });
          });
        });
        return chaine;
      });
    }

    // Les fins de séance partent à part, comme les titres : un appel séparé
    // échoue seul, et les journées passent quand même.
    function pousserFins(){
      if (!user) return Promise.resolve();
      var dates = Object.keys(lireMeta().fins || {});
      if (!dates.length) return Promise.resolve();
      return client().then(function(c){
        var chaine = Promise.resolve();
        dates.forEach(function(ds){
          chaine = chaine.then(function(){
            var f = (state.sessions[ds] && state.sessions[ds].termine) || null;
            return c.rpc('pousser_fin', { p_date:ds, p_fin:f }).then(function(r){
              if (r.error) throw r.error;
              majMeta(function(x){ if (x.fins) delete x.fins[ds]; });
            });
          });
        });
        return chaine;
      });
    }

    function marquerFin(ds){
      if (!dispo()) return;
      majMeta(function(m){ m.fins = m.fins || {}; m.fins[ds] = 1; });
      if (user) planifier(2500);
    }

    function marquerTitre(ds){
      if (!dispo()) return;
      majMeta(function(m){ m.titres = m.titres || {}; m.titres[ds] = 1; });
      if (user) planifier(2500);
    }

    function marquerExos(){
      if (!dispo()) return;
      majMeta(function(m){ m.exosSales = true; });
      if (user) planifier(2500);
    }

    function synchroniser(){
      if (!user) return Promise.resolve();
      return tirer(false)
        .then(pousser)
        .then(function(){
          return lireMeta().exosSales ? pousserExos().catch(function(){}) : null;
        })
        .then(function(){ return pousserTitres().catch(function(){}); })
        .then(function(){ majUI(); })
        .catch(function(e){ echec = messageErreur(e); majUI(); });
    }

    // ----------------------------------------------------------- migration
    // Non destructive par construction : le local est le cache de l'app, donc
    // rien n'y est jamais efface. Et la migration n'est declaree reussie
    // qu'apres avoir relu le cloud et compte les series une a une.
    function migrer(){
      if (!user) return Promise.reject(new Error('Pas connecte'));
      msgCompte('warn', 'Migration en cours…');
      return client().then(function(c){ return c.rpc('tirer_jours', { p_depuis:null }); })
        .then(function(r){
          if (r.error) throw r.error;
          var distant = r.data || {}, repris = 0;
          Object.keys(distant).forEach(function(ds){
            var cloud = jourDistant(ds, distant[ds]);
            var local = state.sessions[ds];
            // Journee presente des deux cotes : on garde la plus fournie, et
            // on met l'autre de cote au lieu de l'ecraser.
            if (!local || compterJour(cloud) > compterJour(local)){
              if (local && compterJour(local)) garderConflit(ds, local);
              state.sessions[ds] = cloud; repris++;
            } else if (compterJour(cloud)) {
              garderConflit(ds, distant[ds]);
            }
          });
          saveLocal(); renderAll();
          // Migrer, c'est envoyer TOUT le carnet, pas seulement les series.
          // Les titres et les noms d'exercices inventes n'avaient jamais ete
          // marques — ils ne partaient donc jamais, et quelqu'un qui utilisait
          // l'app depuis des mois les perdait en creant son compte.
          majMeta(function(m){
            m.sales = m.sales || {};
            Object.keys(state.sessions).forEach(function(ds){ m.sales[ds] = 1; });
            m.titres = m.titres || {};
            titresLocaux().forEach(function(ds){ m.titres[ds] = 1; });
            m.exosSales = true;
          });
          return pousser().then(function(){ return repris; });
        })
        .then(function(repris){
          if (nbSales()) throw new Error(nbSales() + ' journee(s) n ont pas pu partir');
          var titresEnAttente = Object.keys(lireMeta().titres || {}).length;
          if (titresEnAttente) throw new Error(titresEnAttente + ' titre(s) n ont pas pu partir');
          return verifier().then(function(){ return repris; });
        })
        .then(function(repris){
          majMeta(function(m){ m.migrePour = user.id; });
          majUI();
          msgCompte('ok', 'Migration verifiee. Tes seances sont sur ton compte' +
            (repris ? ', et ' + repris + ' journee(s) du cloud ont ete reprises ici' : '') +
            '. Rien n a ete efface sur cet appareil.');
        })
        .catch(function(e){
          majUI();
          msgCompte('err', 'Migration interrompue : ' + messageErreur(e) +
            '. Aucune donnee locale n a ete touchee — tu peux reessayer.');
        });
    }

    // Relit le cloud et compare serie par serie. Sans cette etape, « migre »
    // ne voudrait dire que « les requetes n ont pas renvoye d erreur ».
    function verifier(){
      return client().then(function(c){ return c.rpc('tirer_jours', { p_depuis:null }); })
        .then(function(r){
          if (r.error) throw r.error;
          var distant = r.data || {}, manquants = [];
          Object.keys(state.sessions).forEach(function(ds){
            var local = state.sessions[ds];
            if (!compterJour(local)) return;
            var d = distant[ds];
            if (!d || compterJour(jourDistant(ds, d)) !== compterJour(local)) manquants.push(ds);
          });
          if (manquants.length){
            throw new Error(manquants.length + ' journee(s) non confirmee(s) cote cloud');
          }
          return true;
        });
    }

    // ---------------------------------------------------------------- auth
    // Le pseudo vit dans les metadonnees du compte : une table de plus pour
    // une chaine de 24 caracteres serait une surface a securiser pour rien.
    function pseudoDe(u){
      var m = u && u.user_metadata;
      var p = m && m.pseudo;
      return (typeof p === 'string' && p.trim()) ? p.trim() : '';
    }
    function nomAffiche(){
      if (!user) return '';
      return pseudoDe(user) || user.email;
    }
    function enregistrerPseudo(p){
      if (!user) return Promise.reject(new Error('Pas connecte'));
      var v = String(p || '').trim().slice(0, 24);
      return client().then(function(c){
        return c.auth.updateUser({ data:{ pseudo:v } });
      }).then(function(r){
        if (r.error) throw r.error;
        user = r.data.user;
        return toucherProfil();
      }).then(function(){
        majUI();
        showToast(v ? 'Salut ' + v + ' !' : 'Pseudo retire');
      });
    }

    // ------------------------------------------------- mot de passe oublie
    function envoyerLienMdp(email){
      loader('Envoi du lien…');
      return client().then(function(c){
        // Le lien doit revenir sur cette page exacte, pas sur une autre : la
        // preuve PKCE est dans le stockage de ce navigateur.
        return c.auth.resetPasswordForEmail(String(email || '').trim(), {
          redirectTo: location.origin + location.pathname
        });
      }).then(function(r){
        cacherLoader();
        if (r.error) throw r.error;
        msgCompte('ok', 'Lien envoye. Regarde ta boite mail, et tes indesirables.');
      }, function(e){ cacherLoader(); throw e; });
    }
    function changerMdp(mdp){
      loader('Enregistrement…');
      return client().then(function(c){
        return c.auth.updateUser({ password: String(mdp || '') });
      }).then(function(r){
        if (r.error) throw r.error;
        user = r.data.user;
        return apresConnexion();
      }).then(function(){
        cacherLoader();
        modeAccueil('connexion');
        fermerAccueil();
        showToast('Mot de passe change');
      }, function(e){ cacherLoader(); throw e; });
    }

    // L'ecran d'accueil sert trois formulaires. Un seul est visible a la fois :
    // trois panneaux empiles feraient defiler l'utilisateur pour rien.
    function modeAccueil(mode){
      ['Connexion','Oubli','Nouveau'].forEach(function(m){
        var el = document.getElementById('mode' + m);
        if (el) el.hidden = (m.toLowerCase() !== mode);
      });
      var msg = document.getElementById('compteMsg');
      if (msg) msg.hidden = true;
      var sans = document.getElementById('blocSansCompte');
      // « Commencer sans compte » est en tete, au-dessus des formulaires : il
      // n'accompagne que la connexion. Au milieu d'un oubli ou d'un changement
      // de mot de passe, il abandonnerait l'operation a mi-chemin.
      if (sans) sans.hidden = (mode !== 'connexion');
    }

    function messageErreur(e){
      var m = (e && (e.message || e.error_description)) || 'erreur inconnue';
      if (/fetch|network|Failed to fetch/i.test(m)) return 'pas de connexion';
      if (/Invalid login credentials/i.test(m))     return 'email ou mot de passe incorrect';
      if (/User already registered/i.test(m))       return 'un compte existe deja avec cet email';
      if (/Password should be/i.test(m))            return 'mot de passe trop court (8 caracteres minimum)';
      if (/Email (logins|signups) are disabled/i.test(m))
        return 'la connexion par email n est pas encore activee cote serveur';
      if (/Email not confirmed/i.test(m))            return 'confirme d abord ton adresse par email';
      if (/Error sending/i.test(m))
        return 'le mail n a pas pu partir — l envoyeur n est pas encore configure';
      if (/Trop d envois/i.test(m))                 return 'trop d envois en peu de temps — reessaie dans une heure';
      if (/For security purposes|rate limit|Too many requests|over_email_send_rate/i.test(m))
        return 'trop de tentatives — reessaie dans quelques minutes';
      if (/same as the old password|should be different/i.test(m))
        return 'choisis un mot de passe different de l ancien';
      // Une table ou une fonction absente : le SQL de mise a jour n'a pas
      // ete passe. Le dire, plutot que d'afficher un code d'erreur.
      if (/PGRST20[25]|Could not find the (table|function)|does not exist/i.test(m))
        return 'pas encore activé sur le serveur (la mise à jour SQL n\'a pas été passée)';
      if (/Auth session missing|session_not_found/i.test(m))
        return 'ce lien a expire — redemande-en un';
      return m;
    }
    // Entre « compte cree » et une app utilisable, il y a un aller-retour
    // reseau. Sans ce voile, l'utilisateur voit un ecran vide et croit que
    // ses seances ont disparu.
    function loader(texte){
      var el = document.getElementById('loader');
      if (!el) return;
      document.getElementById('loaderTexte').textContent = texte || 'Un instant…';
      el.hidden = false;
    }
    function cacherLoader(){
      var el = document.getElementById('loader');
      if (el) el.hidden = true;
    }
    function montrerAccueil(){
      var el = document.getElementById('accueil');
      if (el) el.hidden = false;
    }
    function fermerAccueil(){
      var el = document.getElementById('accueil');
      if (el) el.hidden = true;
      majMeta(function(m){ m.accueilVu = true; });
    }

    // Le seul emplacement de message est dans l'ecran d'accueil. Une fois
    // celui-ci ferme, ecrire dedans revient a ne rien dire : on bascule sur
    // le toast, qui est visible partout dans l'app.
    function msgCompte(kind, texte){
      var el = document.getElementById('compteMsg');
      var ac = document.getElementById('accueil');
      if (!el || !ac || ac.hidden){ showToast(texte); return; }
      el.className = 'sheet-msg ' + kind;
      el.textContent = texte;
      el.hidden = false;
    }

    function connecter(email, mdp){
      loader('Connexion…');
      return client().then(function(c){
        return c.auth.signInWithPassword({ email:email, password:mdp });
      }).then(function(r){
        if (r.error) throw r.error;
        user = r.data.user;
        return apresConnexion();
      }).then(function(){ cacherLoader(); fermerAccueil(); },
              function(e){ cacherLoader(); throw e; });
    }
    // La politique de confidentialite promet un accord explicite avant toute
    // creation de compte. Une promesse ecrite dans un document juridique se
    // tient : la case est obligatoire, et l'accord est date en base.
    function enregistrerConsentement(){
      if (!sb || !user) return Promise.resolve();
      return sb.from('consentements').insert({
        user_id: user.id, type:'compte-et-synchronisation',
        version_politique: VERSION_POLITIQUE
      }).then(function(){}, function(){ /* l'inscription reste valide */ });
    }

    function inscrire(email, mdp, pseudo){
      loader('Création de ton compte…');
      return client().then(function(c){
        return c.auth.signUp({ email:email, password:mdp,
                               options:{ data:{ pseudo:String(pseudo || '').trim().slice(0, 24) } } });
      }).then(function(r){
        if (r.error) throw r.error;
        if (!r.data.session){
          cacherLoader();
          msgCompte('warn', 'Compte cree. Confirme ton adresse par email, puis connecte-toi.');
          return;
        }
        user = r.data.user;
        var p = pseudoDe(user);
        loader(p ? 'Bienvenue ' + p + ' — préparation de ton carnet…' : 'Préparation de ton carnet…');
        return enregistrerConsentement().then(apresConnexion).then(function(){
          cacherLoader(); fermerAccueil();
        });
      }, function(e){ cacherLoader(); throw e; });
    }
    function deconnecter(){
      // Le carnet affiche appartient a celui qui part. Le laisser en place le
      // montrerait au suivant — y compris a quelqu'un qui ouvre l'app sans
      // compte du tout, ce qui est le cas le plus courant sur un telephone
      // qu'on prete.
      //
      // Il etait ecrit ici que les effacer serait une perte de donnees. C'etait
      // vrai tant qu'il n'existait aucun endroit ou les mettre : maintenant il
      // y en a un. Range, pas efface — la reconnexion le ramene entier, y
      // compris les journees jamais parties sur le compte.
      var partant = lireMeta().userId || null;
      var enAttente = nbSales();
      return client().then(function(c){ return c.auth.signOut(); }).then(function(){
        user = null;
        profil = null;
        profilCharge = null;
        var range = 0;
        if (partant){
          range = rangerCarnet(partant);
          viderCarnet();
          // Quelqu'un a pu se servir de l'app sans compte avant de se
          // connecter : son carnet a lui revient.
          reprendreCarnet('anon');
          renderAll();
        }
        majMeta(function(m){ m.userId = null; m.depuis = null; });
        majUI();
        msgCompte('ok', range
          ? 'Deconnecte. Ton carnet (' + range + ' journee(s)) est mis de cote sur cet appareil et revient a ta prochaine connexion' +
            (enAttente ? ', les journees pas encore envoyees comprises.' : '.')
          : 'Deconnecte.');
      });
    }

    // ------------------------------------------------ un carnet par compte
    // Le carnet local vit sous une seule cle, partagee par tout l'appareil.
    // Tant qu'une personne egale un appareil, ca ne se voit pas. Des que deux
    // comptes se connectent sur le meme telephone, le second voit le carnet du
    // premier — et l'app lui propose meme de l'envoyer sur SON compte, ce qui
    // en change le proprietaire pour de bon.
    //
    // La regle est donc : le carnet suit le compte, pas l'appareil. Quand on
    // se connecte avec un autre compte que le dernier, le carnet present est
    // mis de cote sous l'identifiant de son proprietaire, et celui du nouvel
    // arrivant est repris s'il en avait un ici.
    //
    // Rien n'est efface. Un carnet range est range sous une cle nouvelle, que
    // seul son proprietaire retrouvera en se reconnectant — ce qui est aussi
    // la bonne regle de confidentialite : l'autre compte ne doit pas pouvoir
    // le recuperer.
    function clePark(id){ return 'topset_carnet_' + id; }

    function joursRemplis(sessions){
      return Object.keys(sessions || {}).filter(function(ds){
        return compterJour(sessions[ds]) > 0;
      }).length;
    }

    function rangerCarnet(id){
      var m = lireMeta();
      var jours = joursRemplis(state.sessions);
      // Ne jamais ecraser un rangement plus riche : si quelqu'un enchaine les
      // connexions, la premiere mise de cote est celle qui contient tout.
      try {
        var deja = JSON.parse(localStorage.getItem(clePark(id)) || 'null');
        if (deja && (deja.jours || 0) > jours) return deja.jours || 0;
      } catch(e){}
      try {
        localStorage.setItem(clePark(id), JSON.stringify({
          sessions: state.sessions,
          custom:   customExercises,
          sales:    m.sales  || {},
          titres:   m.titres || {},
          depuis:   m.depuis || null,
          jours:    jours,
          range_le: new Date().toISOString()
        }));
      } catch(e){ return 0; }
      return jours;
    }

    function reprendreCarnet(id){
      var p = null;
      try { p = JSON.parse(localStorage.getItem(clePark(id)) || 'null'); } catch(e){ return 0; }
      if (!p || !p.sessions || typeof p.sessions !== 'object') return 0;
      state.sessions = normalizeLocal(p.sessions);
      customExercises = (p.custom && typeof p.custom === 'object') ? p.custom : {};
      saveLocal(); saveCustom(); rebuildLower(); populateDatalist();
      majMeta(function(m){
        m.sales  = p.sales  || {};
        m.titres = p.titres || {};
        m.depuis = p.depuis || null;
      });
      try { localStorage.removeItem(clePark(id)); } catch(e){}
      return joursRemplis(state.sessions);
    }

    function viderCarnet(){
      state.sessions = {};
      customExercises = {};
      saveLocal(); saveCustom(); rebuildLower(); populateDatalist();
      // La file d'envoi et le curseur appartiennent au carnet qu'on vient de
      // ranger : les garder ferait pousser les journees d'un compte vers
      // l'autre a la premiere synchro.
      majMeta(function(m){ m.sales = {}; m.titres = {}; m.depuis = null; });
    }

    function apresConnexion(){
      var m = lireMeta();
      var joursLocaux = joursRemplis(state.sessions);

      // Le carnet anonyme — celui de quelqu'un qui s'est servi de l'app sans
      // compte — est mis de cote lui aussi quand un compte prend la main, mais
      // seulement s'il a deja servi a un AUTRE compte auparavant. S'il s'agit
      // de la premiere connexion de cette personne, ce carnet est le sien : le
      // flux de migration existant lui propose de l'envoyer sur son compte, et
      // c'est exactement ce qu'on veut.
      if (!m.userId && m.migrePour && m.migrePour !== user.id && joursLocaux){
        rangerCarnet('anon');
        viderCarnet();
        reprendreCarnet(user.id);
        joursLocaux = joursRemplis(state.sessions);
        majMeta(function(x){ x.userId = user.id; x.migrePour = user.id; });
        renderAll();
        m = lireMeta();
      }

      // Un autre compte s'est connecte ici avant. Le carnet affiche n'est pas
      // celui de la personne qui arrive : on echange avant tout le reste, et
      // surtout avant que la proposition d'envoi ne s'affiche — sans quoi on
      // proposerait a quelqu'un d'envoyer le carnet d'autrui sur son compte.
      if (m.userId && m.userId !== user.id){
        var ranges = rangerCarnet(m.userId);
        viderCarnet();
        var repris = reprendreCarnet(user.id);
        majMeta(function(x){ x.userId = user.id; x.migrePour = user.id; });
        toucherProfil().then(majUI);
        renderAll();
        var mot = ranges
          ? 'Le carnet qui etait sur cet appareil appartient a un autre compte : ' +
            ranges + ' journee(s) mises de cote, rien n\'est perdu. '
          : '';
        mot += repris
          ? 'Ton carnet local est revenu (' + repris + ' journee(s)).'
          : 'Recuperation de tes seances…';
        msgCompte('ok', mot);
        loader('Récupération de tes séances…');
        return tirerExos().then(pousserExos).catch(function(){ /* les seances priment */ })
          .then(function(){ return tirer(true); }).then(function(n){
            cacherLoader();
            msgCompte('ok', mot + (n ? ' ' + n + ' journee(s) recuperee(s) depuis ton compte.' : ''));
            majUI();
          }).catch(function(e){ cacherLoader(); msgCompte('err', messageErreur(e)); });
      }

      // Meme compte qu'avant, mais le carnet a ete range a la deconnexion :
      // on le reprend avant de tirer le cloud, sinon les journees jamais
      // envoyees seraient invisibles jusqu'a ce qu'on les retape.
      if (m.userId === user.id && !joursLocaux && reprendreCarnet(user.id)){
        joursLocaux = joursRemplis(state.sessions);
        renderAll();
      }
      majMeta(function(x){ x.userId = user.id; });
      // Sans attendre : le profil sert a l'administration et au futur lien
      // coach, jamais a afficher le carnet. Rien ne doit patienter dessus.
      toucherProfil().then(majUI);
      majUI();
      // Jamais de migration automatique : l'appareil a peut-etre servi a
      // quelqu'un d'autre, et ses seances ne doivent pas atterrir ici.
      if (m.migrePour !== user.id && joursLocaux){
        msgCompte('warn', 'Connecte. ' + joursLocaux + ' journee(s) sont enregistrees sur cet appareil — ' +
                          'appuie sur « ENVOYER … » pour les mettre sur ton compte.');
        // Le bouton est dans le panneau. Dire « appuie sur ENVOYER » sans
        // montrer ce bouton, c'est envoyer quelqu'un chercher une porte
        // fermee : on ouvre le panneau a sa place.
        setTimeout(openProfil, 400);
        return Promise.resolve();
      }
      majMeta(function(x){ x.migrePour = user.id; });
      loader('Récupération de tes séances…');
      return tirerExos().then(pousserExos).catch(function(){ /* les seances priment */ })
        .then(function(){ return tirer(true); }).then(function(n){
        msgCompte('ok', n ? n + ' journee(s) recuperee(s) depuis ton compte.' : 'Tout est deja a jour.');
        majUI();
      }).catch(function(e){ msgCompte('err', messageErreur(e)); });
    }

    // ------------------------------------------------------------------ UI
    function majUI(){
      var sec = document.getElementById('compteSection');
      if (!sec) return;
      sec.hidden = !dispo();
      var indispo = document.getElementById('compteIndispo');
      if (indispo) indispo.hidden = dispo();
      // Sans comptes, personne a qui ecrire : la bulle menerait a un
      // formulaire de connexion qui ne peut pas aboutir.
      var bulle = document.getElementById('messagesBtn');
      if (bulle) bulle.hidden = !dispo();
      if (!dispo()) return;

      var etat  = document.getElementById('compteEtat');
      var texte = document.getElementById('compteEtatTexte');
      var deco  = document.getElementById('compteDeco');
      var co    = document.getElementById('compteCo');
      var mig   = document.getElementById('compteMigrer');
      var note  = document.getElementById('compteNote');

      deco.hidden = !!user;
      co.hidden   = !user;
      if (typeof majBadgeMessages === 'function') majBadgeMessages();

      var ou = document.getElementById('dataOu');
      if (!user){
        etat.className = 'sheet-etat';
        texte.textContent = 'Pas de compte — tout reste sur cet appareil';
        if (ou) ou.textContent = 'Tes séances sont stockées dans ce navigateur, sur cet appareil ' +
          'uniquement. Vider les données du site, changer de téléphone ou désinstaller ' +
          'l\'app les efface définitivement. Garde une copie du fichier quelque part.';
        return;
      }
      var qui = nomAffiche();
      // Ce paragraphe affirmait « sur cet appareil uniquement » meme connecte.
      // C'etait faux, et faux au pire endroit : celui ou l'on verifie si ses
      // seances sont a l'abri.
      if (ou) ou.textContent = 'Tes séances sont sur ton compte ' + user.email +
        '. Reconnecte-toi depuis n\'importe quel téléphone et elles reviennent. ' +
        'Une copie reste sur cet appareil pour que l\'app marche sans réseau.';
      var champPseudo = document.getElementById('compteMonPseudo');
      if (champPseudo && document.activeElement !== champPseudo) champPseudo.value = pseudoDe(user);

      // L'entree n'apparait que pour un administrateur, mais ce n'est pas ce
      // qui protege quoi que ce soit : les quatre fonctions verifient le role
      // en base. Ici on evite juste d'afficher un bouton qui echouerait.
      var boutonAdmin = document.getElementById('compteAdmin');
      if (boutonAdmin) boutonAdmin.hidden = !estAdmin();
      if (typeof majCoachUI === 'function') majCoachUI();

      var joursLocaux = Object.keys(state.sessions).filter(function(ds){
        return compterJour(state.sessions[ds]) > 0;
      }).length;
      var dejaMigre = lireMeta().migrePour === user.id;
      var aMigrer = joursLocaux && !dejaMigre;

      // « Tout est synchronise » ne se dit que si c'est vrai. Une migration en
      // attente doit se voir : c'est justement le moment ou l'utilisateur croit
      // etre a l'abri alors que ses seances ne sont encore que sur le telephone.
      var attente = nbSales() + Object.keys(lireMeta().titres || {}).length;
      if (echec)        { etat.className = 'sheet-etat hs';      texte.textContent = qui + ' — ' + echec; }
      else if (enCours) { etat.className = 'sheet-etat attente'; texte.textContent = qui + ' — envoi en cours…'; }
      else if (aMigrer) { etat.className = 'sheet-etat attente'; texte.textContent = qui + ' — ' + joursLocaux + ' journée(s) pas encore envoyée(s) sur ton compte'; }
      else if (attente) { etat.className = 'sheet-etat attente'; texte.textContent = qui + ' — ' + attente + ' journée(s) en attente d’envoi'; }
      else              { etat.className = 'sheet-etat ok';      texte.textContent = qui + ' — tout est synchronisé'; }

      mig.hidden = !aMigrer;
      if (!mig.hidden){
        mig.textContent = 'ENVOYER ' + joursLocaux + (joursLocaux > 1 ? ' JOURNÉES' : ' JOURNÉE') + ' SUR MON COMPTE';
        mig.className = 'btn-sheet primary';
      }
      note.textContent = 'Tes séances restent aussi sur cet appareil : le compte ne les remplace pas, ' +
                         'il en garde une copie pour tes autres téléphones.';
    }

    // -------------------------------------------------------------- demarrage
    // Un lien de recuperation arrive avec un code dans l'URL. Il faut le
    // reconnaitre AVANT toute autre decision d'affichage : sinon on montre
    // l'ecran de connexion a quelqu'un qui vient justement de cliquer sur
    // « j'ai oublie mon mot de passe ».
    function lienRecuperation(){
      return /[?&]code=/.test(location.search) || /[#&]type=recovery/.test(location.hash);
    }

    function demarrer(){
      if (!dispo()) { majUI(); return; }
      majUI();
      if (lienRecuperation()){
        montrerAccueil();
        modeAccueil('nouveau');
        loader('Vérification du lien…');
        client().then(function(){
          cacherLoader();
          // L'URL garde le code apres usage : un rechargement le rejouerait
          // et echouerait, ce qui ressemblerait a un lien casse.
          history.replaceState(null, '', location.pathname);
          if (!user) msgCompte('err', 'Ce lien a expiré ou a déjà servi. Redemande-en un.');
        }, function(e){
          cacherLoader();
          msgCompte('err', messageErreur(e));
        });
        return;
      }
      // L'ecran d'accueil ne s'affiche qu'a la toute premiere visite : ni pour
      // qui est deja connecte, ni pour qui a deja un carnet ici, ni pour qui a
      // deja choisi. Le reproposer a chaque ouverture serait du harcelement.
      if (!sessionStockee() && !lireMeta().accueilVu &&
          !Object.keys(state.sessions).length){
        montrerAccueil();
      }
      if (!sessionStockee()) return;
      client().then(function(){
        majUI();
        if (!user) return;
        synchroniser();
        // Une session restauree est une ouverture comme une autre : c'est ici
        // que se date la visite, et ici qu'on apprend qu'on est administrateur.
        // Ne le faire que dans apresConnexion() revenait a ne compter que les
        // gens qui viennent de taper leur mot de passe — c'est-a-dire presque
        // personne, puisque la session dure des semaines. La pastille a pu
        // demander le profil juste avant : une seule visite datee, pas deux.
        profilConnu().then(majUI);
      }).catch(function(){ /* hors ligne au demarrage : le local suffit */ });

      // La reconnexion relance ce qui attend. C'est tout le mecanisme de retry :
      // rien n'est perdu entre-temps, la file vit dans localStorage.
      window.addEventListener('online', function(){ echec = ''; if (user) synchroniser(); });
      document.addEventListener('visibilitychange', function(){
        if (!document.hidden && user) synchroniser();
      });
    }

    // ------------------------------------------------------------- profil
    // Le pseudo continue de vivre dans les metadonnees du compte. La table
    // profils n'en est qu'un miroir interrogeable, plus une date de derniere
    // visite : auth.users n'est pas lisible depuis le navigateur, donc sans
    // ce miroir personne ne peut savoir qui est revenu cette semaine, ni
    // meme afficher le pseudo de quelqu'un d'autre.
    var profil = null;
    var profilCharge = null;   // la derniere lecture du profil, en cours ou finie
    function toucherProfil(){
      if (!user){ profil = null; profilCharge = null; return Promise.resolve(null); }
      return profilCharge = client().then(function(c){
        return c.rpc('toucher_profil', { p_pseudo: pseudoDe(user) || null });
      }).then(function(r){
        if (r.error) throw r.error;
        profil = r.data || null;
        return profil;
      }).catch(function(){
        // Le schema n'a peut-etre pas encore ete passe sur la base. Un profil
        // absent ne doit rien empecher : le carnet et la synchro marchaient
        // avant qu'il existe, ils doivent continuer sans lui.
        profil = null;
        return null;
      });
    }
    function estAdmin(){ return !!(profil && profil.role === 'admin'); }
    // Ce qui depend du role attend de le connaitre. La pastille se comptait
    // avant l'arrivee du profil : l'administrateur etait compte comme un
    // membre, sur son propre fil qu'il n'ouvre jamais, et la pastille restait
    // allumee sur un message que personne ne pouvait lire.
    function profilConnu(){ return profilCharge || toucherProfil(); }

    // ------------------------------------------------------------ retours
    // Insertion directe plutot qu'une fonction : la policy WITH CHECK impose
    // deja user_id = auth.uid(), et les contraintes de la table bornent le
    // type et la longueur. Une fonction n'ajouterait aucune garantie.
    function envoyerRetour(type, corps, contexte){
      if (!user) return Promise.reject(new Error('Connecte-toi pour envoyer un retour.'));
      return client().then(function(c){
        return c.from('retours').insert({
          user_id: user.id,
          type:    type,
          corps:   String(corps || '').trim().slice(0, 4000),
          contexte: contexte || {}
        });
      }).then(function(r){ if (r.error) throw r.error; });
    }
    function mesRetours(){
      if (!user) return Promise.resolve([]);
      return client().then(function(c){
        return c.from('retours')
                .select('type,corps,statut,cree_le')
                .order('cree_le', { ascending:false })
                .limit(20);
      }).then(function(r){ if (r.error) throw r.error; return r.data || []; });
    }

    // ----------------------------------------------------- administration
    // Les quatre fonctions verifient elles-memes le role cote base. Ce qui
    // suit n'est qu'un tuyau : cacher le bouton n'a jamais protege personne.
    function rpcAdmin(nom, args){
      return client().then(function(c){ return c.rpc(nom, args || {}); })
        .then(function(r){ if (r.error) throw r.error; return r.data; });
    }

    return {
      demarrer:demarrer, marquerSale:marquerSale, majUI:majUI, estAdmin:estAdmin,
      estCoach:function(){ return !!(profil && profil.est_coach); },
      codeCoach:function(){ return profil && profil.code_coach; },
      devenirCoach:function(){
        return rpcAdmin('devenir_coach').then(function(code){
          if (profil) profil.est_coach = true, profil.code_coach = code;
          return code;
        });
      },
      cesserCoach:function(){
        return rpcAdmin('cesser_coach').then(function(){
          if (profil) profil.est_coach = false, profil.code_coach = null;
        });
      },
      demanderCoach:function(code){
        // Sans la version, la base enregistrait l'accord de coaching sous « 1 »,
        // une politique qui n'a jamais existe.
        return rpcAdmin('demander_coach', { p_code: String(code || '').toUpperCase().trim(),
                                            p_version_politique: VERSION_POLITIQUE });
      },
      repondreDemande:function(lien, oui){
        return rpcAdmin('repondre_demande', { p_lien: lien, p_accepte: !!oui });
      },
      revoquerLien:function(lien){ return rpcAdmin('revoquer_lien', { p_lien: lien }); },
      mesCoaches:function(){ return rpcAdmin('mes_coaches'); },
      monCoach:function(){ return rpcAdmin('mon_coach'); },
      tirerJoursDe:function(client){ return rpcAdmin('tirer_jours_de', { p_client: client }); },
      envoyerRetour:envoyerRetour, mesRetours:mesRetours,

      // Le fil appartient au membre des deux cotes : quand l'administrateur
      // repond, la ligne porte quand meme le user_id du membre. C'est pour ca
      // que la fonction prend une cible explicite.
      lireFil:function(cible){
        var qui = cible || (user && user.id);
        if (!qui) return Promise.resolve([]);
        return client().then(function(c){
          return c.from('messages_support')
                  .select('id,auteur,corps,lu,cree_le,retour_id')
                  .eq('user_id', qui)
                  .order('cree_le', { ascending:true })
                  .limit(300);
        }).then(function(r){ if (r.error) throw r.error; return r.data || []; });
      },
      envoyerMessage:function(corps, cible, commeAdmin){
        var qui = cible || (user && user.id);
        if (!qui) return Promise.reject(new Error('Connecte-toi pour ecrire.'));
        return client().then(function(c){
          return c.from('messages_support').insert({
            user_id: qui,
            auteur:  commeAdmin ? 'admin' : 'membre',
            corps:   String(corps || '').trim().slice(0, 4000)
          });
        }).then(function(r){ if (r.error) throw r.error; });
      },
      marquerLus:function(ids){
        if (!ids || !ids.length) return Promise.resolve();
        return client().then(function(c){
          return c.from('messages_support').update({ lu:true }).in('id', ids);
        }).then(function(r){ if (r.error) throw r.error; });
      },
      userId:function(){ return user ? user.id : null; },

      // Le dernier message du fil de support du membre, et ce qu'il n'a pas
      // lu : ce que l'equipe a ecrit, et l'accuse automatique.
      apercuSupport:function(){
        if (!user) return Promise.resolve(null);
        return client().then(function(c){
          return c.from('messages_support')
                  .select('auteur,corps,lu,cree_le')
                  .eq('user_id', user.id)
                  .order('cree_le', { ascending:false })
                  .limit(300);
        }).then(function(r){
          if (r.error) throw r.error;
          var rows = r.data || [];
          return { dernier: rows[0] || null,
                   nonLus: rows.filter(function(m){ return m.auteur !== 'membre' && !m.lu; }).length };
        });
      },

      // La pastille : un total, deux comptages, jamais le contenu. « head »
      // evite de rapatrier des centaines de messages pour obtenir un nombre.
      // Elle ne doit jamais casser la page : une erreur compte pour zero.
      //   · l'equipe compte ce que les membres ont ecrit, partout sauf chez elle ;
      //   · un membre compte ce qu'on lui a ecrit, dans son propre fil ;
      //   · tout le monde ajoute ses conversations de coaching.
      nonLusTotal:function(){
        if (!user) return Promise.resolve(0);
        return profilConnu().then(function(){
          if (!user) return 0;
          var admin = estAdmin();
          var support = client().then(function(c){
            var q = c.from('messages_support').select('id', { count:'exact', head:true }).eq('lu', false);
            return admin ? q.eq('auteur', 'membre').neq('user_id', user.id)
                         : q.eq('user_id', user.id).neq('auteur', 'membre');
          }).then(function(r){ return r.error ? 0 : (r.count || 0); },
                  function(){ return 0; });
          var coach = Sync.nonLusCoach().then(function(par){
            var n = 0; Object.keys(par).forEach(function(k){ n += par[k]; });
            return n;
          });
          return Promise.all([support, coach]).then(function(t){ return t[0] + t[1]; });
        });
      },
      adminFils:function(){ return rpcAdmin('admin_fils'); },

      // Le fil coach se designe par l'autre personne et par le cote ou l'on
      // se tient : c'est ce qui dit lequel des deux identifiants est le sien.
      // La base, elle, reverifie tout — le lien actif et l'auteur declare.
      lireFilCoach:function(autre, jeSuis){
        if (!user || !autre) return Promise.resolve([]);
        var coach  = jeSuis === 'coach' ? user.id : autre;
        var coache = jeSuis === 'coach' ? autre   : user.id;
        return client().then(function(c){
          return c.from('messages_coach')
                  .select('id,auteur,corps,lu,cree_le')
                  .eq('coach_id', coach).eq('client_id', coache)
                  .order('cree_le', { ascending:true })
                  .limit(300);
        }).then(function(r){ if (r.error) throw r.error; return r.data || []; });
      },
      envoyerMessageCoach:function(autre, jeSuis, corps){
        if (!user) return Promise.reject(new Error('Connecte-toi pour écrire.'));
        return client().then(function(c){
          return c.from('messages_coach').insert({
            coach_id:  jeSuis === 'coach' ? user.id : autre,
            client_id: jeSuis === 'coach' ? autre   : user.id,
            auteur:    jeSuis === 'coach' ? 'coach' : 'client',
            corps:     String(corps || '').trim().slice(0, 4000)
          });
        }).then(function(r){ if (r.error) throw r.error; });
      },
      marquerLusCoach:function(ids){
        if (!ids || !ids.length) return Promise.resolve();
        return client().then(function(c){
          return c.from('messages_coach').update({ lu:true }).in('id', ids);
        }).then(function(r){ if (r.error) throw r.error; });
      },
      // Les non-lus par personne, dans les deux sens a la fois : on peut etre
      // coach de quelqu'un et coache de quelqu'un d'autre. RLS ne rend que ses
      // propres fils ; reste a garder ce que l'AUTRE a ecrit. Jamais d'echec :
      // un compteur ne doit pas empecher une page de s'afficher.
      nonLusCoach:function(){
        if (!user) return Promise.resolve({});
        return client().then(function(c){
          return c.from('messages_coach')
                  .select('coach_id,client_id,auteur')
                  .eq('lu', false).limit(500);
        }).then(function(r){
          var par = {};
          (r.error ? [] : (r.data || [])).forEach(function(m){
            var autre = null;
            if (m.coach_id  === user.id && m.auteur === 'client') autre = m.client_id;
            if (m.client_id === user.id && m.auteur === 'coach')  autre = m.coach_id;
            if (autre) par[autre] = (par[autre] || 0) + 1;
          });
          return par;
        }, function(){ return {}; });
      },
      // Chaque conversation de coaching, avec son dernier message et ce que
      // l'autre a ecrit sans qu'on l'ait lu. RLS ne rend que les siennes ;
      // on peut etre coach de quelqu'un et coache de quelqu'un d'autre.
      apercuCoach:function(){
        if (!user) return Promise.resolve([]);
        return client().then(function(c){
          return c.from('messages_coach')
                  .select('coach_id,client_id,auteur,corps,lu,cree_le')
                  .order('cree_le', { ascending:false })
                  .limit(1000);
        }).then(function(r){
          if (r.error) throw r.error;
          var par = Object.create(null);
          (r.data || []).forEach(function(m){
            var jeSuis = m.coach_id === user.id ? 'coach' : 'client';
            var autre = jeSuis === 'coach' ? m.client_id : m.coach_id;
            var k = jeSuis + ':' + autre;
            if (!par[k]) par[k] = { jeSuis:jeSuis, autre:autre, dernier:m, nonLus:0 };
            if (m.auteur !== jeSuis && !m.lu) par[k].nonLus++;
          });
          return Object.keys(par).map(function(k){ return par[k]; });
        });
      },
      lireNotifs:function(){
        return client().then(function(c){
          return c.from('notifications_admin')
                  .select('id,type,user_id,contenu,lu,cree_le')
                  .order('cree_le', { ascending:false })
                  .limit(100);
        }).then(function(r){ if (r.error) throw r.error; return r.data || []; });
      },
      notifsLues:function(){
        return client().then(function(c){
          return c.from('notifications_admin').update({ lu:true }).eq('lu', false);
        }).then(function(r){ if (r.error) throw r.error; });
      },
      // Les messages et les retours d'un membre, une fois son fil ouvert. Les
      // inscriptions et les demandes de coaching restent : elles ne se lisent
      // pas dans une conversation.
      notifsLuesDe:function(membre){
        if (!membre) return Promise.resolve();
        return client().then(function(c){
          return c.from('notifications_admin').update({ lu:true })
                  .eq('user_id', membre).in('type', ['message', 'retour']).eq('lu', false);
        }).then(function(r){ if (r.error) throw r.error; });
      },
      adminApercu:function(){ return rpcAdmin('admin_apercu'); },
      adminMembres:function(){ return rpcAdmin('admin_membres'); },
      adminRetours:function(s){ return rpcAdmin('admin_retours', { p_statut: s || null }); },
      adminMarquer:function(id, s){ return rpcAdmin('admin_marquer_retour', { p_id:id, p_statut:s }); },
      marquerExos:marquerExos, marquerTitre:marquerTitre, marquerFin:marquerFin,
      enregistrerPseudo:enregistrerPseudo, envoyerLienMdp:envoyerLienMdp,
      changerMdp:changerMdp, modeAccueil:modeAccueil,
      montrerAccueil:montrerAccueil, fermerAccueil:fermerAccueil,
      synchroniser:synchroniser, migrer:migrer,
      connecter:connecter, inscrire:inscrire, deconnecter:deconnecter,
      messageErreur:messageErreur, msgCompte:msgCompte,
      estConnecte:function(){ return !!user; }
    };
  })();

  (function branchementsCompte(){
    var sec = document.getElementById('compteSection');
    if (!sec) return;
    function lire(){
      return {
        email: (document.getElementById('compteEmail').value || '').trim(),
        mdp:   document.getElementById('compteMdp').value || ''
      };
    }
    // L'adresse est verifiee avant d'appeler le serveur : une faute de frappe
    // se corrige sur place, pres du champ, au lieu d'un refus generique. Le
    // serveur reste seul juge (Supabase refuse aussi une adresse invalide).
    function emailValide(id){
      var champ = document.getElementById(id);
      var v = (champ.value || '').trim();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      if (ok) champ.removeAttribute('aria-invalid');
      else {
        champ.setAttribute('aria-invalid', 'true');
        Sync.msgCompte('err', v ? 'Cette adresse email ne semble pas complète (exemple : prenom@mail.fr).' : 'Donne ton adresse email.');
        champ.focus();
      }
      return ok;
    }
    ['compteEmail', 'oubliEmail'].forEach(function(id){
      var champ = document.getElementById(id);
      if (champ) champ.addEventListener('input', function(){ this.removeAttribute('aria-invalid'); });
    });
    function occupe(btn, texte, fn){
      var avant = btn.textContent;
      btn.disabled = true; btn.textContent = texte;
      fn().catch(function(e){ Sync.msgCompte('err', Sync.messageErreur(e)); })
          .then(function(){ btn.disabled = false; btn.textContent = avant; Sync.majUI(); });
    }
    document.getElementById('compteConnexion').addEventListener('click', function(){
      var v = lire();
      if (!emailValide('compteEmail')) return;
      if (!v.mdp){ Sync.msgCompte('err', 'Donne ton mot de passe.'); document.getElementById('compteMdp').focus(); return; }
      occupe(this, 'CONNEXION…', function(){ return Sync.connecter(v.email, v.mdp); });
    });
    // Dire « coche la case » sans montrer laquelle, c'est la moitie du travail :
    // l'ecran en compte une seule, mais elle est grise et discrete, et le
    // regard part vers le message rouge en bas. On la designe, et le clavier
    // arrive dessus.
    function signalerConsentement(){
      var bloc = document.getElementById('blocConsent');
      var box  = document.getElementById('compteConsent');
      if (!bloc || !box) return;
      bloc.classList.add('manque');
      box.setAttribute('aria-invalid', 'true');
      box.focus();
    }
    var caseConsent = document.getElementById('compteConsent');
    if (caseConsent){
      caseConsent.addEventListener('change', function(){
        document.getElementById('blocConsent').classList.remove('manque');
        this.removeAttribute('aria-invalid');
      });
    }

    document.getElementById('compteInscription').addEventListener('click', function(){
      var v = lire();
      if (!emailValide('compteEmail')) return;
      if (v.mdp.length < 8){ Sync.msgCompte('err', 'Choisis un mot de passe d\'au moins 8 caractères.'); return; }
      if (!document.getElementById('compteConsent').checked){
        Sync.msgCompte('err', 'Il faut accepter la politique de confidentialité et les CGU pour créer un compte — la case est juste au-dessus du bouton.');
        signalerConsentement();
        return;
      }
      var pseudo = document.getElementById('comptePseudo').value;
      occupe(this, 'CRÉATION…', function(){ return Sync.inscrire(v.email, v.mdp, pseudo); });
    });
    document.getElementById('accueilSansCompte').addEventListener('click', function(){
      Sync.fermerAccueil();
    });
    document.getElementById('accueilOubli').addEventListener('click', function(){
      document.getElementById('oubliEmail').value = document.getElementById('compteEmail').value;
      Sync.modeAccueil('oubli');
    });
    document.getElementById('oubliRetour').addEventListener('click', function(){
      Sync.modeAccueil('connexion');
    });
    document.getElementById('oubliEnvoyer').addEventListener('click', function(){
      var mail = document.getElementById('oubliEmail').value.trim();
      if (!emailValide('oubliEmail')) return;
      occupe(this, 'ENVOI…', function(){ return Sync.envoyerLienMdp(mail); });
    });
    document.getElementById('nouveauValider').addEventListener('click', function(){
      var mdp = document.getElementById('nouveauMdp').value;
      if (mdp.length < 8){ Sync.msgCompte('err', 'Choisis un mot de passe d\'au moins 8 caractères.'); return; }
      occupe(this, 'ENREGISTREMENT…', function(){ return Sync.changerMdp(mdp); });
    });
    document.getElementById('comptePseudoOk').addEventListener('click', function(){
      var p = document.getElementById('compteMonPseudo').value;
      occupe(this, '…', function(){ return Sync.enregistrerPseudo(p); });
    });
    document.getElementById('compteOuvrirAccueil').addEventListener('click', function(){
      fermerFeuilles();
      Sync.modeAccueil('connexion');
      Sync.montrerAccueil();
    });
    document.getElementById('compteSync').addEventListener('click', function(){
      occupe(this, 'SYNCHRONISATION…', function(){ return Sync.synchroniser(); });
    });
    document.getElementById('compteMigrer').addEventListener('click', function(){
      occupe(this, 'ENVOI…', function(){ return Sync.migrer(); });
    });
    document.getElementById('compteDeconnexion').addEventListener('click', function(){
      occupe(this, '…', function(){ return Sync.deconnecter(); });
    });
  })();

  init();

  // ---------- braise : un fond anime pour les moments forts ----------
  // L'accueil, le bilan (18/09/2026) et l'exercice en plein ecran (demande
  // du 19/09). Sur le plein ecran, la lueur suit l'etat : douce pendant la
  // serie, forte pendant le repos, verte ou rouge sous le swipe. Rendu a
  // demi-resolution et a 30 images/s au plus, arrete des que l'ecran se
  // cache ou que l'onglet passe en arriere-plan. Avec « reduire les
  // animations », une seule image fixe. Sans WebGL, le fond uni reste.
  (function braise(){
    var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var FS = 'precision mediump float;uniform vec2 r;uniform float t;uniform float k;uniform vec3 tn;'
      + 'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}'
      + 'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);'
      + 'return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}'
      + 'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}'
      + 'void main(){vec2 uv=gl_FragCoord.xy/r;vec2 q=vec2(uv.x*r.x/r.y,uv.y)*1.6;float s=t*.045;'
      + 'vec2 w=vec2(fbm(q+vec2(0.,s)),fbm(q+vec2(5.2,-s)));float f=fbm(q+2.2*w+vec2(s*.6,0.));'
      // La lueur vient du haut, comme la lampe au-dessus d'un banc.
      + 'float haut=smoothstep(.15,1.05,uv.y);float g=clamp(smoothstep(.35,.95,f)*(.35+.65*haut)*k,0.,1.);'
      // tn : la teinte (orange par defaut). La braise en est une version sombre.
      + 'vec3 fond=vec3(.047,.043,.039);vec3 braise=tn*vec3(.42,.333,.227);'
      + 'vec3 c=mix(fond,braise,g);c=mix(c,tn,pow(g,3.)*.55);'
      + 'c+=(h(gl_FragCoord.xy+t)-.5)/255.;gl_FragColor=vec4(c,1.);}';
    var hotes = ['bilanEcran', 'accueil', 'focus'].map(function(id){ return document.getElementById(id); }).filter(Boolean);
    if (!hotes.length || !window.WebGLRenderingContext) return;
    var calme = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches:false };

    hotes.forEach(function(hote){
      var cv = document.createElement('canvas');
      cv.className = 'braise';
      cv.setAttribute('aria-hidden', 'true');
      hote.insertBefore(cv, hote.firstChild);
      var gl = null, prog, uR, uT, uK, uTn, anim = 0, dernier = 0, debut = 0;
      // Le reglage courant glisse vers la cible : pas de saut de couleur.
      var reg = { k:1, tn:[1, .36, .22] }, cible = { k:1, tn:[1, .36, .22] };
      if (hote.id === 'focus') fondFocus = { regler:function(k, tn, direct){
        cible = { k:k, tn:tn };
        if (direct) reg = { k:k, tn:tn.slice() };
        if (gl && (calme.matches || !anim) && !hote.hidden) image(performance.now());
      } };

      function preparer(){
        gl = cv.getContext('webgl', { alpha:false, antialias:false, depth:false, powerPreference:'low-power' });
        if (!gl) return false;
        function sh(type, src){ var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; }
        var v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, FS);
        if (!v || !f) return false;
        prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
        gl.useProgram(prog);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
        var a = gl.getAttribLocation(prog, 'p');
        gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
        uR = gl.getUniformLocation(prog, 'r'); uT = gl.getUniformLocation(prog, 't');
        uK = gl.getUniformLocation(prog, 'k'); uTn = gl.getUniformLocation(prog, 'tn');
        return true;
      }
      function dimensionner(){
        // Demi-resolution : un degrade flou n'a pas besoin de chaque pixel.
        var w = Math.max(1, Math.round(hote.clientWidth / 2)), hh = Math.max(1, Math.round(hote.clientHeight / 2));
        if (cv.width !== w || cv.height !== hh){ cv.width = w; cv.height = hh; }
        gl.viewport(0, 0, w, hh); gl.uniform2f(uR, w, hh);
      }
      function image(ms){
        dimensionner();
        gl.uniform1f(uT, (ms - debut) / 1000 + 40);
        var a = calme.matches ? 1 : .12;
        reg.k += (cible.k - reg.k) * a;
        for (var i = 0; i < 3; i++) reg.tn[i] += (cible.tn[i] - reg.tn[i]) * a;
        gl.uniform1f(uK, reg.k); gl.uniform3f(uTn, reg.tn[0], reg.tn[1], reg.tn[2]);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      function boucle(ms){
        anim = requestAnimationFrame(boucle);
        if (ms - dernier < 33) return;
        dernier = ms; image(ms);
      }
      function demarrer(){
        if (hote.hidden || document.hidden) return;
        if (!gl && !preparer()){ cv.remove(); return; }
        hote.classList.add('avec-braise');
        if (!debut) debut = performance.now();
        if (calme.matches){ image(performance.now()); return; }
        if (!anim) anim = requestAnimationFrame(boucle);
      }
      function arreter(){ if (anim){ cancelAnimationFrame(anim); anim = 0; } }
      new MutationObserver(function(){ if (hote.hidden) arreter(); else demarrer(); })
        .observe(hote, { attributes:true, attributeFilter:['hidden'] });
      document.addEventListener('visibilitychange', function(){ if (document.hidden) arreter(); else demarrer(); });
      window.addEventListener('resize', function(){ if (!hote.hidden && gl && calme.matches) image(performance.now()); });
      demarrer();
    });
  })();

  // Le service worker rend l'app ouvrable dans une salle sans reseau. Il
  // exige un contexte securise : en http, il n'y a rien a enregistrer, et
  // c'est normal.
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')){
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('sw.js').catch(function(){
        // Pas de worker : l'app fonctionne exactement comme avant, en ligne.
      });
    });
  }
})();
