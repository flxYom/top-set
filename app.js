(function(){
  "use strict";

  var GROUPS = ['Pectoraux','Dos','Épaules','Bras','Jambes','Abdos','Cardio','Autre'];
  var GROUP_COLORS = {
    'Pectoraux':'#ff5c38','Dos':'#4d7cff','Épaules':'#ffd23f','Bras':'#c9a3ff',
    'Jambes':'#12c07a','Abdos':'#ff9f43','Cardio':'#ff6fae','Autre':'#b5ada0'
  };
  var EXERCISE_DB = {
    'Développé couché':'Pectoraux','Développé couché prise serrée':'Pectoraux','Développé incliné':'Pectoraux',
    'Développé incliné haltères':'Pectoraux','Développé décliné':'Pectoraux','Écarté couché haltères':'Pectoraux',
    'Écarté incliné haltères':'Pectoraux','Pec deck':'Pectoraux','Pompes':'Pectoraux',
    'Développé couché Smith machine':'Pectoraux','Cable crossover':'Pectoraux','Pull-over':'Pectoraux',
    'Écarté à la poulie':'Pectoraux','Larsen':'Pectoraux','Spoto press':'Pectoraux',

    'Soulevé de terre':'Dos','Soulevé de terre roumain':'Dos','Soulevé de terre sumo':'Dos','Tractions':'Dos',
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

    'Crunch':'Abdos','Relevé de jambes':'Abdos','Planche':'Abdos','Russian twist':'Abdos','Ab wheel':'Abdos',
    'Crunch à la poulie':'Abdos','Gainage latéral':'Abdos','Mountain climber':'Abdos','Sit-up':'Abdos',
    'V-up':'Abdos','Dragon flag':'Abdos',

    'Course à pied':'Cardio','Rameur':'Cardio','Vélo elliptique':'Cardio','Vélo':'Cardio','Corde à sauter':'Cardio',
    'Tapis de course':'Cardio','Burpees':'Cardio','Marche rapide':'Cardio','Natation':'Cardio'
  };
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
    return { nom:(valeur && valeur.nom) || nom,
             groupe:(valeur && valeur.groupe) || 'Autre',
             alias:(valeur && valeur.alias) || null };
  }

  var EXERCISE_DB_LOWER = {};
  var CUSTOM_PAR_CLE = {};
  function rebuildLower(){
    EXERCISE_DB_LOWER = {};
    CUSTOM_PAR_CLE = {};
    Object.keys(EXERCISE_DB).forEach(function(k){ EXERCISE_DB_LOWER[k.toLowerCase()] = EXERCISE_DB[k]; });
    Object.keys(customExercises).forEach(function(k){
      var info = infoExo(customExercises[k], k);
      EXERCISE_DB_LOWER[k.toLowerCase()] = info.groupe;
      CUSTOM_PAR_CLE[cleExo(k)] = { nom:info.nom || k, groupe:info.groupe, alias:info.alias };
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

  // Migration silencieuse : d'anciennes entrées ({poids,reps} directement sur
  // l'exercice) deviennent une série unique. Ne perd aucune donnée existante.
  function normalizeSerie(s, reposHerite){
    return {
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
  }

  function normalizeExercise(ex){
    // bloc reste undefined quand il n'y en a pas : un exercice seul ne porte
    // rien, et le JSON envoye au cloud n'a pas de champ vide a transporter.
    var bloc = (ex && ex.bloc) ? String(ex.bloc) : undefined;
    if (ex && Array.isArray(ex.series)){
      return { id:idSur(ex.id, genId), nom:ex.nom||'', groupe:groupeSur(ex.groupe), repos:ex.repos||'', bloc:bloc, series:ex.series.map(function(s){
        return normalizeSerie(s, ex.repos);
      }) };
    }
    var series = [];
    if (ex && (ex.poids!=null || (ex.reps!=null && String(ex.reps).trim()!==''))){
      series.push(normalizeSerie({ poids:ex.poids, reps:ex.reps }, ex.repos));
    }
    return { id:idSur(ex&&ex.id, genId), nom:(ex&&ex.nom)||'', groupe:groupeSur(ex&&ex.groupe), repos:(ex&&ex.repos)||'', bloc:bloc, series:series };
  }

  // ---------- state ----------
  var state = {
    sessions:{},
    planningWeekStart:startOfWeek(new Date()),
    selectedDay:toDateStr(new Date()),
    view:'planning',
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
    return EXERCISE_DB_LOWER[key] || null;
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
  function isNewRecord(serie, exNom){
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
      var series = [];
      state.sessions[ds].exercises.forEach(function(e){
        if (!e.nom || cleCanonique(e.nom) !== norm) return;
        (e.series||[]).forEach(function(s){ if (hasData(s)) series.push(s); });
      });
      if (series.length) out.push({ date:ds, series:series });
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
        validSeries.forEach(function(s){ byNorm[norm].push({ poids:s.poids, reps:s.reps, groupe:ex.groupe }); });
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
      return { nom:norm, groupe:groupe, maxPoids:maxPoids, repsAtMax:repsAtMax,
               bodyweight:bodyweight,
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
        var g = e.groupe || 'Autre';
        counts[g] = (counts[g]||0) + n;
      });
    });
    return counts;
  }

  // Silhouette : les groupes travailles prennent leur couleur, les autres restent eteints.
  function muscleMapSVG(counts){
    function f(g){ return (counts[g]||0) > 0 ? (GROUP_COLORS[g] || '#8a8275') : '#2f2b26'; }
    var base = '#262320', stroke = '#f0ece2';
    return '<svg width="106" height="178" viewBox="0 0 130 210" fill="none" role="img" aria-label="Groupes musculaires travailles sur la periode">'
      + '<ellipse cx="65" cy="19" rx="12" ry="13" fill="'+base+'" stroke="'+stroke+'" stroke-width="1.6"></ellipse>'
      + '<path d="M52 34 h26 v8 h-26 z" fill="'+base+'" stroke="'+stroke+'" stroke-width="1.6"></path>'
      + '<path d="M40 42 h50 l6 62 -10 18 h-42 l-10 -18 z" fill="'+base+'" stroke="'+stroke+'" stroke-width="1.6"></path>'
      + '<path d="M40 44 l-14 8 -6 52 10 4 14 -50 z" fill="'+base+'" stroke="'+stroke+'" stroke-width="1.6"></path>'
      + '<path d="M90 44 l14 8 6 52 -10 4 -14 -50 z" fill="'+base+'" stroke="'+stroke+'" stroke-width="1.6"></path>'
      + '<path d="M48 122 l-4 78 h16 l6 -60 z" fill="'+base+'" stroke="'+stroke+'" stroke-width="1.6"></path>'
      + '<path d="M82 122 l4 78 h-16 l-6 -60 z" fill="'+base+'" stroke="'+stroke+'" stroke-width="1.6"></path>'
      + '<path d="M42 66 h9 v30 l-9 -6 z" fill="'+f('Dos')+'" stroke="#0d0c0a" stroke-width="1.3"></path>'
      + '<path d="M88 66 h-9 v30 l9 -6 z" fill="'+f('Dos')+'" stroke="#0d0c0a" stroke-width="1.3"></path>'
      + '<ellipse cx="43" cy="50" rx="11" ry="9" fill="'+f('Épaules')+'" stroke="#0d0c0a" stroke-width="1.4"></ellipse>'
      + '<ellipse cx="87" cy="50" rx="11" ry="9" fill="'+f('Épaules')+'" stroke="#0d0c0a" stroke-width="1.4"></ellipse>'
      + '<path d="M47 58 h16 v16 h-11 z" fill="'+f('Pectoraux')+'" stroke="#0d0c0a" stroke-width="1.4"></path>'
      + '<path d="M67 58 h16 v16 h-5 z" fill="'+f('Pectoraux')+'" stroke="#0d0c0a" stroke-width="1.4"></path>'
      + '<ellipse cx="30" cy="76" rx="7" ry="13" fill="'+f('Bras')+'" stroke="#0d0c0a" stroke-width="1.4"></ellipse>'
      + '<ellipse cx="100" cy="76" rx="7" ry="13" fill="'+f('Bras')+'" stroke="#0d0c0a" stroke-width="1.4"></ellipse>'
      + '<path d="M55 80 h20 v28 h-20 z" fill="'+f('Abdos')+'" stroke="#0d0c0a" stroke-width="1.4"></path>'
      + '<path d="M55 89 h20 M55 98 h20 M65 80 v28" stroke="#0d0c0a" stroke-width="1.2"></path>'
      + '<path d="M52 128 h13 l-3 40 h-13 z" fill="'+f('Jambes')+'" stroke="#0d0c0a" stroke-width="1.4"></path>'
      + '<path d="M78 128 h-13 l3 40 h13 z" fill="'+f('Jambes')+'" stroke="#0d0c0a" stroke-width="1.4"></path>'
      + '</svg>';
  }

  function weekDays(){
    var out=[]; for (var i=0;i<7;i++) out.push(addDays(state.planningWeekStart,i));
    return out;
  }
  function dominantGroup(exercises){
    var counts={};
    exercises.forEach(function(e){ var g=e.groupe||'Autre'; counts[g]=(counts[g]||0)+1; });
    var best=null,bestCount=0;
    GROUPS.forEach(function(g){ if((counts[g]||0)>bestCount){ bestCount=counts[g]; best=g; } });
    return best;
  }

  function renderWeekNav(){
    var days = weekDays();
    document.getElementById('weekLabel').textContent = formatWeekRange(days[0],days[6]);
    var d = fromDateStr(state.selectedDay);
    var bd = document.getElementById('brandDate');
    if (bd) bd.innerHTML = '<b>'+DAY_ABBR[(d.getDay()+6)%7].toUpperCase()+'</b><span>'+pad2(d.getDate())+'</span>';
  }

  function renderDayPills(){
    var days = weekDays();
    var todayStr = toDateStr(new Date());
    var html = days.map(function(d,i){
      var ds = toDateStr(d);
      var day = state.sessions[ds];
      var hasAny = day && day.exercises.some(function(e){ return (e.series||[]).some(hasData); });
      var dom = hasAny ? dominantGroup(day.exercises) : null;
      var isSelected = ds === state.selectedDay;
      var isToday = ds === todayStr;
      return '<button type="button" class="day-pill'+(isSelected?' active':'')+(hasAny?' has-data':'')+'" data-date="'+ds+'">'
        + '<span class="dp-abbr">'+DAY_ABBR[i]+'</span>'
        + '<span class="dp-num">'+d.getDate()+'</span>'
        + (hasAny ? '<span class="dp-dot" style="background:'+GROUP_COLORS[dom]+'"></span>' : '')
        + (isToday ? '<span class="dp-today"></span>' : '')
        + '</button>';
    }).join('');
    document.getElementById('dayPills').innerHTML = html;
  }

  // Rend le bandeau du jour selectionne + les badges de la semaine.
  function renderWeekStats(){
    var ds = state.selectedDay;
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
    hero.innerHTML = '<div class="hero-photo"></div><div class="hero-tint"></div><div class="hero-scrim"></div><div class="hero-dots"></div>'
      + '<div class="hero-top">'
      +   '<span class="hero-kicker">'+esc(kicker.toUpperCase())+'</span>'
      +   '<span class="hero-title">'+esc(dom || 'Séance vide')+'</span>'
      + '</div>'
      + '<div class="hero-tags">'+tags+'</div>';

    var weekStrs = weekDays().map(toDateStr);
    var counts = groupCountsIn(weekStrs[0], weekStrs[6]);
    var badges = GROUPS.filter(function(g){return counts[g];}).map(function(g){
      return '<span class="badge" style="--dot:'+GROUP_COLORS[g]+'"><i></i>'+g+' ×'+counts[g]+'</span>';
    }).join('');
    document.getElementById('weekBadges').innerHTML = badges;
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

  function serieRowHTML(s, idx, exNom){
    var pr = isNewRecord(s, exNom);
    var num = idx + 1;
    var rpeOptions = '<option value="">RPE</option>' + RPE_VALUES.map(function(v){
      return '<option value="'+v+'"'+(s.rpe===v?' selected':'')+'>'+v+'</option>';
    }).join('');
    var typeCourant = s.type || '';
    var typeOptions = TYPE_LABELS.map(function(p){
      return '<option value="'+p[0]+'"'+(typeCourant===p[0]?' selected':'')+'>'+p[1]+'</option>';
    }).join('');
    return '<div class="serie-card'+(s.fait?' fait':'')+'" data-serie-id="'+ esc(s.id) +'"'
      + (typeCourant ? ' data-type="'+typeCourant+'"' : '') + '>'
      + '<div class="serie-main">'
      +   '<button type="button" class="serie-check'+(s.fait?' checked':'')+'" data-action="toggle-fait" data-serie-id="'+ esc(s.id) +'" aria-pressed="'+(s.fait?'true':'false')+'" aria-label="Série '+num+' — '+(s.fait?'marquer comme non faite':'marquer comme faite')+'">'+(s.fait?'✓':'')+'</button>'
      +   '<span class="serie-num" aria-hidden="true">'+num+'</span>'
      +   '<button type="button" class="step-btn" data-action="step" data-delta="-2.5" data-serie-id="'+ esc(s.id) +'" aria-label="Retirer 2,5 kg à la série '+num+'">−</button>'
      +   '<input type="text" inputmode="decimal" enterkeyhint="next" class="serie-poids" placeholder="kg" aria-label="Poids série '+num+'" data-field="poids" data-serie-id="'+ esc(s.id) +'" value="'+esc(poidsAffiche(s.poids))+'">'
      +   '<button type="button" class="step-btn" data-action="step" data-delta="2.5" data-serie-id="'+ esc(s.id) +'" aria-label="Ajouter 2,5 kg à la série '+num+'">+</button>'
      +   '<span class="serie-x" aria-hidden="true">×</span>'
      +   '<input type="text" inputmode="numeric" enterkeyhint="done" class="serie-reps" placeholder="reps" aria-label="Répétitions série '+num+'" data-field="reps" data-serie-id="'+ esc(s.id) +'" value="'+esc(s.reps==null?'':s.reps)+'">'
      +   (pr ? ETOILE_PR : '')
      + '</div>'
      + '<div class="serie-meta">'
      +   '<select class="serie-type" data-field="type" data-serie-id="'+ esc(s.id) +'" aria-label="Type de la série '+num+'">'+typeOptions+'</select>'
      +   '<label class="meta-field"><span>RPE</span>'
      +     '<select class="serie-rpe'+(s.rpe==null?' vide':'')+'" data-field="rpe" data-serie-id="'+ esc(s.id) +'" title="'+(s.rpe==null?'Reps en réserve : 10 = à l\'échec, 9 = 1 rep en réserve':esc(rpeLabel(s.rpe)))+'" aria-label="RPE série '+num+'">'+rpeOptions+'</select>'
      +   '</label>'
      +   '<label class="meta-field"><span>REPOS</span>'
      +     '<input type="text" inputmode="numeric" enterkeyhint="done" class="serie-repos" placeholder="90s" data-field="repos" data-serie-id="'+ esc(s.id) +'" aria-label="Repos après la série '+num+'" value="'+esc(s.repos||'')+'">'
      +   '</label>'
      +   '<button type="button" class="serie-del" data-action="del-serie" data-serie-id="'+ esc(s.id) +'" aria-label="Supprimer la série '+num+'">×</button>'
      + '</div>'
      + '</div>';
  }

  // Le bloc « derniere fois » : toutes les series de la derniere seance sur
  // cet exercice, chacune recopiable d'un tap, plus la cible suggeree quand
  // les donnees la justifient.
  //
  // Deux registres visuels distincts, et c'est volontaire : l'historique est
  // sobre et gris, la suggestion est orange et etiquetee SUGGERE. On ne doit
  // jamais pouvoir lire une recommandation comme une performance passee.
  var TYPE_COURT = {};
  TYPE_COURT[TS.TYPES.ECHAUFFEMENT] = 'ÉCH.';
  TYPE_COURT[TS.TYPES.TOP] = 'TOP';
  TYPE_COURT[TS.TYPES.BACKOFF] = 'B.O.';

  function perfTexte(s){
    var p = (typeof s.poids === 'number') ? formatWeight(s.poids) + ' kg' : '';
    var r = s.reps ? String(s.reps) : '';
    if (p && r) return p + ' × ' + r;
    return p || r || '—';
  }

  function blocPrecedentHTML(ex){
    var nom = ex && ex.nom;
    if (!nom || !nom.trim()) return '';
    var seances = seancesDeLExo(nom).filter(function(j){ return j.date !== state.selectedDay; });
    var prec = TS.performancePrecedente(seances, state.selectedDay);
    if (!prec) return '';

    var d = fromDateStr(prec.date);
    var quand = d.getDate() + ' ' + MONTH_ABBR[d.getMonth()];
    var top = prec.topSet;

    var puces = prec.series.map(function(s){
      var estTop = top && s === top;
      var tag = TYPE_COURT[TS.typeSerie(s)] || '';
      var txt = perfTexte(s);
      return '<button type="button" class="perf' + (estTop ? ' top' : '') + '"'
        + ' data-copier="' + esc(ex.id) + '"'
        + ' data-poids="' + (typeof s.poids === 'number' ? s.poids : '') + '"'
        + ' data-reps="' + esc(s.reps || '') + '"'
        + ' data-type="' + esc(s.type || '') + '"'
        + ' aria-label="Recopier ' + esc(txt) + '">'
        + '<span class="perf-copie" aria-hidden="true">↺</span>'
        + '<span class="perf-val">' + esc(txt) + '</span>'
        + (tag ? '<span class="perf-tag">' + tag + '</span>' : '')
        + '</button>';
    }).join('');

    var html = '<div class="ex-prev">'
      + '<div class="ex-prev-tete">DERNIÈRE FOIS · ' + esc(quand.toUpperCase()) + '</div>'
      + '<div class="ex-prev-series">' + puces + '</div>'
      + '</div>';

    // La cible s'appuie sur tout l'historique et pas seulement sur la
    // derniere seance : sans RPE note, c'est la tendance qui decide.
    var cible = TS.suggererCible(seances);
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

  // Recopier une performance ne valide rien : ca remplit la premiere serie
  // encore vide, et n'en ajoute une que s'il n'en reste aucune. Aucune valeur
  // deja saisie n'est ecrasee.
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

  // Le HTML du bloc est produit a un seul endroit : le rendu initial et la
  // mise a jour en direct ne peuvent pas diverger.
  function majBlocPrecedent(card, ex){
    if (!card) return;
    var zone = card.querySelector('.ex-prev-zone');
    if (!zone) return;
    zone.innerHTML = blocPrecedentHTML(ex);
  }

  function exerciseCardHTML(ex){
    var color = GROUP_COLORS[ex.groupe] || GROUP_COLORS['Autre'];
    var groupOptions = GROUPS.map(function(g){
      return '<option value="'+g+'"'+(g===ex.groupe?' selected':'')+'>'+g+'</option>';
    }).join('');
    var series = ex.series || [];
    var seriesHTML = series.length
      ? series.map(function(s,idx){ return serieRowHTML(s, idx, ex.nom); }).join('')
      : '<div class="empty-state" style="padding:14px;font-size:12px;">Aucune série — ajoute la première ci-dessous.</div>';
    var hintHTML = blocPrecedentHTML(ex);
    return '<div class="ex-card" style="--card-color:'+color+'" data-id="'+ esc(ex.id) +'">'
      + '<div class="ex-head">'
      +   '<input class="ex-name" type="text" list="exerciseList" placeholder="Nom de l\'exercice" value="'+esc(ex.nom||'')+'" data-field="nom" data-id="'+ esc(ex.id) +'">'
      +   '<button type="button" class="ex-del" data-id="'+ esc(ex.id) +'" aria-label="Supprimer l\'exercice">×</button>'
      + '</div>'
      + '<div class="ex-body">'
      +   '<select class="ex-groupe" data-field="groupe" data-id="'+ esc(ex.id) +'">'+groupOptions+'</select>'
      +   '<div class="ex-prev-zone">' + hintHTML + '</div>'
      +   '<div class="series-list">'+seriesHTML+'</div>'
      +   '<div class="ex-actions">'
      +     '<button type="button" class="btn-add-serie" data-action="add-serie" data-id="'+ esc(ex.id) +'">+ SÉRIE'+(series.length?' (reprend la précédente)':'')+'</button>'
      +     (ex.bloc
              ? '<button type="button" class="btn-lien" data-action="detacher" data-id="'+ esc(ex.id) +'">⇄ SORTIR DU SUPERSET</button>'
              : '<button type="button" class="btn-lien" data-action="superset" data-id="'+ esc(ex.id) +'">⇄ AJOUTER UN EXERCICE EN SUPERSET</button>')
      +   '</div>'
      + '</div>'
      + '</div>';
  }

  // Les exercices d'un meme bloc sont contigus dans la liste : il suffit de
  // regrouper les suites. Rien a trier, donc rien qui puisse se desynchroniser
  // entre l'ordre affiche et l'ordre enregistre.
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
        repos: ex.repos || '', bloc: bloc,
        series: series.map(function(s){
          return { id:genSerieId(), poids:s.poids, reps:s.reps, rpe:s.rpe,
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
      var g = e.groupe || 'Autre';
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

  // ---------- la page Mes seances ----------
  // Deux rubriques, et la frontiere est la meme que celle qu'on a dans la
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

    var groupes = trierSeances();
    var mes = seancesOnglet === 'mes';
    var seances = mes ? groupes.mes : groupes.histo;

    // Creer une seance n'a de sens que dans la rubrique ou elle atterrira.
    bloc.hidden = !mes;

    if (!seances.length){
      cible.textContent = '';
      liste.innerHTML = '<div class="seances-vide">' + (mes
        ? 'Aucune séance prévue. Crée-en une ci-dessus, ou note-en une dans le planning.'
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
  function ouvrirSeance(ds){
    state.seanceOuverte = ds;
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

    html += '<div class="fiche-stats">'
      + statTile(exos.length, exos.length > 1 ? 'EXOS' : 'EXO')
      + statTile(compterJour(day), compterJour(day) > 1 ? 'SÉRIES' : 'SÉRIE')
      + statTile(volumeTexte(dayVolume(ds)) || '—', 'VOLUME')
      + '</div>';

    html += '<div class="fiche-stats" style="grid-template-columns:1fr;">'
      + statTile(fois + '×', fois > 1 ? 'FOIS CETTE SÉANCE' : 'PREMIÈRE FOIS')
      + '</div>';

    exos.forEach(function(e){
      var series = seriesRemplies(e);
      var pesees = series.filter(function(s){ return typeof s.poids === 'number' && s.poids > 0; });
      var meilleure = pesees.length ? Math.max.apply(null, pesees.map(function(s){ return s.poids; })) : null;
      html += '<button type="button" class="fiche-exo" data-exo="' + esc(e.nom || '') + '" style="--exo-color:' + (GROUP_COLORS[e.groupe] || GROUP_COLORS['Autre']) + '">'
        + '<div class="fiche-exo-nom">' + esc(normalizeName(e.nom) || 'Sans nom') + '<span class="fiche-exo-fleche">›</span></div>'
        + '<div class="fiche-exo-groupe">' + esc(e.groupe || 'Autre') + '</div>'
        + '<div class="fiche-series">'
        + series.map(function(s){
            var v = (typeof s.poids === 'number' ? formatWeight(s.poids) + ' kg' : '') +
                    (typeof s.poids === 'number' && s.reps ? ' × ' : '') + (s.reps || '');
            return '<span class="fiche-serie' + (s.fait ? ' fait' : '') + '">' + esc(v || '—') + '</span>';
          }).join('')
        + '</div>'
        + ligneProgression(e.nom, ds, meilleure)
        + '</button>';
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
    montrerVue('planning');
    renderPlanning(true);
    window.scrollTo(0, 0);
  }

  function allerAuJour(ds){
    state.selectedDay = ds;
    state.planningWeekStart = startOfWeek(fromDateStr(ds));
    montrerVue('planning');
    renderPlanning(true);
    window.scrollTo(0, 0);
  }

  function renderDayPanel(force){
    var panel = document.querySelector('.day-panel');
    var ae = document.activeElement;
    if (!force && panel.contains(ae) && (ae.tagName==='INPUT' || ae.tagName==='SELECT')) return;

    var ds = state.selectedDay;
    var d = fromDateStr(ds);
    document.getElementById('dayTitle').textContent = DAY_NAMES[(d.getDay()+6)%7]+' '+d.getDate()+' '+MONTH_NAMES[d.getMonth()];

    var list = document.getElementById('exList');
    if (state.loading){
      list.innerHTML = '<div class="empty-state">Chargement…</div>';
      return;
    }
    var day = state.sessions[ds];
    var exercises = day ? day.exercises : [];
    if (!exercises.length){
      list.innerHTML = '<div class="empty-state">Aucun exercice noté pour ce jour.<br>Ajoute ta première série ci-dessous.</div>';
    } else {
      list.innerHTML = exercisesHTML(exercises);
    }
  }

  function renderPlanning(force){
    renderWeekNav();
    renderDayPills();
    renderWeekStats();
    renderDayPanel(force);
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
      groupsEl.innerHTML = '<div class="empty-state">Chargement…</div>';
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
    var worked = GROUPS.filter(function(g){ return counts[g]; });
    var idle = GROUPS.filter(function(g){ return !counts[g] && g !== 'Autre' && g !== 'Cardio'; });
    var legend = worked.map(function(g){
      return '<div class="muscle-row"><span class="muscle-sw" style="background:'+GROUP_COLORS[g]+'"></span>'
        + '<span class="muscle-name">'+g+'</span><span class="muscle-val">'+counts[g]+'</span></div>';
    }).join('');
    if (!worked.length) legend = '<div class="muscle-name" style="color:var(--dim)">Rien sur cette période.</div>';
    var note = idle.length
      ? '<div class="muscle-note">Pas touché : '+idle.join(', ').toLowerCase()+'.</div>'
      : '';
    muscleEl.innerHTML = '<div class="muscle-panel">'
      + '<div class="muscle-title">CE QUE TU AS TRAVAILLÉ</div>'
      + '<div class="muscle-body">'+muscleMapSVG(counts)+'<div class="muscle-legend">'+legend+note+'</div></div>'
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
            var valueTxt = (it.bodyweight ? 'PDC' : formatWeight(it.maxPoids)+' kg') + ' × ' + it.repsAtMax;
            var freq = it.fois + (it.fois > 1 ? ' séances' : ' séance') + ' · ' +
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
    progressing:  { pastille:'🟢', mot:'EN PROGRESSION', classe:'sig-vert' },
    stable:       { pastille:'🟠', mot:'STABLE',         classe:'sig-orange' },
    stagnating:   { pastille:'🟠', mot:'STAGNATION',     classe:'sig-orange' },
    declining:    { pastille:'🔴', mot:'EN BAISSE',      classe:'sig-rouge' },
    insufficient_data: { pastille:'⚪', mot:'PAS ASSEZ DE DONNÉES', classe:'sig-gris' }
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
    var groupe = groupeCanonique(nom) || 'Autre';
    var couleur = GROUP_COLORS[groupe] || GROUP_COLORS['Autre'];

    var html = '<div class="exo-tete" style="--card-color:' + couleur + '">'
      + '<div class="exo-nom">' + esc(affiche) + '</div>'
      + '<div class="exo-groupe">' + esc(groupe) + '</div>'
      + '</div>';

    if (!toutes.length){
      hote.innerHTML = html + '<div class="seances-vide">Aucune série notée sur cet exercice.</div>';
      return;
    }

    // --- signal, sur tout l'historique : une fenetre courte inventerait des
    // tendances a partir de deux points.
    var sig = TS.detecterSignal(toutes);
    var vue = SIGNAUX[sig.signal] || SIGNAUX.insufficient_data;
    html += '<div class="exo-signal ' + vue.classe + '">'
      + '<div class="exo-signal-tete">' + vue.pastille + ' ' + vue.mot + '</div>'
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

    html += '<div class="exo-stats">'
      + statTile(top ? esc(perfTexte(top)) : '—', 'Top set')
      + statTile(rm === null ? '—' : formatWeight(rm) + ' kg', '1RM estimé')
      + statTile(meilleur === null ? '—' : formatWeight(meilleur) + ' kg', 'Meilleur poids')
      + statTile(reps || '—', 'Meilleures reps')
      + statTile(volumeTexte(volume) || '—', 'Volume total')
      + '</div>';

    // --- courbe
    html += '<div class="exo-bloc">'
      + '<div class="exo-bloc-titre">TOP SET AU FIL DU TEMPS</div>'
      + '<div class="exo-periodes">'
      + PERIODES.map(function(p){
          return '<button type="button" class="exo-periode' + (p.cle === state.exoPeriode ? ' actif' : '') + '"'
            + ' data-periode="' + p.cle + '">' + p.label + '</button>';
        }).join('')
      + '</div>'
      + '<div class="exo-chart" id="exoChart"><div class="recap-chart-empty">Chargement du graphique…</div></div>'
      + '</div>';

    // --- records par fourchette de reps
    var records = TS.recordsParReps(toutes);
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
            + '</span>'
            + '<span class="exo-jour-fleche">›</span>'
            + '</button>';
        }).join('')
      + '</div>';

    hote.innerHTML = html;

    var points = seancesFiltrees(toutes);
    var zone = document.getElementById('exoChart');
    loadChartLib().then(function(){ dessinerCourbeExo(zone, points); }).catch(function(){
      zone.innerHTML = '<div class="recap-chart-empty">Graphique indisponible hors-ligne.</div>';
    });
  }

  var courbeExo = null;
  function dessinerCourbeExo(zone, seances){
    if (courbeExo){ courbeExo.destroy(); courbeExo = null; }
    var pts = TS.pointsTopSet(seances);
    if (pts.length < 2){
      zone.innerHTML = '<div class="recap-chart-empty">Pas encore assez de séances sur cette période pour tracer une courbe.</div>';
      return;
    }
    zone.innerHTML = '<div class="chart-box"><canvas role="img" aria-label="1RM estimé du top set, ' + esc(state.exoOuvert) + '"></canvas></div>';
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
            return formatWeight(p.valeur) + ' kg estimés' + (t ? ' — ' + t : '');
          }
        } } },
        scales:{
          x:{ grid:{display:false}, ticks:{ color:'#9a9184', font:{size:10,weight:'700'} } },
          y:{ grid:{color:'#35312b'}, ticks:{ color:'#9a9184', font:{size:10,weight:'700'},
              callback:function(v){ return v + 'kg'; } } }
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
      s.src = 'chart.umd.js';
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
    if (state.view === 'planning') renderPlanning(false);
    else if (state.view === 'seances') renderSeances();
    else if (state.view === 'seance') renderSeanceDetail();
    else if (state.view === 'exercice') renderExerciceDetail();
    else if (state.view === 'coach') renderCoach();
    else if (state.view === 'admin') renderAdmin();
    else renderRecap();
  }

  // ---------- event wiring ----------
  // « mes » ou « histo ». L'onglet survit a un aller-retour dans une fiche :
  // revenir d'une seance passee pour retomber sur la liste des seances a venir
  // donnerait l'impression d'avoir perdu sa place.
  var seancesOnglet = 'mes';

  var VUES = ['planning','seances','seance','exercice','recap','coach','admin'];
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
    renderAll();
  }
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

  // Ramene la semaine affichee ET le jour selectionne sur aujourd'hui.
  document.getElementById('todayBtn').addEventListener('click', function(){
    var today = new Date();
    state.planningWeekStart = startOfWeek(today);
    state.selectedDay = toDateStr(today);
    renderPlanning(true);
    majBoutonToday();
  });

  // L'etat du bouton suit la semaine affichee.
  function majBoutonToday(){
    var b = document.getElementById('todayBtn');
    if (!b) return;
    var memeSemaine = toDateStr(state.planningWeekStart) === toDateStr(startOfWeek(new Date()));
    b.classList.toggle('loin', !memeSemaine);
  }

  document.getElementById('prevWeek').addEventListener('click', function(){
    state.planningWeekStart = addDays(state.planningWeekStart,-7);
    afterWeekChange();
  });
  document.getElementById('nextWeek').addEventListener('click', function(){
    state.planningWeekStart = addDays(state.planningWeekStart,7);
    afterWeekChange();
  });
  function afterWeekChange(){
    majBoutonToday();
    var strs = weekDays().map(toDateStr);
    if (strs.indexOf(state.selectedDay)===-1){
      var todayStr = toDateStr(new Date());
      state.selectedDay = strs.indexOf(todayStr)!==-1 ? todayStr : strs[0];
    }
    renderPlanning(true);
  }

  document.getElementById('dayPills').addEventListener('click', function(e){
    var btn = e.target.closest('.day-pill'); if (!btn) return;
    state.selectedDay = btn.dataset.date;
    renderPlanning(true);
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
      else if (field==='rpe'){
        found.serie.rpe = t.value==='' ? null : Number(t.value);
        t.classList.toggle('vide', found.serie.rpe==null);
        t.title = found.serie.rpe==null
          ? "Reps en réserve : 10 = à l'échec, 9 = 1 rep en réserve"
          : rpeLabel(found.serie.rpe);
      }
      else found.serie[field] = t.value;

      // L'étoile de record suit la saisie sans reconstruire le panneau, qui
      // ferait perdre le focus. Ce bloc visait « .serie-row », un sélecteur
      // qui n'existe plus depuis que les séries sont des « .serie-card » :
      // l'étoile ne bougeait donc jamais pendant la frappe.
      if (field === 'poids' || field === 'reps'){
        majEtoilesRecord(t.closest('.ex-card'));
      }

      scheduleSave(state.selectedDay);
      renderDayPills();
      renderWeekStats();
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
        var sel = exListEl.querySelector('select.ex-groupe[data-id="'+id+'"]');
        if (sel) sel.value = match;
        if (card) card.style.setProperty('--card-color', GROUP_COLORS[match]);
      }
      // Le bloc « dernière fois » ne se recalculait qu'au rendu complet —
      // jamais pendant la saisie du nom, qui est justement le moment où il
      // devient utile. Mis à jour ici, sans reconstruire la carte.
      majBlocPrecedent(card, ex);
    }
    scheduleSave(state.selectedDay);
    renderDayPills();
    renderWeekStats();
  });

  exListEl.addEventListener('change', function(e){
    var t = e.target;
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
    ex.groupe = t.value;
    if (ex.nom && rememberExercise(ex.nom, ex.groupe)) populateDatalist();
    var card = t.closest('.ex-card');
    if (card) card.style.setProperty('--card-color', GROUP_COLORS[ex.groupe]);
    scheduleSave(state.selectedDay,true);
    renderDayPills();
    renderWeekStats();
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
    renderDayPills();
    renderWeekStats();
    showToast('Série remplie — à toi de valider');
    requestAnimationFrame(function(){
      var el = exListEl.querySelector('.serie-poids[data-serie-id="' + serie.id + '"]');
      if (el) el.focus();
    });
    e.stopPropagation();
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
    renderDayPills();
    renderWeekStats();
    e.stopPropagation();
  });

  exListEl.addEventListener('click', function(e){
    var delBtn = e.target.closest('.ex-del');
    if (delBtn){
      var id = delBtn.dataset.id;
      var day = getOrCreateDay(state.selectedDay);
      day.exercises = day.exercises.filter(function(x){ return x.id!==id; });
      nettoyerBlocs(day);
      scheduleSave(state.selectedDay,true);
      renderDayPanel(true);
      renderDayPills();
      renderWeekStats();
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
      renderDayPills();
      renderWeekStats();
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
      renderDayPills();
      renderWeekStats();
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
        ? { id:genSerieId(), poids:last.poids, reps:last.reps, rpe:last.rpe, repos:last.repos, type:typeSuivant, fait:false }
        : { id:genSerieId(), poids:null, reps:'', rpe:null, repos:'', fait:false };
      ex2.series.push(newSerie);
      scheduleSave(state.selectedDay,true);
      renderDayPanel(true);
      renderDayPills();
      renderWeekStats();
      requestAnimationFrame(function(){
        var el = exListEl.querySelector('.serie-poids[data-serie-id="'+newSerie.id+'"]');
        if (el) el.focus();
      });
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
      renderDayPills();
      renderWeekStats();
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
      faitBtn.classList.toggle('checked', found4.serie.fait);
      faitBtn.textContent = found4.serie.fait ? '✓' : '';
      faitBtn.setAttribute('aria-pressed', found4.serie.fait ? 'true':'false');
      var faitRow = faitBtn.closest('.serie-row');
      if (faitRow) faitRow.classList.toggle('fait', found4.serie.fait);
      return;
    }
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
  });

  // Affiche la proposition dans la carte, sans re-render : re-dessiner ferait
  // perdre le focus et la position de scroll au moment precis ou l'utilisateur
  // est en train de saisir.
  function proposerRattachement(card, ex){
    if (!card) return;
    var vieux = card.querySelector('.alias-prompt');
    if (vieux) vieux.remove();
    var choix = candidatsAlias(ex.nom);
    var liste = tousLesExos(cleExo(ex.nom));
    if (!choix.length && !liste.length) return;

    var box = document.createElement('div');
    box.className = 'alias-prompt';
    var html;
    if (choix.length){
      html = '<p><b>« ' + esc(normalizeName(ex.nom)) + ' »</b> — c\'est le même exercice que&nbsp;?</p>';
      choix.forEach(function(c){
        var quand = '';
        if (c.quand){
          var d = fromDateStr(c.quand);
          quand = ' <span style="color:var(--dim);font-weight:700;">· ' + d.getDate() + ' ' + MONTH_ABBR[d.getMonth()] + '</span>';
        }
        html += '<button type="button" class="alias-choix" data-cle="' + esc(c.cle) + '">' + esc(c.nom) + quand + '</button>';
      });
      html += '<button type="button" class="alias-non">NON, C\'EST UN NOUVEL EXERCICE</button>';
    } else {
      // Rien ne ressemble : le nom est deja retenu, on ne pose pas de question
      // pour le plaisir. Le rattachement reste disponible, replie.
      html = '<p><b>« ' + esc(normalizeName(ex.nom)) + ' »</b> est ajouté à tes exercices.</p>'
           + '<button type="button" class="alias-non" data-action="ouvrir-liste">LE RATTACHER À UN EXERCICE EXISTANT</button>';
    }
    html += '<div class="alias-liste" hidden>'
         +   '<select class="alias-select" aria-label="Exercice auquel rattacher ce nom">'
         +     '<option value="">Choisis l\'exercice…</option>'
         +     liste.map(function(c){ return '<option value="' + esc(c.cle) + '">' + esc(c.nom) + '</option>'; }).join('')
         +   '</select>'
         +   '<button type="button" class="alias-choix" data-action="rattacher">RATTACHER</button>'
         + '</div>';
    box.innerHTML = html;

    box.addEventListener('click', function(e){
      var b = e.target.closest('.alias-choix[data-cle]');
      if (b){
        definirAlias(ex.nom, b.dataset.cle);
        var g1 = groupeCanonique(ex.nom); if (g1) ex.groupe = g1;
        scheduleSave(state.selectedDay, true);
        box.remove();
        // L'historique change de sens d'un coup : « derniere fois », records et
        // recap doivent refleter le rattachement tout de suite.
        renderDayPanel(true);
        renderWeekStats();
        showToast('« ' + normalizeName(ex.nom) +' » rejoint ton historique');
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
        definirAlias(ex.nom, sel.value);
        var g2 = groupeCanonique(ex.nom); if (g2) ex.groupe = g2;
        scheduleSave(state.selectedDay, true);
        box.remove();
        renderDayPanel(true);
        renderWeekStats();
        showToast('« ' + normalizeName(ex.nom) + ' » rejoint ton historique');
        return;
      }
      if (e.target.closest('.alias-non')){
        definirAlias(ex.nom, null);
        box.remove();
      }
    });

    var corps = card.querySelector('.ex-body');
    var apres = card.querySelector('.ex-groupe');
    if (corps && apres) corps.insertBefore(box, apres.nextSibling);
    else if (corps) corps.appendChild(box);
  }

  document.getElementById('reprendreBtn').addEventListener('click', function(){
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
    montrerVue('seances');
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
    montrerVue('planning');
    renderPlanning(true);
    window.scrollTo(0, 0);
    showToast(n + (n > 1 ? ' exercices ajoutés' : ' exercice ajouté'));
  });

  document.getElementById('addExerciseBtn').addEventListener('click', function(){
    var day = getOrCreateDay(state.selectedDay);
    var newEx = { id:genId(), nom:'', groupe:'Autre', repos:'', series:[{ id:genSerieId(), poids:null, reps:'', rpe:null, repos:'', fait:false }] };
    day.exercises.push(newEx);
    scheduleSave(state.selectedDay,true);
    renderDayPanel(true);
    renderDayPills();
    renderWeekStats();
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
    renderPlanning(true);
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
  var CSV_COLONNES = ['Date','Jour','Exercice','Groupe','Serie','Poids (kg)',
                      'Repetitions','RPE','Repos (s)','Volume (kg)','Fait'];
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
  // l'un de ces caracteres s'affiche avec une apostrophe devant. Le CSV ne se
  // reimporte pas dans Top Set, donc aucun aller-retour n'en depend.
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
            csvChamp(s.fait ? 'oui' : 'non')
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
      var n = compterJour(clean[ds]);
      if (n){ jours++; series += n; }
    });
    if (!Object.keys(clean).length) return { error:'Aucune s\u00e9ance exploitable dans ce fichier.' };
    var custom = (data.customExercises && typeof data.customExercises === 'object')
      ? nettoyerCustom(data.customExercises) : null;
    return { sessions:clean, jours:jours, series:series, customExercises:custom };
  }

  var pendingBackup = null, pendingBackupLabel = '';

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
    b.textContent = 'REMPLACER MES DONN\u00c9ES';
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
    b.onclick = function(){
      document.getElementById('dataPaste').value = c.texte;
      disarmImport();
      sheetMsg('warn', 'Copie de secours charg\u00e9e. Appuie sur \u00ab REMPLACER MES DONN\u00c9ES \u00bb pour la remettre.');
    };
  }

  function openDataSheet(){
    refreshSheet();
    disarmImport();
    document.getElementById('dataMsg').hidden = true;
    document.getElementById('dataPaste').value = '';
    document.getElementById('dataSheet').hidden = false;
  }
  function closeDataSheet(){ document.getElementById('dataSheet').hidden = true; }

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
          +   '<span>' + (RETOUR_MOT[x.type] || x.type) + ' · ' + esc(quandCourt(x.cree_le)) + '</span>'
          +   '<span class="retour-statut ' + esc(x.statut) + '">' + st + '</span>'
          + '</div>'
          + '<div class="retour-mien-corps">' + esc(x.corps) + '</div>'
          + '</div>';
      }).join('');
      bloc.hidden = false;
    }, function(){ bloc.hidden = true; });
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
    document.getElementById('retourSheet').hidden = false;
  }
  function fermerRetour(){ document.getElementById('retourSheet').hidden = true; }

  document.getElementById('lienRetour').addEventListener('click', ouvrirRetour);
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
      msgRetour('ok', 'Reçu. Merci — c\'est vraiment utile.');
      chargerMesRetours();
    }, function(e){
      msgRetour('err', Sync.messageErreur(e));
    }).then(function(){
      btn.disabled = false; btn.textContent = avant;
    });
  });

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
        + '<button type="button" class="btn-sheet danger" data-couper="' + esc(l.lien_id) + '">'
        + (l.statut === 'actif' ? 'COUPER L\'ACCÈS' : 'ANNULER LA DEMANDE') + '</button>';
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
    var b = e.target.closest('[data-couper]'); if (!b) return;
    if (!confirm('Couper l\'accès ? Ton coach ne verra plus rien immédiatement.')) return;
    Sync.revoquerLien(b.dataset.couper).then(function(){
      msgCoach('ok', 'Accès coupé.');
      majCoachUI();
    }, function(err){ msgCoach('err', Sync.messageErreur(err)); });
  });

  document.getElementById('coachOuvrir').addEventListener('click', function(){
    closeDataSheet();
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
      zone.innerHTML = '<div class="admin-vide">Lecture du carnet…</div>';
      Sync.tirerJoursDe(coachClient.client_id).then(function(jours){
        var dates = Object.keys(jours || {}).sort().reverse();
        if (!dates.length){
          zone.innerHTML = '<div class="admin-vide">Aucune séance loguée pour l\'instant.</div>';
          return;
        }
        zone.innerHTML = dates.map(function(ds){
          var j = jours[ds];
          var d = fromDateStr(ds);
          var quand = DAY_NAMES[(d.getDay()+6)%7] + ' ' + d.getDate() + ' ' +
                      MONTH_NAMES[d.getMonth()] + ' ' + d.getFullYear();
          var exos = (j.exercises || []).map(function(ex){
            var top = TS.calculerTopSet(ex.series || []);
            var series = (ex.series || []).map(function(s){
              var t = TS.typeSerie(s);
              var classe = (top && s === top) ? 'top' : (t !== TS.TYPES.TRAVAIL ? t : '');
              var p = (s.poids != null && s.poids !== '') ? formatWeight(Number(s.poids)) + ' kg' : '';
              var r = s.reps ? String(s.reps) : '';
              var txt = (p && r) ? p + ' × ' + r : (p || r || '—');
              if (s.rpe != null) txt += ' · RPE ' + s.rpe;
              return '<span class="lect-serie ' + classe + '">' + esc(txt) + '</span>';
            }).join('');
            return '<div class="lect-exo">'
              + '<div class="lect-nom">' + esc(ex.nom || 'Sans nom') + '</div>'
              + '<div class="lect-series">' + (series || '<span class="lect-serie">aucune série</span>') + '</div>'
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
    zone.innerHTML = '<div class="admin-vide">Chargement…</div>';
    Sync.mesCoaches().then(function(rows){
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
    montrerVue('planning');
  });
  document.getElementById('coachRafraichir').addEventListener('click', renderCoach);

  document.getElementById('coachContenu').addEventListener('click', function(e){
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
        + tuile(a.retours_nouveaux, 'RETOURS');
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
          +   (x.statut !== 'vu'      ? '<button type="button" class="admin-action" data-marquer="' + esc(x.id) + '" data-statut="vu">MARQUER LU</button>' : '')
          +   (x.statut !== 'traite'  ? '<button type="button" class="admin-action" data-marquer="' + esc(x.id) + '" data-statut="traite">TRAITÉ</button>' : '')
          +   (x.statut !== 'nouveau' ? '<button type="button" class="admin-action" data-marquer="' + esc(x.id) + '" data-statut="nouveau">ROUVRIR</button>' : '')
          + '</div>'
          + '</div>';
      }).join('');
    }, function(e){
      retours.innerHTML = '<div class="admin-vide">' + esc(Sync.messageErreur(e)) + '</div>';
    });

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
          + '</div>';
      }).join('');
    }, function(e){
      membres.innerHTML = '<div class="admin-vide">' + esc(Sync.messageErreur(e)) + '</div>';
    });
  }

  document.getElementById('adminRetourBtn').addEventListener('click', function(){
    montrerVue('planning');
  });
  document.getElementById('adminRafraichir').addEventListener('click', renderAdmin);
  document.getElementById('adminFiltres').addEventListener('click', function(e){
    var b = e.target.closest('.admin-filtre'); if (!b) return;
    adminFiltre = b.dataset.statut || '';
    this.querySelectorAll('.admin-filtre').forEach(function(x){ x.classList.toggle('active', x === b); });
    renderAdmin();
  });
  document.getElementById('adminRetoursListe').addEventListener('click', function(e){
    var b = e.target.closest('[data-marquer]'); if (!b) return;
    b.disabled = true;
    Sync.adminMarquer(b.dataset.marquer, b.dataset.statut)
        .then(renderAdmin, function(err){ b.disabled = false; showToast(Sync.messageErreur(err)); });
  });

  document.getElementById('compteAdmin').addEventListener('click', function(){
    closeDataSheet();
    montrerVue('admin');
    window.scrollTo(0, 0);
  });

  document.getElementById('dataBtn').addEventListener('click', openDataSheet);
  document.getElementById('dataClose').addEventListener('click', closeDataSheet);
  document.getElementById('dataSheet').addEventListener('click', function(e){
    if (e.target === this) closeDataSheet();
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && !document.getElementById('retourSheet').hidden) fermerRetour();
    if (e.key === 'Escape' && !document.getElementById('dataSheet').hidden) closeDataSheet();
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
    fr.onload = function(){
      document.getElementById('dataPaste').value = String(fr.result);
      disarmImport();
      sheetMsg('warn', 'Fichier charg\u00e9. Appuie sur \u00ab REMPLACER MES DONN\u00c9ES \u00bb pour continuer.');
    };
    fr.onerror = function(){ sheetMsg('err', 'Lecture du fichier impossible.'); };
    fr.readAsText(f);
    e.target.value = '';
  });

  document.getElementById('dataPaste').addEventListener('input', disarmImport);

  // Import en deux temps : le premier appui montre ce qui va etre ecrase,
  // le second seulement applique. Remplacer est irreversible.
  document.getElementById('dataImport').addEventListener('click', function(){
    var btn = this;
    if (pendingBackup){
      state.sessions = pendingBackup.sessions;
      if (pendingBackup.customExercises){
        customExercises = pendingBackup.customExercises;
        saveCustom();
        rebuildLower();
      }
      saveLocal();
      // Un import remplace tout le carnet. Sans marquer les journees, elles
      // resteraient sur ce seul appareil : l'utilisateur croirait avoir
      // restaure sur son compte alors que rien n'est parti.
      Object.keys(state.sessions).forEach(function(ds){ Sync.marquerSale(ds); });
      populateDatalist();
      renderPlanning(true);
      disarmImport();
      document.getElementById('dataPaste').value = '';
      refreshSheet();
      sheetMsg('ok', 'Donn\u00e9es restaur\u00e9es : ' + pendingBackupLabel + '.');
      showToast('Donn\u00e9es restaur\u00e9es');
      return;
    }
    var text = document.getElementById('dataPaste').value.trim();
    if (!text){ sheetMsg('err', 'Choisis un fichier, ou colle le contenu de ta sauvegarde.'); return; }
    var parsed = parseBackup(text);
    if (parsed.error){ sheetMsg('err', parsed.error); return; }
    pendingBackup = parsed;
    pendingBackupLabel = parsed.jours + (parsed.jours > 1 ? ' jours' : ' jour') + ', ' +
                         parsed.series + (parsed.series > 1 ? ' s\u00e9ries' : ' s\u00e9rie');
    var now = backupStats();
    btn.classList.add('armed');
    btn.textContent = 'CONFIRMER LE REMPLACEMENT';
    sheetMsg('warn',
      'Tu as actuellement ' + now.jours + (now.jours > 1 ? ' jours' : ' jour') +
      (now.jours > 1 ? ' enregistr\u00e9s' : ' enregistr\u00e9') +
      '. Le fichier en contient ' + pendingBackupLabel +
      '. Confirmer effacera d\u00e9finitivement les donn\u00e9es actuelles.');
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

  // Version de la politique de confidentialite acceptee a l'inscription. La
  // changer implique de redemander l'accord : c'est ce que la page promet.
  var VERSION_POLITIQUE = '2.0';
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
        s.src = 'supabase.umd.js';
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
          user = session ? session.user : null;
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
      var j = { date:ds, exercises:(d && d.exercises || []).map(normalizeExercise) };
      if (d && typeof d.titre === 'string' && d.titre.trim()) j.titre = d.titre.trim();
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
      if (!dates.length) return Promise.resolve(0);
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
        return { cle:cleExo(nom), nom:info.nom || nom, groupe:info.groupe, alias:info.alias };
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
          if (local && local.nom === d.nom && local.groupe === d.groupe &&
              (local.alias || null) === (d.alias || null)) return;
          if (local && local.nom !== d.nom) delete customExercises[local.nom];
          customExercises[d.nom] = { nom:d.nom, groupe:d.groupe || 'Autre', alias:d.alias || null };
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
      var sans = document.getElementById('accueilSansCompte');
      // Pendant un changement de mot de passe, « continuer sans compte »
      // abandonnerait l'operation a mi-chemin.
      if (sans) sans.hidden = (mode === 'nouveau');
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
      if (/For security purposes|rate limit|Too many requests|over_email_send_rate/i.test(m))
        return 'trop de tentatives — reessaie dans quelques minutes';
      if (/same as the old password|should be different/i.test(m))
        return 'choisis un mot de passe different de l ancien';
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
        setTimeout(openDataSheet, 400);
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
      if (!dispo()) return;

      var etat  = document.getElementById('compteEtat');
      var texte = document.getElementById('compteEtatTexte');
      var deco  = document.getElementById('compteDeco');
      var co    = document.getElementById('compteCo');
      var mig   = document.getElementById('compteMigrer');
      var note  = document.getElementById('compteNote');

      deco.hidden = !!user;
      co.hidden   = !user;

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
        // personne, puisque la session dure des semaines.
        toucherProfil().then(majUI);
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
    function toucherProfil(){
      if (!user){ profil = null; return Promise.resolve(null); }
      return client().then(function(c){
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
      dispo:dispo, demarrer:demarrer, marquerSale:marquerSale, majUI:majUI,
      toucherProfil:toucherProfil, estAdmin:estAdmin,
      profil:function(){ return profil; },
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
        return rpcAdmin('demander_coach', { p_code: String(code || '').toUpperCase().trim() });
      },
      repondreDemande:function(lien, oui){
        return rpcAdmin('repondre_demande', { p_lien: lien, p_accepte: !!oui });
      },
      revoquerLien:function(lien){ return rpcAdmin('revoquer_lien', { p_lien: lien }); },
      mesCoaches:function(){ return rpcAdmin('mes_coaches'); },
      monCoach:function(){ return rpcAdmin('mon_coach'); },
      tirerJoursDe:function(client){ return rpcAdmin('tirer_jours_de', { p_client: client }); },
      envoyerRetour:envoyerRetour, mesRetours:mesRetours,
      adminApercu:function(){ return rpcAdmin('admin_apercu'); },
      adminMembres:function(){ return rpcAdmin('admin_membres'); },
      adminRetours:function(s){ return rpcAdmin('admin_retours', { p_statut: s || null }); },
      adminMarquer:function(id, s){ return rpcAdmin('admin_marquer_retour', { p_id:id, p_statut:s }); },
      marquerExos:marquerExos, pousserExos:pousserExos, tirerExos:tirerExos,
      marquerTitre:marquerTitre, pousserTitres:pousserTitres,
      enregistrerPseudo:enregistrerPseudo, envoyerLienMdp:envoyerLienMdp,
      changerMdp:changerMdp, modeAccueil:modeAccueil, nomAffiche:nomAffiche,
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
    function occupe(btn, texte, fn){
      var avant = btn.textContent;
      btn.disabled = true; btn.textContent = texte;
      fn().catch(function(e){ Sync.msgCompte('err', Sync.messageErreur(e)); })
          .then(function(){ btn.disabled = false; btn.textContent = avant; Sync.majUI(); });
    }
    document.getElementById('compteConnexion').addEventListener('click', function(){
      var v = lire();
      if (!v.email || !v.mdp){ Sync.msgCompte('err', 'Email et mot de passe requis.'); return; }
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
      if (!v.email || !v.mdp){ Sync.msgCompte('err', 'Email et mot de passe requis.'); return; }
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
      if (!mail){ Sync.msgCompte('err', 'Donne l\'adresse de ton compte.'); return; }
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
      closeDataSheet();
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
