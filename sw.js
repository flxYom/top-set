// Service worker de Top Set.
//
// Il existe pour une seule raison : une salle de sport est un sous-sol sans
// reseau. Sans lui, ouvrir l'app hors ligne donne la page d'erreur du
// navigateur, et le carnet devient inaccessible au moment precis ou on en a
// besoin — alors que toutes les seances sont deja dans le telephone.
//
// Ce qu'il ne fait pas, volontairement : rien mettre en cache qui vienne de
// Supabase. Les reponses d'API sont personnelles et datees ; les servir
// depuis un cache reviendrait a afficher des seances perimees en croyant
// etre a jour. Le hors-ligne des donnees, c'est localStorage, pas ici.

var VERSION = 'topset-v16';
var COQUILLE = VERSION + '-coquille';
var COURANT  = VERSION + '-courant';

// La coquille : ce qu'il faut pour que l'app s'ouvre et s'affiche.
var A_PRECHARGER = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon.svg',
  'icon-192.png',
  'icon-512.png',
  'favicon-32.png',
  'favicon-48.png',
  'fonts/bricolage-latin.woff2',
  'fonts/bricolage-latin-ext.woff2',
  'chart.umd.js',
  'supabase-config.js',
  'intelligence.js',
  'app.js',
  'legal.css',
  'guide.html',
  'confidentialite.html',
  'cgu.html',
  'mentions-legales.html'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(COQUILLE).then(function(cache){
      // Un par un, et chaque echec est avale : une seule URL absente ou
      // redirigee ferait echouer addAll() en entier, et l'app resterait
      // sans cache du tout. Mieux vaut une coquille incomplete que rien.
      return Promise.all(A_PRECHARGER.map(function(url){
        return cache.add(new Request(url, { cache:'reload' })).catch(function(){});
      }));
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(noms){
      return Promise.all(noms.map(function(n){
        if (n !== COQUILLE && n !== COURANT) return caches.delete(n);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

function estNavigation(req){
  return req.mode === 'navigate' ||
         (req.method === 'GET' && (req.headers.get('accept') || '').indexOf('text/html') > -1);
}

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }
  // Tout ce qui n'est pas ce site passe sans etre touche : Supabase en
  // premier lieu.
  if (url.origin !== self.location.origin) return;

  if (estNavigation(req)){
    // Le reseau d'abord pour la page : une version en cache pourrait etre
    // vieille de plusieurs deploiements, et l'app est un seul fichier.
    e.respondWith(
      fetch(req).then(function(rep){
        var copie = rep.clone();
        caches.open(COURANT).then(function(c){ c.put(req, copie); });
        return rep;
      }).catch(function(){
        return caches.match(req).then(function(r){
          if (r) return r;
          // « cleanUrls » sert /guide, mais le cache contient guide.html :
          // hors ligne, une adresse sans extension retombait sur l'app au lieu
          // de la page demandee. On retente une fois avec l'extension.
          var chemin = url.pathname.replace(/\/$/, '');
          if (chemin && chemin.indexOf('.') === -1){
            return caches.match(chemin.replace(/^\//, '') + '.html').then(function(r2){
              return r2 || caches.match('index.html') || caches.match('./');
            });
          }
          return caches.match('index.html') || caches.match('./');
        });
      })
    );
    return;
  }

  // Le reste — polices, icones, bibliotheques — ne change qu'au deploiement :
  // on sert le cache tout de suite et on rafraichit derriere.
  e.respondWith(
    caches.match(req).then(function(cachee){
      var reseau = fetch(req).then(function(rep){
        if (rep && rep.status === 200 && rep.type === 'basic'){
          var copie = rep.clone();
          caches.open(COURANT).then(function(c){ c.put(req, copie); });
        }
        return rep;
      }).catch(function(){ return cachee; });
      return cachee || reseau;
    })
  );
});
