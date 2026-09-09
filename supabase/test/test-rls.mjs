// Fait tourner schema-web.sql contre un vrai Postgres (PGlite) et attaque le
// RLS depuis le role "authenticated", comme le ferait le navigateur d'un
// utilisateur connecte.
//
//   node test-web.mjs
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'fs';

const SCHEMA = new URL('../schema.sql', import.meta.url);
const db = new PGlite();

const A = '11111111-1111-1111-1111-111111111111'; // Guigui
const B = '22222222-2222-2222-2222-222222222222'; // un autre utilisateur

let pass = 0, fail = 0;
function ok(label, cond, detail = '') {
  if (cond) { pass++; console.log('  OK   ' + label); }
  else { fail++; console.log('  FAIL ' + label + (detail ? '  -> ' + detail : '')); }
}

// Se mettre dans la peau d'un utilisateur connecte : role authenticated + son id.
async function as(uid, sql, params) {
  await db.exec('begin');
  try {
    await db.exec('set local role authenticated;');
    await db.query(`select set_config('request.jwt.claim.sub', $1, true)`, [uid]);
    const r = await db.query(sql, params);
    await db.exec('commit');
    return r;
  } catch (e) { await db.exec('rollback'); throw e; }
}
async function asAnon(sql, params) {
  await db.exec('begin');
  try {
    await db.exec('set local role anon;');
    const r = await db.query(sql, params);
    await db.exec('commit');
    return r;
  } catch (e) { await db.exec('rollback'); throw e; }
}
async function refuse(label, fn) {
  try { await fn(); ok(label, false, 'la requete a REUSSI alors qu elle devait echouer'); }
  catch (e) { ok(label, true); return e; }
}

// ---------------------------------------------------------------- prelude
// Reproduit ce que Supabase fournit deja. Sans les grants par defaut, on
// obtiendrait des « permission denied » qui n'ont rien a voir avec le RLS et
// on croirait a tort que le schema est sur.
await db.exec(`
  create schema if not exists auth;
  create table auth.users (
    id uuid primary key,
    email text,
    created_at timestamptz not null default now(),
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );
  create or replace function auth.uid() returns uuid
    language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create role anon;
  create role authenticated;
  create role service_role;
  grant usage on schema public to anon, authenticated, service_role;
  -- Supabase accorde ceci d'office. Sans lui, auth.uid() leve « permission
  -- denied for schema auth » et on croirait a tort que le schema est casse.
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  alter default privileges in schema public
    grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public
    grant all on functions to anon, authenticated, service_role;
`);
await db.query(
  'insert into auth.users (id, email, created_at) values ($1,$2,$3), ($4,$5,$6)',
  [A, 'a@exemple.fr', '2026-01-15T10:00:00Z',
   B, 'b@exemple.fr', '2026-06-01T09:30:00Z']);

// ---------------------------------------------------------------- le schema
console.log('\n== 1. Le schema passe-t-il ? ==');
const sql = readFileSync(SCHEMA, 'utf8');
try { await db.exec(sql); ok('schema-web.sql s execute sans erreur', true); }
catch (e) { ok('schema-web.sql s execute sans erreur', false, e.message); process.exit(1); }

console.log('\n== 2. Est-il rejouable (idempotent) ? ==');
try { await db.exec(sql); ok('deuxieme execution sans erreur', true); }
catch (e) { ok('deuxieme execution sans erreur', false, e.message); }

// ---------------------------------------------------------------- ecriture
console.log('\n== 3. pousser_jour ecrit-il correctement ? ==');
const JOUR = [
  { id: 'x1a2b3c', nom: 'Developpe couche', groupe: 'Pectoraux', repos: '',
    series: [
      { id: 's1', poids: '82.5', reps: '6', rpe: '8',   repos: '120', fait: true  },
      { id: 's2', poids: '82.5', reps: '5', rpe: '9.5', repos: '120', fait: false }
    ] },
  { id: '550e8400-e29b-41d4-a716-446655440000', nom: 'Squat', groupe: 'Jambes', repos: '',
    series: [ { id: null, poids: '100', reps: '5', rpe: null, repos: '180', fait: true } ] }
];
await as(A, `select public.pousser_jour('2026-09-07'::date, $1::jsonb)`, [JSON.stringify(JOUR)]);

let r = await as(A, `select count(*)::int n from public.seances`);
ok('1 seance creee', r.rows[0].n === 1, 'n=' + r.rows[0].n);
r = await as(A, `select count(*)::int n from public.exercices`);
ok('2 exercices crees', r.rows[0].n === 2, 'n=' + r.rows[0].n);
r = await as(A, `select count(*)::int n from public.series`);
ok('3 series creees', r.rows[0].n === 3, 'n=' + r.rows[0].n);

r = await as(A, `select id::text from public.exercices where nom = 'Squat'`);
ok('un id UUID fourni par le client est conserve',
   r.rows[0].id === '550e8400-e29b-41d4-a716-446655440000', r.rows[0].id);
r = await as(A, `select id::text from public.exercices where nom = 'Developpe couche'`);
ok('un id local non-UUID est remplace sans planter',
   /^[0-9a-f-]{36}$/.test(r.rows[0].id), r.rows[0].id);

r = await as(A, `select poids::text p, rpe::text q from public.series where ordre = 1 and reps = '5' order by 1 limit 1`);
ok('poids et RPE decimaux conserves', r.rows[0].p === '82.50' && r.rows[0].q === '9.5',
   r.rows[0].p + ' / ' + r.rows[0].q);

console.log('\n== 4. Rejouer le meme jour cree-t-il des doublons ? ==');
await as(A, `select public.pousser_jour('2026-09-07'::date, $1::jsonb)`, [JSON.stringify(JOUR)]);
r = await as(A, `select (select count(*) from public.seances)::int s,
                        (select count(*) from public.exercices)::int e,
                        (select count(*) from public.series)::int se`);
ok('toujours 1 seance / 2 exercices / 3 series',
   r.rows[0].s === 1 && r.rows[0].e === 2 && r.rows[0].se === 3,
   JSON.stringify(r.rows[0]));

console.log('\n== 5. Un jour vide efface-t-il bien le contenu ? ==');
await as(A, `select public.pousser_jour('2026-09-08'::date, '[]'::jsonb)`);
r = await as(A, `select count(*)::int n from public.seances`);
ok('la journee vide existe (2 seances)', r.rows[0].n === 2, 'n=' + r.rows[0].n);

// ---------------------------------------------------------------- lecture
console.log('\n== 6. tirer_jours rend-il la bonne forme ? ==');
r = await as(A, `select public.tirer_jours(null) j`);
const j = r.rows[0].j;
ok('deux journees rendues', Object.keys(j).length === 2, Object.keys(j).join(','));
ok('cle = date ISO', !!j['2026-09-07']);
ok('exercices dans l ordre d envoi',
   j['2026-09-07'].exercises[0].nom === 'Developpe couche' &&
   j['2026-09-07'].exercises[1].nom === 'Squat');
ok('series dans l ordre d envoi',
   j['2026-09-07'].exercises[0].series[0].reps === '6' &&
   j['2026-09-07'].exercises[0].series[1].reps === '5');
ok('poids rendu en nombre', typeof j['2026-09-07'].exercises[0].series[0].poids === 'number',
   typeof j['2026-09-07'].exercises[0].series[0].poids);
ok('fait rendu en booleen', j['2026-09-07'].exercises[0].series[0].fait === true);
ok('journee vide rendue avec exercises: []',
   Array.isArray(j['2026-09-08'].exercises) && j['2026-09-08'].exercises.length === 0);

console.log('\n== 7. Le tirage incremental fonctionne-t-il ? ==');
const t = (await as(A, `select public.maintenant() m`)).rows[0].m;
r = await as(A, `select public.tirer_jours($1::timestamptz) j`, [t]);
ok('rien de neuf depuis maintenant', Object.keys(r.rows[0].j).length === 0);
await as(A, `select public.pousser_jour('2026-09-09'::date, '[]'::jsonb)`);
r = await as(A, `select public.tirer_jours($1::timestamptz) j`, [t]);
ok('la journee modifiee apres coup remonte, et elle seule',
   Object.keys(r.rows[0].j).length === 1 && !!r.rows[0].j['2026-09-09'],
   Object.keys(r.rows[0].j).join(','));

// ---------------------------------------------------------------- isolation
console.log('\n== 8. Un autre utilisateur voit-il quelque chose ? ==');
r = await as(B, `select count(*)::int n from public.seances`);
ok('B ne voit aucune seance de A', r.rows[0].n === 0, 'n=' + r.rows[0].n);
r = await as(B, `select count(*)::int n from public.series`);
ok('B ne voit aucune serie de A', r.rows[0].n === 0, 'n=' + r.rows[0].n);
r = await as(B, `select public.tirer_jours(null) j`);
ok('tirer_jours ne rend rien a B', Object.keys(r.rows[0].j).length === 0);

r = await as(B, `update public.seances set date = '2000-01-01' returning 1`);
ok('B ne peut pas modifier les seances de A', r.rows.length === 0, r.rows.length + ' ligne(s)');
r = await as(B, `delete from public.seances returning 1`);
ok('B ne peut pas supprimer les seances de A', r.rows.length === 0, r.rows.length + ' ligne(s)');

const idA = (await as(A, `select id::text from public.seances limit 1`)).rows[0].id;
await refuse('B ne peut pas greffer un exercice sur la seance de A', () =>
  as(B, `insert into public.exercices (seance_id, user_id, nom) values ($1::uuid, $2::uuid, 'vol')`, [idA, B]));
await refuse('B ne peut pas s inserer en se faisant passer pour A', () =>
  as(B, `insert into public.seances (user_id, date) values ($1::uuid, '2026-01-01')`, [A]));

console.log('\n== 9. pousser_jour respecte-t-il le proprietaire ? ==');
await as(B, `select public.pousser_jour('2026-09-07'::date, $1::jsonb)`, [JSON.stringify(JOUR)]);
r = await as(A, `select count(*)::int n from public.exercices where nom = 'Squat'`);
ok('A garde son Squat apres que B a pousse la meme date', r.rows[0].n === 1, 'n=' + r.rows[0].n);
r = await as(B, `select count(*)::int n from public.exercices where nom = 'Squat'`);
ok('B a le sien, separement', r.rows[0].n === 1, 'n=' + r.rows[0].n);
r = await db.query(`select count(distinct user_id)::int n from public.seances where date = '2026-09-07'`);
ok('deux proprietaires distincts sur la meme date', r.rows[0].n === 2, 'n=' + r.rows[0].n);

console.log('\n== 10. Un visiteur non connecte ? ==');
await refuse('anon ne peut pas lire les seances', () => asAnon(`select * from public.seances`));
await refuse('anon ne peut pas lire les series',  () => asAnon(`select * from public.series`));
await refuse('anon ne peut pas appeler pousser_jour', () =>
  asAnon(`select public.pousser_jour('2026-09-07'::date, '[]'::jsonb)`));
await refuse('anon ne peut pas appeler tirer_jours', () =>
  asAnon(`select public.tirer_jours(null)`));

console.log('\n== 11. Exercices memorises et consentements ==');
await as(A, `insert into public.exercices_perso (user_id, nom_cle, nom, groupe)
             values (auth.uid(), 'developpe couche', 'Developpe couche', 'Pectoraux')
             on conflict (user_id, nom_cle) do update set groupe = excluded.groupe`);
r = await as(B, `select count(*)::int n from public.exercices_perso`);
ok('B ne voit pas les exercices memorises de A', r.rows[0].n === 0, 'n=' + r.rows[0].n);

await as(A, `insert into public.consentements (user_id, type, version_politique)
             values (auth.uid(), 'sync-cloud', '2.0')`);
r = await as(B, `select count(*)::int n from public.consentements`);
ok('B ne voit pas les consentements de A', r.rows[0].n === 0, 'n=' + r.rows[0].n);
// Deux couches maintenant : le droit de table refuse, et s'il etait accorde
// par erreur, l'absence de policy filtrerait quand meme.
await refuse('un consentement ne se reecrit pas', () =>
  as(A, `update public.consentements set version_politique = '1.0'`));
await refuse('un consentement ne s efface pas', () =>
  as(A, `delete from public.consentements`));

console.log('\n== 13. Superset : le bloc fait l aller-retour ==');
await as(A, `select public.pousser_jour('2026-09-08'::date, $1::jsonb)`, [JSON.stringify([
  { id: 'b1', nom: 'Bench',   groupe: 'Pectoraux', bloc: 'bloc-1', series: [{ poids: 80,  reps: '5' }] },
  { id: 'b2', nom: 'Souleve', groupe: 'Dos',       bloc: 'bloc-1', series: [{ poids: 100, reps: '5' }] },
  { id: 'b3', nom: 'Curl',    groupe: 'Bras',                      series: [{ poids: 12,  reps: '10' }] }
])]);
r = await as(A, `select public.tirer_jours(null) as j`);
const jour = r.rows[0].j['2026-09-08'].exercises;
ok('les deux exercices du superset partagent le meme bloc',
   jour[0].bloc === jour[1].bloc && jour[0].bloc !== null, JSON.stringify(jour.map(e => e.bloc)));
ok('un exercice seul n a pas de bloc', jour[2].bloc === null, JSON.stringify(jour[2].bloc));
ok('l ordre du bloc est conserve',
   jour[0].nom === 'Bench' && jour[1].nom === 'Souleve', jour.map(e => e.nom).join(','));

// Rejouer le meme jour sans bloc doit defaire le superset, pas en garder la trace.
await as(A, `select public.pousser_jour('2026-09-08'::date, $1::jsonb)`, [JSON.stringify([
  { id: 'b1', nom: 'Bench', groupe: 'Pectoraux', series: [{ poids: 80, reps: '5' }] }
])]);
r = await as(A, `select public.tirer_jours(null) as j`);
ok('defaire le superset le retire vraiment',
   r.rows[0].j['2026-09-08'].exercises[0].bloc === null,
   JSON.stringify(r.rows[0].j['2026-09-08'].exercises[0].bloc));

console.log('\n== 14. Les noms d exercices memorises suivent le compte ==');
await as(A, `select public.pousser_exos_perso($1::jsonb)`, [JSON.stringify([
  { cle: 'bench leger', nom: 'Bench leger', groupe: 'Pectoraux' },
  { cle: 'dead',        nom: 'dead',        groupe: 'Dos', alias: 'souleve de terre' },
  { cle: '',            nom: 'vide',        groupe: 'Autre' },
  { cle: '   ',         nom: 'espaces',     groupe: 'Autre' }
])]);
r = await as(A, `select public.tirer_exos_perso() as e`);
let exos = r.rows[0].e;
// 'developpe couche' vient de la section 11 : trois noms, pas deux.
ok('les noms valides sont enregistres', exos.length === 3, JSON.stringify(exos.map(e => e.cle)));
ok('un nom vide est ignore', !exos.some(e => !e.cle.trim()), JSON.stringify(exos.map(e => e.cle)));
ok('l alias est rendu tel quel',
   exos.find(e => e.cle === 'dead').alias === 'souleve de terre',
   JSON.stringify(exos.find(e => e.cle === 'dead')));
ok('un exercice sans alias en rend null',
   exos.find(e => e.cle === 'bench leger').alias === null,
   JSON.stringify(exos.find(e => e.cle === 'bench leger').alias));

// Deux appareils inventent le meme nom : on fusionne, on ne duplique pas.
await as(A, `select public.pousser_exos_perso($1::jsonb)`, [JSON.stringify([
  { cle: 'dead', nom: 'Dead', groupe: 'Dos', alias: null }
])]);
r = await as(A, `select public.tirer_exos_perso() as e`);
exos = r.rows[0].e;
ok('rejouer le meme nom ne cree pas de doublon', exos.length === 3, JSON.stringify(exos.map(e => e.cle)));
ok('le dernier envoi gagne, alias compris',
   exos.find(e => e.cle === 'dead').alias === null && exos.find(e => e.cle === 'dead').nom === 'Dead',
   JSON.stringify(exos.find(e => e.cle === 'dead')));

await refuse('un alias qui pointe sur lui-meme est refuse', () =>
  as(A, `insert into public.exercices_perso (user_id, nom_cle, nom, alias_cle)
         values (auth.uid(), 'boucle', 'boucle', 'boucle')`));

r = await as(B, `select public.tirer_exos_perso() as e`);
ok('B ne recupere aucun nom de A', r.rows[0].e.length === 0, JSON.stringify(r.rows[0].e));

await refuse('anon ne peut pas appeler pousser_exos_perso', () =>
  asAnon(`select public.pousser_exos_perso('[]'::jsonb)`));
await refuse('anon ne peut pas appeler tirer_exos_perso', () =>
  asAnon(`select public.tirer_exos_perso()`));

console.log('\n== 15. Le titre de seance ==');
await as(A, `select public.pousser_titre('2026-09-08'::date, '  Pecs et dos  ')`);
r = await as(A, `select public.tirer_jours(null) as j`);
ok('le titre est rendu, espaces retires',
   r.rows[0].j['2026-09-08'].titre === 'Pecs et dos',
   JSON.stringify(r.rows[0].j['2026-09-08'].titre));

// Renvoyer la journee ne doit pas effacer le titre : ce sont deux appels
// distincts, et l'un ne connait pas l'autre.
await as(A, `select public.pousser_jour('2026-09-08'::date, $1::jsonb)`, [JSON.stringify([
  { id: 'c1', nom: 'Bench', groupe: 'Pectoraux', series: [{ poids: 80, reps: '5' }] }
])]);
r = await as(A, `select public.tirer_jours(null) as j`);
ok('pousser une journee ne perd pas son titre',
   r.rows[0].j['2026-09-08'].titre === 'Pecs et dos',
   JSON.stringify(r.rows[0].j['2026-09-08'].titre));

await as(A, `select public.pousser_titre('2026-09-08'::date, '   ')`);
r = await as(A, `select public.tirer_jours(null) as j`);
ok('un titre vide revient a pas de titre',
   r.rows[0].j['2026-09-08'].titre === null,
   JSON.stringify(r.rows[0].j['2026-09-08'].titre));

// Un titre sur une date jamais vue cree la seance : on peut nommer une
// journee avant d'y avoir note quoi que ce soit.
await as(A, `select public.pousser_titre('2026-09-20'::date, 'Jambes')`);
r = await as(A, `select count(*)::int n from public.seances where date = '2026-09-20'`);
ok('titrer une date vide cree la seance', r.rows[0].n === 1, 'n=' + r.rows[0].n);

r = await as(B, `select public.tirer_jours(null) as j`);
ok('B ne voit pas les titres de A', !r.rows[0].j['2026-09-08'], JSON.stringify(Object.keys(r.rows[0].j)));

await refuse('anon ne peut pas appeler pousser_titre', () =>
  asAnon(`select public.pousser_titre('2026-09-08'::date, 'pirate')`));

console.log('\n== 16. Type de serie : echauffement, top set, travail, back-off ==');
await as(A, `select public.pousser_jour('2026-09-22'::date, $1::jsonb)`, [JSON.stringify([
  { id: 't1', nom: 'Bench', groupe: 'Pectoraux', series: [
    { id: 'ts1', poids: 40,   reps: '10', type: 'echauffement' },
    { id: 'ts2', poids: 72.5, reps: '5',  type: 'top', rpe: 8 },
    { id: 'ts3', poids: 62.5, reps: '10', type: 'backoff' },
    { id: 'ts4', poids: 62.5, reps: '10' }
  ] }
])]);
r = await as(A, `select public.tirer_jours(null) as j`);
const ser = r.rows[0].j['2026-09-22'].exercises[0].series;
ok('l echauffement fait l aller-retour', ser[0].type === 'echauffement', JSON.stringify(ser[0].type));
ok('le top set fait l aller-retour',     ser[1].type === 'top',          JSON.stringify(ser[1].type));
ok('le back-off fait l aller-retour',    ser[2].type === 'backoff',      JSON.stringify(ser[2].type));
ok('une serie sans type revient a null', ser[3].type === null,           JSON.stringify(ser[3].type));
ok('l ordre des series est conserve',
   ser.map(x => Number(x.poids)).join(',') === '40,72.5,62.5,62.5',
   ser.map(x => x.poids).join(','));

// Un type vide envoye par un client casse ne doit pas faire echouer la
// journee entiere : la serie part sans type plutot que de bloquer la synchro.
await as(A, `select public.pousser_jour('2026-09-23'::date, $1::jsonb)`, [JSON.stringify([
  { id: 'u1', nom: 'Squat', groupe: 'Jambes', series: [{ poids: 100, reps: '3', type: '' }] }
])]);
r = await as(A, `select public.tirer_jours(null) as j`);
ok('un type vide devient null, la journee passe quand meme',
   r.rows[0].j['2026-09-23'].exercises[0].series[0].type === null,
   JSON.stringify(r.rows[0].j['2026-09-23'].exercises[0].series[0].type));

await refuse('la base refuse un type inconnu', () =>
  db.query(`insert into public.series (exercice_id, user_id, poids, reps, type)
            select id, user_id, 50, '5', 'nimportequoi' from public.exercices limit 1`));

console.log('\n== 17. Profils ==');

// Premiere ouverture de l'app par A.
r = await as(A, `select public.toucher_profil($1) p`, ['Guigui']);
let prof = r.rows[0].p;
ok('toucher_profil cree la ligne et pose le pseudo', prof.pseudo === 'Guigui', JSON.stringify(prof));
ok('le role par defaut est membre', prof.role === 'membre', JSON.stringify(prof.role));
ok('cree_le vient de auth.users, pas du premier passage',
   String(prof.cree_le).startsWith('2026-01-15'), String(prof.cree_le));

// Le pseudo vit dans les metadonnees du compte ; la colonne n'en est qu'un
// miroir. Quand l'un change, l'autre suit — sinon les deux divergent et on ne
// sait plus lequel croire.
r = await as(A, `select public.toucher_profil($1) p`, ['AutreNom']);
ok('le pseudo suit celui du compte', r.rows[0].p.pseudo === 'AutreNom', JSON.stringify(r.rows[0].p));
r = await as(A, `select public.toucher_profil($1) p`, ['Guigui']);
ok('et il revient si on le remet', r.rows[0].p.pseudo === 'Guigui', JSON.stringify(r.rows[0].p));
r = await as(A, `select public.toucher_profil(null) p`);
ok('retirer son pseudo vide la colonne', r.rows[0].p.pseudo === null, JSON.stringify(r.rows[0].p));
await as(A, `select public.toucher_profil($1)`, ['Guigui']);

// La visite se date a chaque passage : c'est la seule source de « qui est
// revenu cette semaine » cote administration.
r = await db.query(`select vu_le > cree_le v from public.profils where user_id = $1`, [A]);
ok('vu_le avance a chaque ouverture', r.rows[0].v === true, JSON.stringify(r.rows[0]));

// B arrive et veut le meme pseudo que A. Il ne le vole pas, et surtout sa
// connexion n'echoue pas pour autant : il reste simplement sans pseudo.
r = await as(B, `select public.toucher_profil($1) p`, ['guigui']);
ok('un pseudo deja pris n est pas vole', r.rows[0].p.pseudo === null, JSON.stringify(r.rows[0].p));
ok('et l ouverture de B reussit quand meme', r.rows[0].p.role === 'membre');

r = await as(B, `select count(*)::int n from public.profils`);
ok('B ne voit que son propre profil', r.rows[0].n === 1, 'n=' + r.rows[0].n);

await refuse('anon ne peut pas appeler toucher_profil', () =>
  asAnon(`select public.toucher_profil('pirate')`));
await refuse('anon ne lit pas la table profils', () =>
  asAnon(`select * from public.profils`));

// Le point le plus important de cette section. RLS filtre des lignes, pas des
// colonnes : si une policy UPDATE existait sur sa propre ligne, n'importe qui
// se nommerait administrateur depuis la console du navigateur.
await refuse('personne ne peut se nommer administrateur', () =>
  as(A, `update public.profils set role = 'admin' where user_id = $1`, [A]));
await refuse('ni modifier son profil par un autre chemin', () =>
  as(A, `update public.profils set pseudo = 'x' where user_id = $1`, [A]));
await refuse('ni inserer une ligne de profil a la main', () =>
  as(A, `insert into public.profils (user_id, role) values ($1, 'admin')`, [A]));
await refuse('la base refuse un role inconnu', () =>
  db.query(`update public.profils set role = 'super' where user_id = $1`, [A]));


console.log('\n== 18. Retours ==');

await as(A, `insert into public.retours (user_id, type, corps, contexte)
             values ($1, 'bug', 'Le bouton ne repond pas', '{"vue":"seance"}'::jsonb)`, [A]);
await as(B, `insert into public.retours (user_id, type, corps)
             values ($1, 'idee', 'Ajouter un minuteur')`, [B]);

r = await as(A, `select count(*)::int n from public.retours`);
ok('A relit son retour et seulement le sien', r.rows[0].n === 1, 'n=' + r.rows[0].n);

await refuse('A ne peut pas envoyer un retour au nom de B', () =>
  as(A, `insert into public.retours (user_id, corps) values ($1, 'usurpation')`, [B]));
await refuse('personne ne modifie le statut d un retour', () =>
  as(A, `update public.retours set statut = 'traite' where user_id = $1`, [A]));
await refuse('personne n efface un retour', () =>
  as(A, `delete from public.retours where user_id = $1`, [A]));
await refuse('anon n envoie rien', () =>
  asAnon(`insert into public.retours (corps) values ('spam')`));
await refuse('anon ne lit rien', () => asAnon(`select * from public.retours`));

await refuse('la base refuse un type inconnu', () =>
  as(A, `insert into public.retours (user_id, type, corps) values ($1, 'plainte', 'x')`, [A]));
await refuse('la base refuse un corps vide', () =>
  as(A, `insert into public.retours (user_id, corps) values ($1, '')`, [A]));
await refuse('la base refuse un corps de 4001 caracteres', () =>
  as(A, `insert into public.retours (user_id, corps) values ($1, repeat('a', 4001))`, [A]));
await refuse('la base refuse un contexte demesure', () =>
  as(A, `insert into public.retours (user_id, corps, contexte)
         values ($1, 'x', jsonb_build_object('v', repeat('a', 1200)))`, [A]));


console.log('\n== 19. Administration ==');

// Tant que personne n'est admin, les quatre fonctions sont fermees a tous.
r = await as(B, `select public.est_admin() e`);
ok('est_admin repond non pour un membre', r.rows[0].e === false, JSON.stringify(r.rows[0].e));
await refuse('un membre ne voit pas l apercu',   () => as(B, `select public.admin_apercu()`));
await refuse('un membre ne liste pas les gens',  () => as(B, `select * from public.admin_membres()`));
await refuse('un membre ne lit pas les retours', () => as(B, `select * from public.admin_retours()`));
await refuse('un membre ne marque pas un retour', () =>
  as(B, `select public.admin_marquer_retour(gen_random_uuid(), 'vu')`));

// La promotion se fait a la main dans Supabase, hors de l'app — donc ici en
// requete directe, sans passer par un role applicatif.
await db.query(`update public.profils set role = 'admin' where user_id = $1`, [A]);

r = await as(A, `select public.est_admin() e`);
ok('est_admin repond oui une fois promu', r.rows[0].e === true, JSON.stringify(r.rows[0].e));

r = await as(A, `select public.admin_apercu() a`);
const ap = r.rows[0].a;
ok('l apercu compte les deux inscrits', ap.inscrits === 2, JSON.stringify(ap));
ok('l apercu compte les deux retours en attente', ap.retours_nouveaux === 2, JSON.stringify(ap));
ok('l apercu compte les seances de tout le monde', ap.seances >= 2, JSON.stringify(ap));

r = await as(A, `select * from public.admin_membres()`);
ok('admin_membres liste les deux comptes', r.rows.length === 2, 'n=' + r.rows.length);
ok('admin_membres ne renvoie aucun email',
   !Object.keys(r.rows[0]).some(k => /mail/i.test(k)), Object.keys(r.rows[0]).join(','));
ok('admin_membres compte les seances de chacun',
   r.rows.every(x => typeof x.nb_seances !== 'undefined'), JSON.stringify(r.rows[0]));

r = await as(A, `select * from public.admin_retours()`);
ok('admin_retours voit aussi celui de B', r.rows.length === 2, 'n=' + r.rows.length);
r = await as(A, `select * from public.admin_retours('nouveau')`);
ok('admin_retours filtre par statut', r.rows.length === 2, 'n=' + r.rows.length);

const idRetourB = (await db.query(
  `select id from public.retours where user_id = $1`, [B])).rows[0].id;
await as(A, `select public.admin_marquer_retour($1, 'traite')`, [idRetourB]);
r = await db.query(`select statut from public.retours where id = $1`, [idRetourB]);
ok('admin_marquer_retour change le statut', r.rows[0].statut === 'traite', JSON.stringify(r.rows[0]));
await refuse('admin_marquer_retour refuse un statut inconnu', () =>
  as(A, `select public.admin_marquer_retour($1, 'archive')`, [idRetourB]));

// La garantie de non-regression : etre administrateur donne acces aux
// compteurs, jamais au contenu d'un carnet. Le mur de la section 4 tient.
r = await as(A, `select count(*)::int n from public.seances where user_id = $1`, [B]);
ok('meme administrateur, A ne lit pas les seances de B', r.rows[0].n === 0, 'n=' + r.rows[0].n);
r = await as(A, `select count(*)::int n from public.series where user_id = $1`, [B]);
ok('ni ses series', r.rows[0].n === 0, 'n=' + r.rows[0].n);
r = await as(A, `select count(*)::int n from public.profils where user_id = $1`, [B]);
ok('ni la ligne de profil de B en direct', r.rows[0].n === 0, 'n=' + r.rows[0].n);


console.log('\n== 20. Suppression du compte ==');
await db.query('delete from auth.users where id = $1', [A]);
r = await db.query(`select (select count(*) from public.seances   where user_id = $1)::int s,
                           (select count(*) from public.exercices where user_id = $1)::int e,
                           (select count(*) from public.series    where user_id = $1)::int se,
                           (select count(*) from public.exercices_perso where user_id = $1)::int p`, [A]);
const z = r.rows[0];
ok('tout est efface en cascade', z.s === 0 && z.e === 0 && z.se === 0 && z.p === 0, JSON.stringify(z));
r = await db.query(`select count(*)::int n from public.seances where user_id = $1`, [B]);
ok('les donnees de B sont intactes', r.rows[0].n === 1, 'n=' + r.rows[0].n);

// Le profil part avec le compte, le retour reste mais devient anonyme :
// quelqu'un qui s'en va a le droit de disparaitre, pas celui d'effacer un
// bug qu'il a signale.
r = await db.query(`select count(*)::int n from public.profils where user_id = $1`, [A]);
ok('le profil part en cascade', r.rows[0].n === 0, 'n=' + r.rows[0].n);
r = await db.query(`select user_id, corps from public.retours where corps = 'Le bouton ne repond pas'`);
ok('le retour de A survit, sans son auteur',
   r.rows.length === 1 && r.rows[0].user_id === null,
   JSON.stringify(r.rows));

console.log(`\n${pass} reussis, ${fail} echoues`);
process.exit(fail ? 1 : 0);
