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

console.log('\n== 13 bis. Le commentaire d un exercice fait l aller-retour ==');
await as(A, `select public.pousser_jour('2026-09-08'::date, $1::jsonb)`, [JSON.stringify([
  { id: 'b1', nom: 'Bench', groupe: 'Pectoraux', note: '  Assisté sur la dernière  ', series: [{ poids: 80, reps: '5' }] },
  { id: 'b2', nom: 'Curl',  groupe: 'Bras',      note: 'x'.repeat(600),               series: [{ poids: 12, reps: '10' }] },
  { id: 'b3', nom: 'Rowing', groupe: 'Dos',      note: '   ',                          series: [{ poids: 60, reps: '8' }] }
])]);
r = await as(A, `select public.tirer_jours(null) as j`);
const notes = r.rows[0].j['2026-09-08'].exercises;
ok('le commentaire revient, sans ses espaces', notes[0].note === 'Assisté sur la dernière', JSON.stringify(notes[0].note));
ok('un commentaire trop long est tronque a 500, la journee passe quand meme',
   notes[1].note.length === 500, 'longueur=' + notes[1].note.length);
ok('un commentaire blanc devient null', notes[2].note === null, JSON.stringify(notes[2].note));
// L'app distingue « pas de commentaire » (null) de « base pas encore a jour »
// (cle absente) : la cle doit donc toujours etre la.
ok('la cle note est toujours rendue', notes.every(e => 'note' in e), JSON.stringify(notes.map(e => Object.keys(e))));
await refuse('la base refuse un commentaire de plus de 500 caracteres', () =>
  db.query(`update public.exercices set note = repeat('x', 501) where user_id = $1`, [A]));

console.log('\n== 13 ter. Le commentaire d une serie fait l aller-retour ==');
await as(A, `select public.pousser_jour('2026-09-08'::date, $1::jsonb)`, [JSON.stringify([
  { id: 'b1', nom: 'Bench', groupe: 'Pectoraux', series: [
    { poids: 80, reps: '5', note: '  Assistée  ' },
    { poids: 80, reps: '5', note: 'y'.repeat(600) },
    { poids: 80, reps: '5', note: '   ' },
    { poids: 80, reps: '5' }
  ] }
])]);
r = await as(A, `select public.tirer_jours(null) as j`);
const sn = r.rows[0].j['2026-09-08'].exercises[0].series;
ok('le commentaire de serie revient, sans ses espaces', sn[0].note === 'Assistée', JSON.stringify(sn[0].note));
ok('un commentaire de serie trop long est tronque a 500', sn[1].note.length === 500, 'longueur=' + sn[1].note.length);
ok('un commentaire de serie blanc ou absent devient null', sn[2].note === null && sn[3].note === null,
   JSON.stringify([sn[2].note, sn[3].note]));
ok('la cle note est rendue sur chaque serie', sn.every(s => 'note' in s), JSON.stringify(sn.map(s => Object.keys(s))));
ok('l ordre des series est garde avec leurs commentaires', sn.map(s => s.note && s.note[0]).join() === 'A,y,,',
   JSON.stringify(sn.map(s => s.note && s.note[0])));
await refuse('la base refuse un commentaire de serie de plus de 500 caracteres', () =>
  db.query(`update public.series set note = repeat('x', 501) where user_id = $1`, [A]));

// On remet la journee telle que les sections suivantes l'attendent.
await as(A, `select public.pousser_jour('2026-09-08'::date, $1::jsonb)`, [JSON.stringify([
  { id: 'b1', nom: 'Bench', groupe: 'Pectoraux', series: [{ poids: 80, reps: '5' }] }
])]);

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

// est_admin() est appelable par « authenticated », et c'est necessaire : les
// policies de la messagerie (section 11) l'appellent, et une policy s'evalue
// avec les droits de celui qui interroge. La revoquer casserait la lecture de
// son propre fil. Elle ne prend aucun parametre : elle ne repond que sur
// l'appelant, donc l'exposer ne revele rien sur les autres.
r = await as(B, `select public.est_admin() e`);
ok('est_admin repond non pour un membre', r.rows[0].e === false, JSON.stringify(r.rows[0].e));
r = await as(A, `select public.est_admin() e`);
ok('et non pour un futur administrateur', r.rows[0].e === false, JSON.stringify(r.rows[0].e));
await refuse('mais un visiteur ne peut pas l appeler', () => asAnon(`select public.est_admin()`));

// Tant que personne n'est admin, les quatre fonctions sont fermees a tous.
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


console.log('\n== 20. Hygiene des fonctions ==');

// Une fonction sans « set search_path » resout ses noms avec le chemin de
// l'appelant. Qui peut creer un objet dans un schema place avant « public »
// detourne alors ce que la fonction croit appeler. Le linter Supabase le
// signale ; ce test l'attrape avant lui, et sur toutes les fonctions a la
// fois plutot qu'une par une.
r = await db.query(`
  select p.proname, p.prosecdef, coalesce(array_to_string(p.proconfig, ','), '') cfg
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
  order by p.proname
`);
const sansChemin = r.rows.filter(x => x.cfg.indexOf('search_path=') === -1).map(x => x.proname);
ok('toutes les fonctions figent leur search_path', sansChemin.length === 0, sansChemin.join(', '));
ok('il y a bien des fonctions a verifier', r.rows.length >= 10, r.rows.length + ' fonction(s)');

// Une fonction SECURITY DEFINER s'execute avec les droits de son proprietaire :
// c'est puissant, et chacune doit etre justifiee. On fige la liste pour qu'une
// nouvelle ne s'ajoute pas sans qu'on s'en apercoive.
const definers = r.rows.filter(x => x.prosecdef).map(x => x.proname).sort();
ok('la liste des fonctions SECURITY DEFINER est celle attendue',
   definers.join(',') === [
     // L'accuse de reception : il ecrit un message « systeme », et aucune
     // policy n'autorise quiconque a le faire.
     'accuser_retour',
     'admin_apercu', 'admin_marquer_retour', 'admin_membres', 'admin_retours',
     // Le lien coach : les deux verdicts (recursion de policy) et les quatre
     // ecritures, qui verifient de quel cote du lien se trouve l'appelant.
     'cesser_coach', 'coach_de', 'demander_coach', 'devenir_coach',
     'est_admin', 'mon_coach_id',
     // Le declencheur des notifications : il ecrit dans une table ou personne
     // n'a de policy insert, c'est tout l'interet.
     'notifier_admin',
     'repondre_demande', 'revoquer_lien',
     'toucher_profil'
   ].join(','),
   definers.join(','));

// Les trois lectures du cote coach sont volontairement en INVOKER : elles ne
// verifient aucun droit, c'est RLS qui filtre. Si l'une passait en DEFINER,
// elle rendrait le carnet de n'importe qui a n'importe qui.
['tirer_jours_de', 'mes_coaches', 'mon_coach'].forEach(function(nom){
  const f = r.rows.find(x => x.proname === nom);
  ok(nom + ' reste en SECURITY INVOKER', !!f && f.prosecdef === false, JSON.stringify(f));
});

// Les fonctions de synchro doivent rester en SECURITY INVOKER : en DEFINER,
// elles contourneraient tout le RLS des sections 1 a 4.
['pousser_jour', 'tirer_jours', 'pousser_titre', 'pousser_exos_perso', 'tirer_exos_perso']
  .forEach(function(nom){
    const f = r.rows.find(x => x.proname === nom);
    ok(nom + ' reste en SECURITY INVOKER', !!f && f.prosecdef === false, JSON.stringify(f));
  });


console.log('\n== 21. Le lien coach ↔ coache ==');

// C est la seule ouverture du mur : on l attaque des deux cotes.
// A sera le coach, B le coache. C, un tiers, ne doit jamais rien voir.
const C = '33333333-3333-3333-3333-333333333333';
await db.query('insert into auth.users (id, email, created_at) values ($1,$2,$3)',
  [C, 'c@exemple.fr', '2026-07-01T08:00:00Z']);
await as(C, `select public.toucher_profil($1)`, ['Carole']);

// B a un carnet : c'est lui qu'on protege.
await as(B, `select public.pousser_jour('2026-10-01'::date, $1::jsonb)`, [JSON.stringify([
  { id: 'bx1', nom: 'Squat', groupe: 'Jambes', note: 'Dernière rep assistée', series: [{ poids: 140, reps: '3', rpe: 9, note: 'Sangles' }] }
])]);

console.log('  -- avant tout lien');
let rr = await as(A, `select public.tirer_jours_de($1) j`, [B]);
ok('sans lien, le coach ne tire rien', Object.keys(rr.rows[0].j).length === 0, JSON.stringify(rr.rows[0].j));
rr = await as(A, `select count(*)::int n from public.seances where user_id = $1`, [B]);
ok('sans lien, aucune seance visible', rr.rows[0].n === 0, 'n=' + rr.rows[0].n);

console.log('  -- devenir coach');
rr = await as(A, `select public.devenir_coach() code`);
const CODE = rr.rows[0].code;
ok('le code fait 8 caracteres', typeof CODE === 'string' && CODE.length === 8, String(CODE));
ok('le code evite les caracteres ambigus', !/[O0I1]/.test(CODE), String(CODE));
rr = await as(A, `select public.devenir_coach() code`);
ok('redemander ne change pas le code', rr.rows[0].code === CODE, rr.rows[0].code + ' vs ' + CODE);

console.log('  -- demander un coach');
await refuse('un code inconnu est refuse', () => as(B, `select public.demander_coach('ZZZZZZZZ')`));
await refuse('on ne peut pas se coacher soi-meme', () => as(A, `select public.demander_coach($1)`, [CODE]));

rr = await as(B, `select public.demander_coach($1) d`, [CODE]);
const LIEN = rr.rows[0].d.lien;
ok('la demande cree un lien', !!LIEN, JSON.stringify(rr.rows[0].d));
ok('elle nomme le coach', rr.rows[0].d.coach === 'AutreNom' || typeof rr.rows[0].d.coach === 'string',
   JSON.stringify(rr.rows[0].d.coach));

rr = await db.query(`select count(*)::int n from public.consentements where user_id = $1 and type = 'coaching'`, [B]);
ok('le consentement du coache est trace', rr.rows[0].n === 1, 'n=' + rr.rows[0].n);

// Le lien n'est pas encore accepte : rien ne doit filtrer.
rr = await as(A, `select public.tirer_jours_de($1) j`, [B]);
ok('en attente, le coach ne voit toujours rien', Object.keys(rr.rows[0].j).length === 0);

rr = await as(B, `select public.demander_coach($1) d`, [CODE]);
ok('redemander ne cree pas de doublon', rr.rows[0].d.lien === LIEN, rr.rows[0].d.lien + ' vs ' + LIEN);

console.log('  -- accepter');
await refuse('un tiers ne peut pas repondre a la demande', () =>
  as(C, `select public.repondre_demande($1, true)`, [LIEN]));
await refuse('le coache non plus ne peut pas s auto-accepter', () =>
  as(B, `select public.repondre_demande($1, true)`, [LIEN]));

await as(A, `select public.repondre_demande($1, true)`, [LIEN]);

rr = await as(A, `select public.tirer_jours_de($1) j`, [B]);
// B a plusieurs journees, dont une posee par une section precedente : le coach
// doit voir TOUT le carnet, pas seulement la derniere.
ok('une fois accepte, le coach lit le carnet',
   Object.keys(rr.rows[0].j).length >= 2 && !!rr.rows[0].j['2026-10-01'],
   JSON.stringify(Object.keys(rr.rows[0].j)));
ok('et il voit bien les series',
   rr.rows[0].j['2026-10-01'].exercises[0].series[0].poids === '140.00' ||
   Number(rr.rows[0].j['2026-10-01'].exercises[0].series[0].poids) === 140,
   JSON.stringify(rr.rows[0].j['2026-10-01'].exercises[0].series[0]));
ok('et le commentaire de l exercice',
   rr.rows[0].j['2026-10-01'].exercises[0].note === 'Dernière rep assistée',
   JSON.stringify(rr.rows[0].j['2026-10-01'].exercises[0].note));
ok('et le commentaire de chaque serie',
   rr.rows[0].j['2026-10-01'].exercises[0].series[0].note === 'Sangles',
   JSON.stringify(rr.rows[0].j['2026-10-01'].exercises[0].series[0].note));

rr = await as(A, `select pseudo from public.profils where user_id = $1`, [B]);
ok('le coach voit le pseudo de son coache', rr.rows.length === 1, JSON.stringify(rr.rows));
rr = await as(B, `select pseudo from public.profils where user_id = $1`, [A]);
ok('le coache voit le pseudo de son coach', rr.rows.length === 1, JSON.stringify(rr.rows));

console.log('  -- ce que le coach ne peut PAS faire');
rr = await as(A, `update public.seances set titre = 'pirate' where user_id = $1 returning 1`, [B]);
ok('le coach ne modifie pas une seance', rr.rows.length === 0, rr.rows.length + ' ligne(s)');
rr = await as(A, `delete from public.seances where user_id = $1 returning 1`, [B]);
ok('le coach n efface pas une seance', rr.rows.length === 0, rr.rows.length + ' ligne(s)');
rr = await as(A, `delete from public.series where user_id = $1 returning 1`, [B]);
ok('ni une serie', rr.rows.length === 0, rr.rows.length + ' ligne(s)');
rr = await as(A, `select count(*)::int n from public.consentements where user_id = $1`, [B]);
ok('le coach ne lit pas les consentements de son coache', rr.rows[0].n === 0, 'n=' + rr.rows[0].n);
rr = await as(A, `select count(*)::int n from public.retours where user_id = $1`, [B]);
ok('ni ses retours', rr.rows[0].n === 0, 'n=' + rr.rows[0].n);
await refuse('le coach ne pousse pas de journee chez son coache', () =>
  as(A, `insert into public.seances (user_id, date) values ($1, '2026-11-01')`, [B]));

console.log('  -- le tiers reste dehors');
rr = await as(C, `select public.tirer_jours_de($1) j`, [B]);
ok('un tiers ne tire rien du carnet de B', Object.keys(rr.rows[0].j).length === 0);
rr = await as(C, `select count(*)::int n from public.seances where user_id = $1`, [B]);
ok('un tiers ne voit aucune seance de B', rr.rows[0].n === 0, 'n=' + rr.rows[0].n);
rr = await as(C, `select count(*)::int n from public.liens_coach`);
ok('un tiers ne voit aucun lien', rr.rows[0].n === 0, 'n=' + rr.rows[0].n);
rr = await as(C, `select public.coach_de($1) c`, [B]);
ok('coach_de repond non a un tiers', rr.rows[0].c === false);

console.log('  -- un seul coach actif');
rr = await as(C, `select public.devenir_coach() code`);
await refuse('B ne peut pas prendre un second coach', () =>
  as(B, `select public.demander_coach($1)`, [rr.rows[0].code]));

console.log('  -- revoquer');
await refuse('un tiers ne revoque pas le lien', () => as(C, `select public.revoquer_lien($1)`, [LIEN]));
await as(B, `select public.revoquer_lien($1)`, [LIEN]);

rr = await as(A, `select public.tirer_jours_de($1) j`, [B]);
ok('apres revocation, le coach ne lit plus rien', Object.keys(rr.rows[0].j).length === 0,
   JSON.stringify(rr.rows[0].j));
rr = await as(A, `select count(*)::int n from public.seances where user_id = $1`, [B]);
ok('et plus aucune seance', rr.rows[0].n === 0, 'n=' + rr.rows[0].n);
rr = await as(A, `select count(*)::int n from public.profils where user_id = $1`, [B]);
ok('ni le profil de son ancien coache', rr.rows[0].n === 0, 'n=' + rr.rows[0].n);

rr = await db.query(`select statut, fini_le is not null date from public.liens_coach where id = $1`, [LIEN]);
ok('le lien est marque revoque et date', rr.rows[0].statut === 'revoque' && rr.rows[0].date === true,
   JSON.stringify(rr.rows[0]));

// Apres revocation, B peut reprendre un coach : la contrainte ne visait que
// les liens actifs.
rr = await as(B, `select public.demander_coach($1) d`, [CODE]);
ok('B peut redemander un coach apres revocation', !!rr.rows[0].d.lien);
await as(A, `select public.repondre_demande($1, true)`, [rr.rows[0].d.lien]);

console.log('  -- cesser d etre coach coupe tout');
await as(A, `select public.cesser_coach()`);
rr = await as(A, `select public.tirer_jours_de($1) j`, [B]);
ok('un coach qui arrete ne lit plus rien', Object.keys(rr.rows[0].j).length === 0);
rr = await db.query(`select est_coach, code_coach from public.profils where user_id = $1`, [A]);
ok('son code est rendu', rr.rows[0].est_coach === false && rr.rows[0].code_coach === null,
   JSON.stringify(rr.rows[0]));

console.log('  -- anon dehors partout');
await refuse('anon ne lit pas les liens', () => asAnon(`select * from public.liens_coach`));
await refuse('anon n appelle pas devenir_coach', () => asAnon(`select public.devenir_coach()`));
await refuse('anon n appelle pas demander_coach', () => asAnon(`select public.demander_coach('X')`));
await refuse('anon n appelle pas tirer_jours_de', () => asAnon(`select public.tirer_jours_de($1)`, [B]));


console.log('\n== 22. Messagerie et notifications ==');

// Le fil appartient au membre des deux cotes : un message ecrit par
// l'administrateur porte quand meme le user_id du membre.
await as(B, `insert into public.messages_support (user_id, auteur, corps)
             values ($1, 'membre', 'Le minuteur ne sonne pas')`, [B]);

rr = await as(B, `select count(*)::int n from public.messages_support
                   where auteur = 'membre' and corps = 'Le minuteur ne sonne pas'`);
ok('B lit son fil', rr.rows[0].n === 1, 'n=' + rr.rows[0].n);
rr = await as(B, `select count(*)::int n from public.messages_support where user_id <> $1`, [B]);
ok('et rien d autre que le sien', rr.rows[0].n === 0, 'n=' + rr.rows[0].n);
rr = await as(C, `select count(*)::int n from public.messages_support`);
ok('C ne voit pas le fil de B', rr.rows[0].n === 0, 'n=' + rr.rows[0].n);

// LE point du systeme : le role declare doit correspondre au role reel.
await refuse('un membre ne peut pas signer « admin »', () =>
  as(B, `insert into public.messages_support (user_id, auteur, corps)
         values ($1, 'admin', 'faux message officiel')`, [B]));
await refuse('ni ecrire dans le fil de quelqu un d autre', () =>
  as(C, `insert into public.messages_support (user_id, auteur, corps)
         values ($1, 'membre', 'usurpation')`, [B]));
await refuse('la base refuse un auteur inconnu', () =>
  as(B, `insert into public.messages_support (user_id, auteur, corps)
         values ($1, 'moderateur', 'x')`, [B]));
await refuse('la base refuse un corps vide', () =>
  as(B, `insert into public.messages_support (user_id, auteur, corps) values ($1, 'membre', '')`, [B]));

// Personne ne peut reecrire un message deja envoye : le droit est limite a la
// colonne « lu », pas a la ligne.
await refuse('personne ne reecrit le corps d un message', () =>
  as(B, `update public.messages_support set corps = 'reecrit' where user_id = $1`, [B]));
await as(B, `update public.messages_support set lu = true where user_id = $1`, [B]);
rr = await db.query(`select count(*)::int n from public.messages_support
                     where user_id = $1 and not lu`, [B]);
ok('mais on peut marquer comme lu', rr.rows[0].n === 0, 'restant=' + rr.rows[0].n);

await refuse('personne n efface un message', () =>
  as(B, `delete from public.messages_support where user_id = $1`, [B]));
await refuse('anon ne lit rien', () => asAnon(`select * from public.messages_support`));
await refuse('anon n ecrit rien', () =>
  asAnon(`insert into public.messages_support (user_id, auteur, corps) values ($1,'membre','x')`, [B]));

console.log('  -- cote administrateur');
// C devient administrateur : A a ete promu puis supprime dans les sections
// precedentes, on repart d'un compte propre.
await db.query(`update public.profils set role = 'admin' where user_id = $1`, [C]);

rr = await as(C, `select count(*)::int n from public.messages_support
                   where user_id = $1 and corps = 'Le minuteur ne sonne pas'`, [B]);
ok('un admin lit le fil de B', rr.rows[0].n === 1, 'n=' + rr.rows[0].n);
await as(C, `insert into public.messages_support (user_id, auteur, corps)
             values ($1, 'admin', 'On regarde ca, merci du signalement')`, [B]);
rr = await as(B, `select count(*)::int n from public.messages_support where auteur = 'admin'`);
ok('sa reponse arrive dans le fil de B', rr.rows[0].n === 1, 'n=' + rr.rows[0].n);
await refuse('meme admin, il ne signe pas « membre » chez quelqu un', () =>
  as(C, `insert into public.messages_support (user_id, auteur, corps)
         values ($1, 'membre', 'faux message du membre')`, [B]));

rr = await as(C, `select * from public.admin_fils()`);
const filB = rr.rows.find(x => x.user_id === B);
ok('admin_fils rend un fil par personne',
   !!filB && rr.rows.length === new Set(rr.rows.map(x => x.user_id)).size,
   JSON.stringify(rr.rows.map(x => x.user_id)));
ok('avec le dernier message et le compte des non lus',
   filB.dernier === 'On regarde ca, merci du signalement' && Number(filB.non_lus) === 0,
   JSON.stringify(filB));
// Un troisieme fil, pour verifier ce qui compte vraiment.
await as(C, `insert into public.messages_support (user_id, auteur, corps)
             values ($1, 'membre', 'Question de Carole')`, [C]);

rr = await as(B, `select * from public.admin_fils()`);
ok('un membre n obtient que son propre fil',
   rr.rows.length === 1 && rr.rows[0].user_id === B,
   JSON.stringify(rr.rows.map(x => x.user_id)));
ok('et jamais celui d un autre',
   !rr.rows.some(x => x.user_id !== B),
   JSON.stringify(rr.rows.map(x => x.user_id)));

console.log('  -- les notifications');
rr = await as(C, `select type, count(*)::int n from public.notifications_admin group by type order by type`);
const types = rr.rows.map(x => x.type + ':' + x.n).join(' ');
ok('les declencheurs ont ecrit', rr.rows.length >= 2, types);
ok('une notification par inscription', types.indexOf('inscription') > -1, types);
ok('une notification par message de membre', types.indexOf('message') > -1, types);
ok('une notification par demande de coaching', types.indexOf('coach') > -1, types);

rr = await db.query(`select count(*)::int n from public.notifications_admin
                     where type = 'message' and contenu like 'Le minuteur%'`);
ok('le contenu vient de la ligne ecrite, pas d un parametre', rr.rows[0].n === 1, 'n=' + rr.rows[0].n);
// La propriete a verifier n'est pas un total — il bouge des qu'on ajoute un
// message ailleurs — mais qu'AUCUNE notification ne porte le texte ecrit par
// l'administrateur.
rr = await db.query(`select count(*)::int n from public.notifications_admin
                     where contenu like 'On regarde ca%'`);
ok('la reponse de l admin ne se notifie pas elle-meme', rr.rows[0].n === 0, 'n=' + rr.rows[0].n);
rr = await db.query(`select count(*)::int n from public.notifications_admin
                     where type = 'message' and contenu like 'Question de Carole%'`);
ok('mais chaque message de membre en cree une', rr.rows[0].n === 1, 'n=' + rr.rows[0].n);

rr = await as(B, `select count(*)::int n from public.notifications_admin`);
ok('un membre ne voit aucune notification', rr.rows[0].n === 0, 'n=' + rr.rows[0].n);
await refuse('personne ne fabrique une notification', () =>
  as(C, `insert into public.notifications_admin (type, contenu) values ('message', 'inventee')`));
await refuse('meme un admin ne peut pas en inserer', () =>
  as(C, `insert into public.notifications_admin (type, user_id, contenu) values ('retour', $1, 'x')`, [B]));
await refuse('ni en effacer', () => as(C, `delete from public.notifications_admin`));
await refuse('ni en reecrire le contenu', () =>
  as(C, `update public.notifications_admin set contenu = 'trafique'`));
await as(C, `update public.notifications_admin set lu = true`);
rr = await db.query(`select count(*)::int n from public.notifications_admin where not lu`);
ok('mais un admin peut les marquer lues', rr.rows[0].n === 0, 'n=' + rr.rows[0].n);
await refuse('anon ne lit aucune notification', () => asAnon(`select * from public.notifications_admin`));


console.log('\n== 23. L accuse de reception ==');
// Envoyer un retour dans le vide, c'est ne pas savoir s'il est parti. Le
// declencheur ouvre le fil a la place du membre — mais sans se faire passer
// pour quelqu'un : personne n'a encore lu ce retour.
rr = await db.query(`select count(*)::int n from public.messages_support
                     where user_id = $1 and auteur = 'systeme'`, [C]);
const avantAccuse = rr.rows[0].n;
await as(C, `insert into public.retours (user_id, type, corps)
             values ($1, 'bug', 'Le chrono deraille')`, [C]);
rr = await db.query(`select auteur, corps from public.messages_support
                     where user_id = $1 and auteur = 'systeme'
                     order by cree_le desc limit 1`, [C]);
ok('un retour ouvre le fil', rr.rows.length === 1);
ok('et le message est signe « systeme », pas « admin »',
   rr.rows[0].auteur === 'systeme', rr.rows[0].auteur);
ok('il dit qu on repondra, pas qu on a lu',
   /dès que possible/.test(rr.rows[0].corps), rr.rows[0].corps);
rr = await db.query(`select count(*)::int n from public.messages_support
                     where user_id = $1 and auteur = 'systeme'`, [C]);
ok('un accuse par retour', rr.rows[0].n === avantAccuse + 1, 'n=' + rr.rows[0].n);

// La conversation commence par la question, pas par l'accuse : le retour est
// recopie dans le fil, signe du membre, et l'accuse vient juste apres.
rr = await db.query(`select auteur, corps, retour_id from public.messages_support
                     where user_id = $1 and retour_id is not null
                     order by cree_le desc, auteur desc limit 2`, [C]);
const [accuse, copie] = rr.rows;
ok('le retour est recopie dans le fil, signe du membre',
   copie && copie.auteur === 'membre' && copie.corps === 'Le chrono deraille',
   JSON.stringify(copie));
ok('la copie et l accuse pointent vers le retour',
   copie && accuse && copie.retour_id === accuse.retour_id && !!copie.retour_id);
rr = await db.query(`select auteur from public.messages_support
                     where user_id = $1 and retour_id is not null
                     order by cree_le`, [C]);
ok('la question passe avant l accuse, meme dans la meme transaction',
   rr.rows.slice(-2).map(x => x.auteur).join(',') === 'membre,systeme',
   rr.rows.map(x => x.auteur).join(','));

// Un geste, une notification : le retour a la sienne, sa copie n'en ajoute pas.
rr = await db.query(`select type, count(*)::int n from public.notifications_admin
                     where contenu like '%Le chrono deraille%' group by type`);
ok('un seul retour ne produit qu une notification',
   rr.rows.length === 1 && rr.rows[0].type === 'retour' && rr.rows[0].n === 1,
   JSON.stringify(rr.rows));

// Et personne ne peut poser retour_id a la main pour faire taire la sienne.
await refuse('un membre ne pose pas retour_id lui-meme', () =>
  as(B, `insert into public.messages_support (user_id, auteur, corps, retour_id)
         select $1, 'membre', 'message discret', id from public.retours limit 1`, [B]));

// L'accuse ne doit pas se notifier lui-meme : l'administrateur serait prevenu
// de sa propre reponse automatique.
rr = await db.query(`select count(*)::int n from public.notifications_admin
                     where type = 'message' and contenu like 'Bien reçu%'`);
ok('l accuse ne se notifie pas', rr.rows[0].n === 0, 'n=' + rr.rows[0].n);

// Personne ne peut signer « systeme » : aucune policy ne l'autorise, et c'est
// exactement ce qui rend le declencheur credible.
await refuse('un membre ne peut pas signer « systeme »', () =>
  as(B, `insert into public.messages_support (user_id, auteur, corps)
         values ($1, 'systeme', 'faux accuse')`, [B]));
await refuse('un admin non plus', () =>
  as(C, `insert into public.messages_support (user_id, auteur, corps)
         values ($1, 'systeme', 'faux accuse')`, [B]));

rr = await as(C, `select user_id from public.admin_retours() limit 1`);
ok('admin_retours rend le user_id, sinon on ne peut pas repondre',
   rr.rows.length === 1 && !!rr.rows[0].user_id, JSON.stringify(rr.rows[0]));


console.log('\n== 24. La conversation coach ↔ coache ==');
// On repart d'un lien propre : D coache E.
const D = '44444444-4444-4444-4444-444444444444';
const E = '55555555-5555-5555-5555-555555555555';
for (const [id, mail] of [[D, 'd@t.fr'], [E, 'e@t.fr']]){
  await db.query(`insert into auth.users (id, email) values ($1, $2)
                  on conflict (id) do nothing`, [id, mail]);
  await as(id, `select public.toucher_profil()`);
}
await as(D, `select public.devenir_coach()`);
rr = await db.query(`select code_coach from public.profils where user_id = $1`, [D]);
await as(E, `select public.demander_coach($1, 'oui')`, [rr.rows[0].code_coach]);
rr = await db.query(`select id from public.liens_coach where client_id = $1`, [E]);
await as(D, `select public.repondre_demande($1, true)`, [rr.rows[0].id]);

await as(E, `insert into public.messages_coach (coach_id, client_id, auteur, corps)
             values ($1, $2, 'client', 'J ai mal a l epaule sur le developpe')`, [D, E]);
await as(D, `insert into public.messages_coach (coach_id, client_id, auteur, corps)
             values ($1, $2, 'coach', 'On passe en prise neutre cette semaine')`, [D, E]);

rr = await as(E, `select count(*)::int n from public.messages_coach`);
ok('le coache lit le fil', rr.rows[0].n === 2, 'n=' + rr.rows[0].n);
rr = await as(D, `select count(*)::int n from public.messages_coach`);
ok('le coach lit le meme fil', rr.rows[0].n === 2, 'n=' + rr.rows[0].n);
rr = await as(B, `select count(*)::int n from public.messages_coach`);
ok('personne d autre ne le lit', rr.rows[0].n === 0, 'n=' + rr.rows[0].n);
rr = await as(C, `select count(*)::int n from public.messages_coach`);
ok('pas meme l administrateur', rr.rows[0].n === 0, 'n=' + rr.rows[0].n);

// Le meme point que pour le support : le role declare doit correspondre au
// role reel, et ici « reel » se lit dans le lien, pas dans un booleen.
await refuse('un coache ne peut pas signer « coach »', () =>
  as(E, `insert into public.messages_coach (coach_id, client_id, auteur, corps)
         values ($1, $2, 'coach', 'faux conseil')`, [D, E]));
await refuse('un coach ne peut pas signer « client »', () =>
  as(D, `insert into public.messages_coach (coach_id, client_id, auteur, corps)
         values ($1, $2, 'client', 'faux ressenti')`, [D, E]));
await refuse('un inconnu n ecrit pas dans le fil des autres', () =>
  as(B, `insert into public.messages_coach (coach_id, client_id, auteur, corps)
         values ($1, $2, 'coach', 'intrusion')`, [D, E]));
await refuse('ni en se declarant coach de quelqu un qu il ne suit pas', () =>
  as(B, `insert into public.messages_coach (coach_id, client_id, auteur, corps)
         values ($1, $2, 'coach', 'intrusion')`, [B, E]));
await refuse('la base refuse un auteur inconnu', () =>
  as(E, `insert into public.messages_coach (coach_id, client_id, auteur, corps)
         values ($1, $2, 'moderateur', 'x')`, [D, E]));
await refuse('et un fil avec soi-meme', () =>
  db.query(`insert into public.messages_coach (coach_id, client_id, auteur, corps)
            values ($1, $1, 'coach', 'x')`, [D]));

await refuse('personne ne reecrit un message envoye', () =>
  as(D, `update public.messages_coach set corps = 'reecrit'`));
await as(E, `update public.messages_coach set lu = true where auteur = 'coach'`);
rr = await db.query(`select count(*)::int n from public.messages_coach where auteur = 'coach' and not lu`);
ok('mais on marque comme lu', rr.rows[0].n === 0, 'n=' + rr.rows[0].n);
await refuse('personne n efface', () => as(D, `delete from public.messages_coach`));
await refuse('anon ne lit rien', () => asAnon(`select * from public.messages_coach`));

// Couper le suivi ferme la porte au coach — et seulement a lui. La
// conversation reste celle du coache : c'est son historique, pas celui du
// coach.
rr = await db.query(`select id from public.liens_coach where client_id = $1 and statut = 'actif'`, [E]);
await as(E, `select public.revoquer_lien($1)`, [rr.rows[0].id]);
rr = await as(D, `select count(*)::int n from public.messages_coach`);
ok('le coach ne lit plus rien apres la rupture', rr.rows[0].n === 0, 'n=' + rr.rows[0].n);
rr = await as(E, `select count(*)::int n from public.messages_coach`);
ok('le coache garde son historique', rr.rows[0].n === 2, 'n=' + rr.rows[0].n);
await refuse('et le coach n ecrit plus', () =>
  as(D, `insert into public.messages_coach (coach_id, client_id, auteur, corps)
         values ($1, $2, 'coach', 'je reviens')`, [D, E]));
await refuse('le coache non plus, il n a plus de coach', () =>
  as(E, `insert into public.messages_coach (coach_id, client_id, auteur, corps)
         values ($1, $2, 'client', 'tu es la ?')`, [D, E]));


console.log('\n== 25. Suppression du compte ==');
// Compte avant, compare apres : un nombre en dur se perime des qu'une section
// precedente ajoute une journee, et le test se met alors a mentir.
const avantB = (await db.query(
  "select count(*)::int n from public.seances where user_id = $1", [B])).rows[0].n;
const notifsA = (await db.query(
  "select count(*)::int n from public.notifications_admin where user_id = $1", [A])).rows[0].n;
const notifsAutres = (await db.query(
  "select count(*)::int n from public.notifications_admin where user_id <> $1", [A])).rows[0].n;
await db.query('delete from auth.users where id = $1', [A]);
r = await db.query(`select (select count(*) from public.seances   where user_id = $1)::int s,
                           (select count(*) from public.exercices where user_id = $1)::int e,
                           (select count(*) from public.series    where user_id = $1)::int se,
                           (select count(*) from public.exercices_perso where user_id = $1)::int p`, [A]);
const z = r.rows[0];
ok('tout est efface en cascade', z.s === 0 && z.e === 0 && z.se === 0 && z.p === 0, JSON.stringify(z));
r = await db.query(`select count(*)::int n from public.seances where user_id = $1`, [B]);
ok('les donnees de B sont intactes', r.rows[0].n === avantB && avantB > 0,
   r.rows[0].n + ' vs ' + avantB);

// Le profil part avec le compte, le retour reste mais devient anonyme :
// quelqu'un qui s'en va a le droit de disparaitre, pas celui d'effacer un
// bug qu'il a signale.
r = await db.query(`select count(*)::int n from public.profils where user_id = $1`, [A]);
ok('le profil part en cascade', r.rows[0].n === 0, 'n=' + r.rows[0].n);
r = await db.query(`select user_id, corps from public.retours where corps = 'Le bouton ne repond pas'`);
ok('le retour de A survit, sans son auteur',
   r.rows.length === 1 && r.rows[0].user_id === null,
   JSON.stringify(r.rows));

// Une notification porte le pseudo ou le debut d'un message : orpheline, elle
// restait identifiable. Elle part avec le compte.
r = await db.query(`select (select count(*) from public.notifications_admin where user_id is null)::int orph,
                           (select count(*) from public.notifications_admin)::int total`);
ok('les notifications de A partent avec lui', notifsA > 0 && r.rows[0].orph === 0,
   'avant=' + notifsA + ' orphelines=' + r.rows[0].orph);
ok('et celles des autres restent', r.rows[0].total === notifsAutres,
   r.rows[0].total + ' vs ' + notifsAutres);

console.log(`\n${pass} reussis, ${fail} echoues`);
process.exit(fail ? 1 : 0);
