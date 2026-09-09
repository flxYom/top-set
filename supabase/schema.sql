-- ============================================================================
-- TOP SET (site statique) — schéma Supabase
-- ============================================================================
-- À exécuter dans Supabase : Project → SQL Editor → New query → coller → Run.
-- Idempotent : le relancer ne casse rien et n'efface aucune donnée.
--
-- Ce fichier remplace schema.sql pour l'app web. Différences, et pourquoi :
--
--   · Pas de connexion par pseudo. Elle exigeait email_for_pseudo() en
--     service_role, donc un serveur. Top Set est un site statique : il n'y en
--     a pas. C'est email + mot de passe, et rien qui prétende le contraire.
--   · Pas de vues d'agrégats sur le carnet. L'app calcule déjà volume et
--     records en local, sur des données qu'elle a déjà en cache. Les ajouter
--     serait du code à sécuriser pour zéro gain.
--
-- Modèle : carnets strictement privés. Personne ne voit les séances d'un
-- autre — sections 1 à 6.
--
-- Les sections 7 à 9 ajoutent la seule exception : un profil public réduit
-- (pseudo, rôle, dates), des retours utilisateurs, et quatre fonctions
-- d'administration. Aucune ne lit une ligne de carnet. Le mur du carnet
-- reste entier.
-- ============================================================================


-- ============================================================================
-- 1. LE CARNET : séances → exercices → séries
-- ============================================================================
-- Trois tables plutôt qu'un blob JSON par personne : on peut ne tirer qu'une
-- semaine, et la structure reste interrogeable le jour où on en a besoin.

-- Les clés primaires sont (user_id, id), pas id seul. Un identifiant
-- d'exercice n'a de sens que dans le carnet de son propriétaire : deux
-- personnes doivent pouvoir porter le même sans se gêner. Ce n'est pas
-- théorique — le fichier de sauvegarde contient les identifiants, donc
-- quelqu'un qui importe la sauvegarde d'un ami hériterait des siens.
create table if not exists public.seances (
  id          uuid not null default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  date        date not null,
  updated_at  timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  primary key (user_id, id),
  unique (user_id, date)    -- une séance par personne et par jour
);

create table if not exists public.exercices (
  id          uuid not null default gen_random_uuid(),
  seance_id   uuid not null,
  user_id     uuid not null,
  ordre       smallint not null default 0,
  nom         text not null default '',
  groupe      text not null default 'Autre',
  repos       text,
  primary key (user_id, id),
  -- La FK composite rend structurellement impossible qu'un exercice appartienne
  -- à la séance de quelqu'un d'autre : ce n'est pas une règle applicative qu'on
  -- pourrait oublier, c'est la base qui refuse la ligne.
  foreign key (user_id, seance_id) references public.seances (user_id, id) on delete cascade
);

create table if not exists public.series (
  id           uuid not null default gen_random_uuid(),
  exercice_id  uuid not null,
  user_id      uuid not null,
  ordre        smallint not null default 0,
  poids        numeric(6,2),
  -- reps reste du texte : l'app accepte « 8-10 » ou « échec ».
  reps         text,
  -- RPE sur l'échelle des reps en réserve : 10 = plus rien dans le réservoir,
  -- 9 = une rep restante. Les demi-points sont courants, d'où le numeric.
  rpe          numeric(3,1) check (rpe is null or (rpe >= 0 and rpe <= 10)),
  repos        text,
  fait         boolean not null default false,
  primary key (user_id, id),
  foreign key (user_id, exercice_id) references public.exercices (user_id, id) on delete cascade
);

-- Le titre d'une seance. Nullable : sans titre choisi, l'app en calcule un
-- a partir des groupes travailles, et un titre calcule n'a rien a faire en
-- base — il changerait avec la seance sans qu'on l'ait demande.
alter table public.seances add column if not exists titre text;

-- Type d'une serie : echauffement, top set, charge de travail ou back-off.
-- Nullable, et c'est voulu : « charge de travail » est la valeur par defaut,
-- et c'est l'etat de toutes les series enregistrees avant ce champ. Ecrire
-- 'travail' partout ne dirait rien de plus et reecrirait tout l'historique.
alter table public.series add column if not exists type text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'series_type_connu'
  ) then
    alter table public.series
      add constraint series_type_connu
      check (type is null or type in ('echauffement','top','travail','backoff'));
  end if;
end $$;

-- Superset : les exercices qui portent le meme « bloc » se font ensemble. La
-- colonne est nullable parce que l'immense majorite des exercices sont seuls,
-- et qu'un exercice seul ne doit rien avoir a porter.
alter table public.exercices add column if not exists bloc text;

create index if not exists seances_user_maj_idx  on public.seances   (user_id, updated_at desc);
create index if not exists seances_user_date_idx on public.seances   (user_id, date desc);
create index if not exists exercices_seance_idx  on public.exercices (user_id, seance_id, ordre);
create index if not exists series_exercice_idx   on public.series    (user_id, exercice_id, ordre);


-- ============================================================================
-- 2. LES EXERCICES MÉMORISÉS
-- ============================================================================
-- L'app retient les exercices tapés à la main et leur groupe musculaire. Sans
-- cette table, changer d'appareil fait perdre cette mémoire alors que les
-- séances, elles, suivent.
create table if not exists public.exercices_perso (
  user_id     uuid not null references auth.users (id) on delete cascade,
  -- La clé est le nom normalisé : « développé couché » et « Développé Couché »
  -- sont le même exercice, et doivent le rester d'un appareil à l'autre.
  nom_cle     text not null,
  nom         text not null,
  groupe      text not null default 'Autre',
  updated_at  timestamptz not null default now(),
  -- « dead » est le soulevé de terre de son auteur, pas celui d'un
  -- dictionnaire. alias_cle pointe vers la cle d'un autre exercice memorise :
  -- les deux noms partagent alors historique, records et recap. Null = le nom
  -- est un exercice a part entiere.
  alias_cle   text,
  primary key (user_id, nom_cle)
);

alter table public.exercices_perso add column if not exists alias_cle text;

-- Un alias doit designer un exercice qui existe, et jamais lui-meme : sans
-- cette contrainte, une boucle « a pointe vers b qui pointe vers a » rendrait
-- la resolution du nom infinie cote client.
alter table public.exercices_perso
  drop constraint if exists exercices_perso_alias_pas_soi;
alter table public.exercices_perso
  add  constraint exercices_perso_alias_pas_soi
  check (alias_cle is null or alias_cle <> nom_cle);


-- ============================================================================
-- 3. CONSENTEMENTS (RGPD)
-- ============================================================================
-- À partir du moment où les données quittent l'appareil, il faut pouvoir
-- prouver quand et à quelle version de la politique l'utilisateur a consenti.
create table if not exists public.consentements (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  type              text not null,
  version_politique text not null,
  date_consentement timestamptz not null default now()
);

create index if not exists consentements_user_idx
  on public.consentements (user_id, date_consentement desc);


-- ============================================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================================
alter table public.seances         enable row level security;
alter table public.exercices       enable row level security;
alter table public.series          enable row level security;
alter table public.exercices_perso enable row level security;
alter table public.consentements   enable row level security;

-- USING filtre ce qu'on peut lire ou toucher ; WITH CHECK empêche d'écrire une
-- ligne au nom de quelqu'un d'autre. Les deux sont nécessaires : sans WITH
-- CHECK on pourrait insérer chez le voisin sans jamais pouvoir le relire.
drop policy if exists "Chacun gere ses seances" on public.seances;
create policy "Chacun gere ses seances"
  on public.seances for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Chacun gere ses exercices" on public.exercices;
create policy "Chacun gere ses exercices"
  on public.exercices for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Chacun gere ses series" on public.series;
create policy "Chacun gere ses series"
  on public.series for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Chacun gere ses exercices perso" on public.exercices_perso;
create policy "Chacun gere ses exercices perso"
  on public.exercices_perso for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Un consentement est une trace datée : il s'écrit et se lit, il ne se modifie
-- pas et ne s'efface pas. Pas de policy update/delete = tout est refusé.
drop policy if exists "Chacun voit ses consentements" on public.consentements;
create policy "Chacun voit ses consentements"
  on public.consentements for select using (auth.uid() = user_id);

drop policy if exists "Chacun enregistre son consentement" on public.consentements;
create policy "Chacun enregistre son consentement"
  on public.consentements for insert with check (auth.uid() = user_id);


-- ============================================================================
-- 5. DROITS DE TABLE
-- ============================================================================
-- Supabase pose déjà des droits par défaut sur le schéma public. On les écrit
-- quand même : la sécurité du carnet ne doit pas dépendre d'un réglage de
-- projet qu'on ne contrôle pas. « anon » (visiteur non connecté) n'obtient
-- rien du tout sur les données.
revoke all on public.seances, public.exercices, public.series,
              public.exercices_perso, public.consentements from anon;

grant select, insert, update, delete
  on public.seances, public.exercices, public.series, public.exercices_perso
  to authenticated;

-- Un consentement s'ecrit et se relit, il ne se corrige pas et ne s'efface
-- pas : c'est une trace datee, pas un reglage. L'absence de policy UPDATE le
-- garantissait deja ; le revoke l'ecrit aussi au niveau du droit de table,
-- pour que la garantie ne repose pas sur une seule couche.
revoke all on public.consentements from authenticated;
grant  select, insert on public.consentements to authenticated;


-- ============================================================================
-- 6. SYNCHRONISATION
-- ============================================================================
-- Le jour est l'unité de synchro. C'est déjà l'unité de l'app : state.sessions
-- est une carte date → journée. Envoyer un jour entier plutôt que des lignes
-- éparses supprime d'un coup les doublons, les fusions partielles et les
-- ordres de séries incohérents.
--
-- Les deux fonctions sont en SECURITY INVOKER : elles s'exécutent avec les
-- droits de l'appelant, donc RLS s'applique intégralement. Une fonction
-- SECURITY DEFINER ici contournerait tout ce qui précède.

-- Un identifiant venu du client n'est pas forcément un UUID (les anciennes
-- données locales ont des identifiants « x1a2b3c »). On ne fait pas confiance
-- au format : ce qui n'est pas un UUID est remplacé par un neuf.
create or replace function public.uuid_ou_neuf(p text)
returns uuid language sql immutable as $$
  select case
    when p ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then p::uuid else gen_random_uuid() end;
$$;

-- Écrit un jour entier, de façon atomique. Soit la journée est enregistrée en
-- entier, soit rien ne change : c'est ce qui empêche qu'une coupure réseau
-- laisse une séance vidée de ses exercices dans le cloud.
create or replace function public.pousser_jour(p_date date, p_exercices jsonb)
returns timestamptz
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user   uuid := auth.uid();
  v_seance uuid;
  v_maj    timestamptz;
  v_ex     jsonb;
  v_se     jsonb;
  v_ex_id  uuid;
  i        smallint := 0;
  j        smallint;
begin
  -- Le user_id ne vient JAMAIS du corps de la requête : il vient du jeton.
  -- C'est la seule façon de garantir qu'on n'écrit pas chez quelqu'un d'autre.
  if v_user is null then
    raise exception 'Aucune session : connexion requise.';
  end if;

  insert into public.seances (user_id, date)
  values (v_user, p_date)
  on conflict (user_id, date) do update set updated_at = now()
  returning id into v_seance;

  -- Remplacement complet du jour. Les séries partent en cascade.
  delete from public.exercices where user_id = v_user and seance_id = v_seance;

  for v_ex in select * from jsonb_array_elements(coalesce(p_exercices, '[]'::jsonb))
  loop
    v_ex_id := public.uuid_ou_neuf(v_ex ->> 'id');
    insert into public.exercices (id, seance_id, user_id, ordre, nom, groupe, repos, bloc)
    values (v_ex_id, v_seance, v_user, i,
            coalesce(v_ex ->> 'nom', ''),
            coalesce(nullif(v_ex ->> 'groupe', ''), 'Autre'),
            v_ex ->> 'repos',
            nullif(v_ex ->> 'bloc', ''));

    j := 0;
    for v_se in select * from jsonb_array_elements(coalesce(v_ex -> 'series', '[]'::jsonb))
    loop
      insert into public.series (id, exercice_id, user_id, ordre, poids, reps, rpe, repos, type, fait)
      values (public.uuid_ou_neuf(v_se ->> 'id'), v_ex_id, v_user, j,
              nullif(v_se ->> 'poids', '')::numeric,
              coalesce(v_se ->> 'reps', ''),
              nullif(v_se ->> 'rpe', '')::numeric,
              coalesce(v_se ->> 'repos', ''),
              -- Un type inconnu vaut mieux perdu que stocke : la contrainte
              -- refuserait la ligne entiere et la journee ne partirait plus.
              nullif(v_se ->> 'type', ''),
              coalesce((v_se ->> 'fait')::boolean, false));
      j := j + 1;
    end loop;
    i := i + 1;
  end loop;

  update public.seances set updated_at = now()
  where id = v_seance
  returning updated_at into v_maj;

  return v_maj;
end;
$$;

-- Le titre part separement de la journee. Le mettre dans pousser_jour aurait
-- change la signature de la fonction, donc casse la synchro de tous les
-- appareils tant que ce fichier n'est pas relance. Un appel a part echoue
-- seul, et la journee passe quand meme.
create or replace function public.pousser_titre(p_date date, p_titre text)
returns timestamptz
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_maj  timestamptz;
begin
  if v_user is null then
    raise exception 'Aucune session : connexion requise.';
  end if;

  insert into public.seances (user_id, date, titre)
  values (v_user, p_date, nullif(trim(coalesce(p_titre, '')), ''))
  on conflict (user_id, date) do update
    set titre = nullif(trim(coalesce(p_titre, '')), ''),
        updated_at = now()
  returning updated_at into v_maj;

  return v_maj;
end;
$$;

-- Rend les journées dans la forme exacte que l'app utilise en local, pour que
-- le client n'ait aucune conversion à faire. Sans argument : tout l'historique
-- (nouvel appareil). Avec p_depuis : seulement ce qui a bougé depuis.
create or replace function public.tirer_jours(p_depuis timestamptz default null)
returns jsonb
language sql
security invoker
stable
set search_path = public
as $$
  select coalesce(jsonb_object_agg(d.jour_date, d.contenu), '{}'::jsonb)
  from (
    select
      s.date::text as jour_date,
      jsonb_build_object(
        'date', s.date::text,
        'titre', s.titre,
        'updatedAt', s.updated_at,
        'exercises', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'id', e.id,
              'nom', e.nom,
              'groupe', e.groupe,
              'repos', coalesce(e.repos, ''),
              'bloc', e.bloc,
              'series', coalesce((
                select jsonb_agg(
                  jsonb_build_object(
                    'id',    se.id,
                    'poids', se.poids,
                    'reps',  coalesce(se.reps, ''),
                    'rpe',   se.rpe,
                    'repos', coalesce(se.repos, ''),
                    'type',  se.type,
                    'fait',  se.fait
                  ) order by se.ordre)
                from public.series se where se.user_id = e.user_id and se.exercice_id = e.id
              ), '[]'::jsonb)
            ) order by e.ordre)
          from public.exercices e where e.user_id = s.user_id and e.seance_id = s.id
        ), '[]'::jsonb)
      ) as contenu
    from public.seances s
    where s.user_id = auth.uid()
      and (p_depuis is null or s.updated_at > p_depuis)
  ) d;
$$;

-- Horloge du serveur. Le client ne doit pas dater ses synchros avec l'heure du
-- téléphone : un mobile déréglé de dix minutes sauterait des journées entières
-- au prochain tirage.
create or replace function public.maintenant()
returns timestamptz language sql stable as $$ select now(); $$;

-- Les noms d'exercices memorises suivent le compte, comme les seances. Deux
-- appareils peuvent en avoir invente chacun de leur cote : on fusionne au lieu
-- de choisir, et le plus recent gagne sur un meme nom.
create or replace function public.pousser_exos_perso(p_exos jsonb)
returns timestamptz
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ex   jsonb;
begin
  if v_user is null then
    raise exception 'Aucune session : connexion requise.';
  end if;

  for v_ex in select * from jsonb_array_elements(coalesce(p_exos, '[]'::jsonb))
  loop
    -- Un nom vide n'est pas un exercice, et une cle vide ecraserait les autres.
    continue when coalesce(trim(v_ex ->> 'cle'), '') = '';

    insert into public.exercices_perso (user_id, nom_cle, nom, groupe, alias_cle, updated_at)
    values (v_user,
            trim(v_ex ->> 'cle'),
            coalesce(nullif(trim(v_ex ->> 'nom'), ''), trim(v_ex ->> 'cle')),
            coalesce(nullif(v_ex ->> 'groupe', ''), 'Autre'),
            nullif(trim(coalesce(v_ex ->> 'alias', '')), ''),
            now())
    on conflict (user_id, nom_cle) do update
      set nom       = excluded.nom,
          groupe    = excluded.groupe,
          alias_cle = excluded.alias_cle,
          updated_at = now();
  end loop;

  return now();
end;
$$;

create or replace function public.tirer_exos_perso()
returns jsonb
language sql
security invoker
stable
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'cle',    p.nom_cle,
           'nom',    p.nom,
           'groupe', p.groupe,
           'alias',  p.alias_cle
         ) order by p.nom_cle), '[]'::jsonb)
  from public.exercices_perso p
  where p.user_id = auth.uid();
$$;

revoke execute on function public.pousser_exos_perso(jsonb) from anon, public;
revoke execute on function public.tirer_exos_perso()        from anon, public;
grant  execute on function public.pousser_exos_perso(jsonb) to authenticated;
grant  execute on function public.tirer_exos_perso()        to authenticated;

revoke execute on function public.pousser_titre(date, text) from anon, public;
grant  execute on function public.pousser_titre(date, text) to authenticated;

revoke execute on function public.pousser_jour(date, jsonb) from anon, public;
revoke execute on function public.tirer_jours(timestamptz)  from anon, public;
grant  execute on function public.pousser_jour(date, jsonb) to authenticated;
grant  execute on function public.tirer_jours(timestamptz)  to authenticated;
grant  execute on function public.maintenant()              to authenticated;


-- ============================================================================
-- 7. PROFILS
-- ============================================================================
-- Le pseudo vivait dans auth.users.raw_user_meta_data. Ce schéma n'est pas
-- exposé par PostgREST : personne, pas même son propriétaire, ne peut le lire
-- depuis le navigateur autrement qu'en décodant son propre jeton. Tant que
-- chacun était seul dans son carnet ça n'avait aucune importance ; à partir du
-- moment où l'app doit écrire « ton coach : Marc », ou lister les inscrits,
-- il faut une table interrogeable.
--
-- C'est la seule table du projet qu'un autre utilisateur pourra lire, et
-- uniquement un administrateur. Elle ne contient donc rien de sensible : pas
-- d'email, pas de date de naissance, pas de mesure. Un pseudo, un rôle, deux
-- dates.
create table if not exists public.profils (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  pseudo   text,
  -- 'membre' ou 'admin'. Le rôle de coach viendra plus tard et sera un
  -- attribut séparé : on peut être coach ET coaché, les deux ne s'excluent
  -- pas, alors qu'administrateur est un statut à part.
  role     text not null default 'membre',
  cree_le  timestamptz not null default now(),
  vu_le    timestamptz not null default now()
);

alter table public.profils drop constraint if exists profils_role_connu;
alter table public.profils add  constraint profils_role_connu
  check (role in ('membre', 'admin'));

-- Un pseudo doit désigner une personne et une seule, sinon « X est mon coach »
-- n'a pas de sens. Insensible à la casse, et seulement quand il est renseigné :
-- un compte sans pseudo reste parfaitement valide.
create unique index if not exists profils_pseudo_unique
  on public.profils (lower(pseudo)) where pseudo is not null;

create index if not exists profils_vu_idx on public.profils (vu_le desc);

alter table public.profils enable row level security;

-- Chacun lit sa propre ligne, et c'est tout ce qu'il peut faire dessus.
--
-- Il n'y a volontairement PAS de policy UPDATE. RLS filtre des lignes, pas des
-- colonnes : « chacun modifie son profil » autoriserait aussi
-- « update profils set role = 'admin' where user_id = auth.uid() ». La ligne
-- appartient bien à l'appelant, la policy passerait, et n'importe qui
-- deviendrait administrateur depuis la console du navigateur.
--
-- La ligne naît, se met à jour et se date dans toucher_profil(), qui est
-- SECURITY DEFINER et n'écrit que les colonnes qu'elle a le droit d'écrire.
-- Le jour où changer de pseudo devient une fonctionnalité, ce sera une
-- fonction de plus, pas un droit d'écriture de plus.
drop policy if exists "Chacun voit son profil" on public.profils;
create policy "Chacun voit son profil"
  on public.profils for select using (auth.uid() = user_id);

drop policy if exists "Chacun modifie son profil" on public.profils;

revoke all   on public.profils from anon;
revoke all   on public.profils from authenticated;
grant  select on public.profils to authenticated;


-- ---------------------------------------------------------------- est_admin
-- SECURITY DEFINER, et ce n'est pas un raccourci : une policy sur profils qui
-- irait elle-même lire profils pour savoir si l'appelant est admin déclenche
-- une récursion infinie, que Postgres refuse. La fonction s'exécute avec les
-- droits de son propriétaire, donc hors RLS, et coupe la boucle.
--
-- Elle ne prend aucun paramètre : impossible de lui demander « est-ce que
-- QUELQU'UN D'AUTRE est admin ». Elle ne répond que sur l'appelant.
create or replace function public.est_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profils
    where user_id = auth.uid() and role = 'admin'
  );
$$;

revoke execute on function public.est_admin() from anon, public;
grant  execute on function public.est_admin() to authenticated;


-- ------------------------------------------------------------ toucher_profil
-- Appelée à chaque ouverture de l'app par un utilisateur connecté. Elle fait
-- trois choses et rien d'autre : créer la ligne si elle manque, poser le
-- pseudo s'il n'y en a pas encore, et dater la visite.
--
-- SECURITY DEFINER pour une seule raison : lire auth.users.created_at, afin
-- que la date d'inscription affichée soit la vraie et non celle de la première
-- ouverture après cette migration. Elle n'écrit jamais ailleurs que sur
-- auth.uid() — l'identité ne vient pas d'un paramètre, elle vient du jeton.
create or replace function public.toucher_profil(p_pseudo text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user   uuid := auth.uid();
  v_veut   text := nullif(trim(coalesce(p_pseudo, '')), '');
  v_ligne  public.profils;
begin
  if v_user is null then
    raise exception 'Aucune session : connexion requise.';
  end if;

  -- Un pseudo de 200 caractères casserait chaque écran qui l'affiche.
  if v_veut is not null then
    v_veut := left(v_veut, 24);
  end if;

  insert into public.profils (user_id, pseudo, cree_le, vu_le)
  select v_user,
         null,                                   -- posé plus bas, si libre
         coalesce(u.created_at, now()),
         now()
  from auth.users u where u.id = v_user
  on conflict (user_id) do update set vu_le = now();

  -- Le pseudo continue de vivre dans les métadonnées du compte, comme depuis
  -- le premier jour. Cette colonne n'en est qu'un miroir interrogeable : on ne
  -- crée pas une deuxième source de vérité pour 24 caractères. L'app envoie à
  -- chaque ouverture le pseudo qu'elle a dans le jeton, et la colonne suit.
  update public.profils
     set pseudo = case
       -- Pseudo retiré côté compte : la colonne se vide aussi.
       when v_veut is null then null
       -- Deux personnes ont pu choisir le même pseudo du temps où il n'était
       -- qu'une étiquette dans le jeton. Le premier arrivé le garde, le second
       -- reste sur le sien plutôt que de voir sa connexion échouer.
       when exists (
         select 1 from public.profils p
         where lower(p.pseudo) = lower(v_veut) and p.user_id <> v_user
       ) then pseudo
       else v_veut
     end
   where user_id = v_user;

  select * into v_ligne from public.profils where user_id = v_user;

  return jsonb_build_object(
    'pseudo',  v_ligne.pseudo,
    'role',    v_ligne.role,
    'cree_le', v_ligne.cree_le
  );
end;
$$;

revoke execute on function public.toucher_profil(text) from anon, public;
grant  execute on function public.toucher_profil(text) to authenticated;


-- ============================================================================
-- 8. RETOURS
-- ============================================================================
-- « Retour », pas « ticket » : le mot dit ce que c'est sans promettre un
-- service client. Trois natures, parce qu'un bug et une idée ne se traitent
-- pas pareil, et que trois est le nombre au-delà duquel personne ne choisit.
create table if not exists public.retours (
  id       uuid primary key default gen_random_uuid(),
  -- « set null » et pas « cascade » : quelqu'un qui supprime son compte a le
  -- droit de disparaître, pas celui d'effacer un bug qu'il a signalé. La ligne
  -- reste, anonyme.
  user_id  uuid references auth.users (id) on delete set null,
  type     text not null default 'idee',
  corps    text not null,
  -- Version de l'app et vue d'où part le retour. Diagnostic, jamais de
  -- décision : ça vient du client, donc ce n'est pas digne de confiance.
  contexte jsonb not null default '{}'::jsonb,
  statut   text not null default 'nouveau',
  cree_le  timestamptz not null default now()
);

alter table public.retours drop constraint if exists retours_type_connu;
alter table public.retours add  constraint retours_type_connu
  check (type in ('bug', 'idee', 'question'));

alter table public.retours drop constraint if exists retours_statut_connu;
alter table public.retours add  constraint retours_statut_connu
  check (statut in ('nouveau', 'vu', 'traite'));

-- Un corps vide n'est pas un retour, et un corps de dix mégaoctets est une
-- attaque. La base tranche, pas le formulaire : on ne défend pas une table
-- avec du JavaScript.
alter table public.retours drop constraint if exists retours_corps_borne;
alter table public.retours add  constraint retours_corps_borne
  check (char_length(corps) between 1 and 4000);

alter table public.retours drop constraint if exists retours_contexte_borne;
alter table public.retours add  constraint retours_contexte_borne
  check (char_length(contexte::text) <= 1000);

create index if not exists retours_tri_idx on public.retours (statut, cree_le desc);

alter table public.retours enable row level security;

-- On envoie sous son propre nom, on relit ce qu'on a envoyé, on ne modifie ni
-- n'efface rien. Le statut est bougé par les fonctions d'administration, qui
-- passent au-dessus de RLS et vérifient le rôle elles-mêmes.
drop policy if exists "Chacun envoie ses retours" on public.retours;
create policy "Chacun envoie ses retours"
  on public.retours for insert with check (auth.uid() = user_id);

drop policy if exists "Chacun relit ses retours" on public.retours;
create policy "Chacun relit ses retours"
  on public.retours for select using (auth.uid() = user_id);

revoke all   on public.retours from anon;
revoke all   on public.retours from authenticated;
grant  select, insert on public.retours to authenticated;


-- ============================================================================
-- 9. ADMINISTRATION
-- ============================================================================
-- Ces quatre fonctions sont le seul endroit du schéma où quelqu'un lit une
-- ligne qui n'est pas la sienne. Elles sont donc toutes bâties pareil :
-- SECURITY DEFINER pour passer RLS, et un refus explicite en première
-- instruction si l'appelant n'est pas administrateur. Le contrôle est dans la
-- fonction, jamais dans l'interface — un bouton caché n'a jamais protégé
-- personne.
--
-- Aucune ne renvoie d'email, ni la moindre ligne de carnet. Un administrateur
-- voit qui s'inscrit et combien de séances sont loguées ; il ne voit pas ce
-- qu'il y a dedans. Ce n'est pas une limite technique, c'est le principe.

-- ------------------------------------------------------------- admin_apercu
create or replace function public.admin_apercu()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare v jsonb;
begin
  if not public.est_admin() then
    raise exception 'Reserve a l administrateur.';
  end if;

  select jsonb_build_object(
    'inscrits',        (select count(*) from public.profils),
    'inscrits_7j',     (select count(*) from public.profils where cree_le > now() - interval '7 days'),
    'actifs_7j',       (select count(*) from public.profils where vu_le  > now() - interval '7 days'),
    'actifs_30j',      (select count(*) from public.profils where vu_le  > now() - interval '30 days'),
    'seances',         (select count(*) from public.seances),
    'seances_7j',      (select count(*) from public.seances where updated_at > now() - interval '7 days'),
    'series',          (select count(*) from public.series),
    'retours_nouveaux',(select count(*) from public.retours where statut = 'nouveau')
  ) into v;

  return v;
end;
$$;

-- ------------------------------------------------------------ admin_membres
-- Une ligne par inscrit, triée par visite la plus récente. Le nombre de
-- séances est compté ici et non côté client : le client n'a pas le droit de
-- lire ces séances, et il ne l'aura pas.
create or replace function public.admin_membres(p_limite int default 200)
returns table (
  user_id       uuid,
  pseudo        text,
  role          text,
  cree_le       timestamptz,
  vu_le         timestamptz,
  nb_seances    bigint,
  derniere_seance date
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.est_admin() then
    raise exception 'Reserve a l administrateur.';
  end if;

  return query
    select p.user_id, p.pseudo, p.role, p.cree_le, p.vu_le,
           coalesce(s.n, 0)   as nb_seances,
           s.derniere         as derniere_seance
    from public.profils p
    left join (
      select se.user_id, count(*) n, max(se.date) derniere
      from public.seances se group by se.user_id
    ) s on s.user_id = p.user_id
    order by p.vu_le desc
    limit greatest(1, least(coalesce(p_limite, 200), 1000));
end;
$$;

-- ------------------------------------------------------------ admin_retours
create or replace function public.admin_retours(p_statut text default null)
returns table (
  id      uuid,
  pseudo  text,
  type    text,
  corps   text,
  contexte jsonb,
  statut  text,
  cree_le timestamptz
)
language plpgsql
security definer
stable
set search_path = public
as $$
begin
  if not public.est_admin() then
    raise exception 'Reserve a l administrateur.';
  end if;

  return query
    select r.id, p.pseudo, r.type, r.corps, r.contexte, r.statut, r.cree_le
    from public.retours r
    left join public.profils p on p.user_id = r.user_id
    where p_statut is null or r.statut = p_statut
    order by r.cree_le desc
    limit 500;
end;
$$;

-- --------------------------------------------------- admin_marquer_retour
create or replace function public.admin_marquer_retour(p_id uuid, p_statut text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.est_admin() then
    raise exception 'Reserve a l administrateur.';
  end if;
  if p_statut not in ('nouveau', 'vu', 'traite') then
    raise exception 'Statut inconnu : %', p_statut;
  end if;

  update public.retours set statut = p_statut where id = p_id;
end;
$$;

revoke execute on function public.admin_apercu()                 from anon, public;
revoke execute on function public.admin_membres(int)             from anon, public;
revoke execute on function public.admin_retours(text)            from anon, public;
revoke execute on function public.admin_marquer_retour(uuid,text) from anon, public;
grant  execute on function public.admin_apercu()                 to authenticated;
grant  execute on function public.admin_membres(int)             to authenticated;
grant  execute on function public.admin_retours(text)            to authenticated;
grant  execute on function public.admin_marquer_retour(uuid,text) to authenticated;

-- Se nommer administrateur ne se fait pas depuis l'app : il n'existe aucune
-- fonction pour ça, volontairement. Ça se fait une fois, à la main, dans
-- Supabase → SQL Editor, après avoir ouvert l'app au moins une fois pour que
-- la ligne existe :
--
--   update public.profils set role = 'admin'
--   where user_id = (select id from auth.users where email = 'ton@email.fr');

-- ============================================================================
-- 10. SUPPRESSION DE COMPTE (RGPD — droit à l'effacement)
-- ============================================================================
-- Tout est en « on delete cascade » depuis auth.users : supprimer le compte
-- efface séances, exercices, séries, exercices mémorisés et consentements.
-- La suppression du compte lui-même se fait depuis le dashboard Supabase
-- (Authentication → Users), faute de serveur pour porter la clé service_role.
