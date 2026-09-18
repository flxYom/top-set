// La braise : le fond anime de l'accueil et du bilan, dessine hors du fil
// principal.
//
// Ce fichier tourne dans un Web Worker, sur un OffscreenCanvas transfere par
// app.js. Tout le travail WebGL — creer le contexte, compiler le shader,
// dessiner — se fait ici : l'app ne se fige jamais pour lui, meme sur un
// telephone modeste. Mesure du 18/09/2026 : sur le fil principal, la seule
// preparation coutait ~200 ms a l'ouverture (Lighthouse mobile 98 -> 77).
//
// Messages recus d'app.js :
//   { type:'init', canvas, w, h, calme, vs, fs }  le canvas et le shader
//   { type:'actif', actif }                        ecran affiche ou non
//   { type:'taille', w, h }                        nouvelle taille (demi-resolution)
// Messages envoyes : 'prete' (premiere image dessinee), 'echec' (rien a faire,
// le degrade CSS reste).

'use strict';

var gl = null, cv = null, uR = null, uT = null;
var w = 1, h = 1, calme = false, actif = false;
var anim = 0, dernier = 0, debut = 0, images = 0;

// requestAnimationFrame existe dans les workers recents ; sinon, 30 images/s au minuteur.
var raf = self.requestAnimationFrame
  ? function(f){ return self.requestAnimationFrame(f); }
  : function(f){ return setTimeout(function(){ f(performance.now()); }, 33); };
var annuler = self.cancelAnimationFrame
  ? function(id){ self.cancelAnimationFrame(id); }
  : function(id){ clearTimeout(id); };

self.onmessage = function(e){
  var m = e.data;
  if (m.type === 'init'){
    cv = m.canvas; w = m.w; h = m.h; calme = m.calme;
    if (!preparer(m.vs, m.fs)){ self.postMessage('echec'); self.close(); return; }
    actif = true;
    lancer();
  } else if (m.type === 'actif'){
    actif = m.actif;
    if (actif) lancer(); else arreter();
  } else if (m.type === 'taille'){
    w = m.w; h = m.h;
    // Image fixe (reduire les animations, ou boucle arretee) : la redessiner a la bonne taille.
    if (gl && actif && !anim) image(performance.now());
  }
};

function preparer(vs, fs){
  // Sans vrai GPU (rendu logiciel), le navigateur refuse le contexte : le
  // calcul du bruit sur le processeur couterait plus que l'effet ne rapporte.
  gl = cv.getContext('webgl', { alpha:false, antialias:false, depth:false, powerPreference:'low-power', failIfMajorPerformanceCaveat:true });
  if (!gl) return false;
  var v = gl.createShader(gl.VERTEX_SHADER), f = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(v, vs); gl.compileShader(v);
  gl.shaderSource(f, fs); gl.compileShader(f);
  var prog = gl.createProgram();
  gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
  var a = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  uR = gl.getUniformLocation(prog, 'r'); uT = gl.getUniformLocation(prog, 't');
  return true;
}

function image(ms){
  if (cv.width !== w || cv.height !== h){ cv.width = w; cv.height = h; }
  gl.viewport(0, 0, w, h); gl.uniform2f(uR, w, h);
  gl.uniform1f(uT, (ms - debut) / 1000 + 40);
  var t0 = performance.now();
  gl.drawArrays(gl.TRIANGLES, 0, 3);
  if (!images++) self.postMessage('prete');
  // Avec un GPU, drawArrays rend la main tout de suite ; s'il bloque, c'est le
  // processeur qui dessine : on s'arrete sur cette image (batterie).
  if (images <= 3 && performance.now() - t0 > 20){ arreter(); calme = true; }
}

function boucle(ms){
  anim = raf(boucle);
  if (ms - dernier < 33) return;
  dernier = ms; image(ms);
}

function lancer(){
  if (!actif) return;
  if (!debut) debut = performance.now();
  if (calme){ image(performance.now()); return; }
  if (!anim) anim = raf(boucle);
}

function arreter(){ if (anim){ annuler(anim); anim = 0; } }
