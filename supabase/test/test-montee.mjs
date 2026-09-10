// La base de production n'est jamais vide : elle porte la version du schema
// qui y a ete passee la derniere fois. test-rls.mjs part d'une base neuve, et
// ne voit donc pas ce qui casse uniquement a la MONTEE — une fonction dont on
// change les colonnes de retour, par exemple, que Postgres refuse de
// remplacer sans l'avoir supprimee. Dans l'editeur SQL de Supabase, une seule
// erreur annule tout le script : rien ne passe, et rien ne le dit.
//
// Ici, chaque version du schema jamais commitee est installee sur une base
// neuve, puis le schema actuel est passe par-dessus. Deux fois, pour
// l'idempotence.
//
//   node test-montee.mjs
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'fs';
import { execFileSync } from 'child_process';

const RACINE = new URL('../../', import.meta.url);
const ACTUEL = readFileSync(new URL('supabase/schema.sql', RACINE), 'utf8');

const PRELUDE = `
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
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated, service_role;
  alter default privileges in schema public
    grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public
    grant all on functions to anon, authenticated, service_role;
`;

function git(args){
  return execFileSync('git', args, { cwd: RACINE, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

let versions;
try {
  versions = git(['log', '--format=%h %s', '--', 'supabase/schema.sql'])
    .trim().split('\n').filter(Boolean)
    .map(l => ({ h: l.slice(0, l.indexOf(' ')), titre: l.slice(l.indexOf(' ') + 1) }));
} catch (e) {
  console.log('git indisponible : test de montee saute.');
  process.exit(0);
}

let pass = 0, fail = 0;
for (const v of versions){
  let ancien;
  try { ancien = git(['show', v.h + ':supabase/schema.sql']); }
  catch (e) { continue; }
  const db = new PGlite();
  await db.exec(PRELUDE);
  // Des donnees, pour que la montee se fasse sur une base qui a servi.
  await db.query(`insert into auth.users (id, email) values
    ('11111111-1111-1111-1111-111111111111', 'a@exemple.fr'),
    ('22222222-2222-2222-2222-222222222222', 'b@exemple.fr')`);
  let etape = 'ancienne version';
  try {
    await db.exec(ancien);
    // Une journee deja synchronisee : elle doit traverser la montee.
    await db.exec(`insert into public.seances (user_id, date)
                   values ('11111111-1111-1111-1111-111111111111', '2026-09-01')`);
    // Deux retours envoyes avant que le declencheur n'existe : l'un encore
    // nouveau, l'autre deja traite. C'est l'etat reel de la production.
    const aRetours = (await db.query(
      `select to_regclass('public.retours') is not null as oui`)).rows[0].oui;
    // Si l'ancienne version avait deja le declencheur, c'est lui qui a recopie
    // les retours au moment de l'envoi, a sa facon : rien a rattraper.
    const avaitAccuse = (await db.query(
      `select to_regproc('public.accuser_retour') is not null as oui`)).rows[0].oui;
    if (aRetours){
      await db.exec(`insert into public.retours (user_id, type, corps, statut) values
        ('11111111-1111-1111-1111-111111111111', 'bug', 'Le chrono deraille', 'nouveau'),
        ('11111111-1111-1111-1111-111111111111', 'idee', 'Un mode sombre', 'traite')`);
    }
    etape = 'montee vers la version actuelle';
    await db.exec(ACTUEL);
    etape = 'deuxieme passage';
    await db.exec(ACTUEL);

    etape = 'verification apres montee';
    const jours = (await db.query(`select count(*)::int n from public.seances`)).rows[0].n;
    if (jours !== 1) throw new Error('la journee existante a disparu (n=' + jours + ')');
    if (aRetours){
      const copies = (await db.query(
        `select corps, lu from public.messages_support
          where retour_id is not null and auteur = 'membre' order by corps`)).rows;
      if (copies.length !== 2)
        throw new Error('les anciens retours ne sont pas dans le fil (n=' + copies.length + ', attendu 2)');
      if (copies[0].corps !== 'Le chrono deraille' || copies[0].lu !== false)
        throw new Error('le retour nouveau devrait arriver non lu');
      if (!avaitAccuse && copies[1].lu !== true)
        throw new Error('le retour deja traite devrait arriver lu');
      const bruit = (await db.query(
        `select count(*)::int n from public.notifications_admin where type = 'message'`)).rows[0].n;
      if (bruit !== 0) throw new Error('le rattrapage a produit ' + bruit + ' notification(s)');
    }
    pass++;
    console.log('  OK   depuis ' + v.h + ' — ' + v.titre + (aRetours ? '  (+ rattrapage des retours)' : ''));
  } catch (e) {
    fail++;
    console.log('  FAIL depuis ' + v.h + ' — ' + v.titre + '\n       (' + etape + ') ' + e.message);
  }
  await db.close();
}

console.log(`\n${pass} reussis, ${fail} echoues`);
process.exit(fail ? 1 : 0);
