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
-- Les sections 7 à 9 ajoutent un profil public réduit (pseudo, rôle, dates),
-- des retours utilisateurs, et quatre fonctions d'administration. Aucune ne lit
-- une ligne de carnet : un administrateur voit des compteurs, jamais un contenu.
--
-- La section 10 ouvre la seule porte du mur : un coach lit le carnet de son
-- coaché. En lecture seule, après accord des deux parties, avec consentement
-- daté, révocable des deux côtés et à effet immédiat. C'est la partie du
-- schéma à relire en premier quand on doute de quelque chose.
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
returns uuid language sql immutable
set search_path = public
as $$
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
returns timestamptz language sql stable
set search_path = public
as $$ select now(); $$;

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

-- est_admin() a d'abord ete retiree de « authenticated » : le front ne
-- l'appelait pas, et une fonction qu'on ne peut pas appeler est une surface
-- d'attaque en moins. La messagerie de la section 11 change la donne — ses
-- policies l'appellent, et une policy s'evalue avec les droits de celui qui
-- interroge. Sans EXECUTE, un membre ne peut plus ni lire ni ecrire dans son
-- propre fil.
--
-- C'est la meme regle que pour coach_de() : une fonction utilisee DANS une
-- policy doit etre executable par le role qui declenche la policy. Le linter
-- Supabase la signalera de nouveau, et c'est desormais justifie : elle ne
-- prend aucun parametre, et ne repond que sur l'appelant.
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
    'cree_le', v_ligne.cree_le,
    -- Le statut de coach part avec le profil : l'app le sait des l'ouverture
    -- et n'a pas a le redemander pour decider quoi afficher.
    'est_coach',  coalesce(v_ligne.est_coach, false),
    'code_coach', v_ligne.code_coach
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
    'retours_nouveaux',(select count(*) from public.retours where statut = 'nouveau'),
    'messages_nouveaux',(select count(*) from public.messages_support where auteur = 'membre' and not lu),
    'notifs_nouvelles', (select count(*) from public.notifications_admin where not lu)
  ) into v;

  return v;
end;
$$;

-- ------------------------------------------------------------ admin_membres
-- Une ligne par inscrit, triée par visite la plus récente. Le nombre de
-- séances est compté ici et non côté client : le client n'a pas le droit de
-- lire ces séances, et il ne l'aura pas.
--
-- DROP avant CREATE, pour cette fonction et les quatre autres qui renvoient un
-- tableau : Postgres refuse de « remplacer » une fonction dont les colonnes de
-- retour ont changé (« cannot change return type of existing function »). Dans
-- l'éditeur SQL de Supabase, cette seule erreur annule TOUT le script — c'est
-- arrivé une fois, quand admin_retours a gagné user_id : rien n'était passé,
-- et rien ne le disait. Supprimer puis recréer est sans risque ici : aucune
-- policy ni aucune vue ne dépend de ces fonctions, et leurs droits sont
-- reposés juste en dessous. test-montee.mjs rejoue la montée depuis chaque
-- version du schéma pour que ça ne se reproduise pas.
drop function if exists public.admin_membres(int);
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
drop function if exists public.admin_retours(text);
create or replace function public.admin_retours(p_statut text default null)
returns table (
  id      uuid,
  user_id uuid,
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
    select r.id, r.user_id, p.pseudo, r.type, r.corps, r.contexte, r.statut, r.cree_le
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

-- Ces quatre-la restent appelables par « authenticated », et le linter
-- Supabase le signalera : c'est assume. Elles doivent etre dans « public »
-- pour etre atteignables depuis l'app, et leur premiere instruction refuse
-- quiconque n'est pas administrateur. Le controle est dans la fonction, pas
-- dans l'exposition — c'est la seule barriere qui tienne.
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
-- 10. LE LIEN COACH ↔ COACHÉ
-- ============================================================================
-- C'est le seul endroit du schéma où quelqu'un lit le carnet d'un autre. Tout
-- y est donc écrit pour qu'un oubli ne soit pas silencieux :
--
--   · le lien n'existe que si les DEUX parties ont agi — le coaché saisit un
--     code, le coach accepte. Un pseudo tapé à la main suffirait à donner son
--     carnet à un inconnu sur une faute de frappe ; un code est faux ou juste,
--     jamais « presque » ;
--   · l'accès est en LECTURE SEULE. Les policies ajoutées ici sont des policies
--     SELECT, et rien d'autre. Un coach ne peut ni modifier ni effacer une
--     séance — écrire une séance programmée viendra plus tard, par une
--     fonction dédiée, pas en élargissant ces droits ;
--   · un seul coach actif par personne, garanti par un index unique et non par
--     une règle applicative qu'on pourrait oublier ;
--   · révocable des deux côtés, avec effet immédiat : la policy consulte le
--     statut à chaque requête, il n'y a rien à invalider ;
--   · le consentement du coaché est daté et versionné au moment où il demande.
--
-- Ce que le coach ne voit JAMAIS, et il n'existe aucune fonction pour :
-- l'email de son coaché, ses consentements, ses retours, son mot de passe.

alter table public.profils add column if not exists est_coach boolean not null default false;
alter table public.profils add column if not exists code_coach text;

-- Le code est la clé d'entrée : il doit désigner un coach et un seul.
create unique index if not exists profils_code_coach_unique
  on public.profils (code_coach) where code_coach is not null;


create table if not exists public.liens_coach (
  id         uuid primary key default gen_random_uuid(),
  coach_id   uuid not null references auth.users (id) on delete cascade,
  client_id  uuid not null references auth.users (id) on delete cascade,
  statut     text not null default 'en_attente',
  demande_le timestamptz not null default now(),
  accepte_le timestamptz,
  fini_le    timestamptz,
  -- Se coacher soi-même n'a pas de sens, et contournerait la logique des deux
  -- parties : la base refuse plutôt que l'app.
  constraint liens_pas_soi_meme check (coach_id <> client_id)
);

alter table public.liens_coach drop constraint if exists liens_statut_connu;
alter table public.liens_coach add  constraint liens_statut_connu
  check (statut in ('en_attente', 'actif', 'refuse', 'revoque'));

-- Un seul coach actif à la fois, et une seule demande en attente vers un même
-- coach. L'index partiel dit la règle une fois pour toutes ; aucun chemin
-- applicatif ne peut la contourner.
create unique index if not exists liens_un_seul_coach_actif
  on public.liens_coach (client_id) where statut = 'actif';
create unique index if not exists liens_une_seule_demande
  on public.liens_coach (client_id, coach_id) where statut = 'en_attente';

create index if not exists liens_coach_idx  on public.liens_coach (coach_id, statut);
create index if not exists liens_client_idx on public.liens_coach (client_id, statut);

alter table public.liens_coach enable row level security;


-- ------------------------------------------------------------- les verdicts
-- SECURITY DEFINER pour la même raison que est_admin() : une policy sur
-- liens_coach qui irait lire liens_coach déclenche une récursion que Postgres
-- refuse. Aucune des deux ne prend de paramètre permettant d'interroger la
-- relation de quelqu'un d'autre — elles ne répondent que sur l'appelant.
create or replace function public.coach_de(p_client uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.liens_coach
    where client_id = p_client and coach_id = auth.uid() and statut = 'actif'
  );
$$;

create or replace function public.mon_coach_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select coach_id from public.liens_coach
  where client_id = auth.uid() and statut = 'actif'
  limit 1;
$$;

-- Contrairement a est_admin(), ces deux-la sont appelees DEPUIS LES POLICIES.
-- Une policy s'evalue avec les droits de celui qui interroge : sans EXECUTE
-- pour « authenticated », toute lecture de seance echouerait par un
-- « permission denied for function coach_de » — y compris la lecture de son
-- propre carnet. Les exposer ne revele rien : coach_de(x) repond « suis-je le
-- coach de x », ce que l'appelant peut de toute facon deduire en essayant de
-- lire, et mon_coach_id() ne parle que de l'appelant.
revoke execute on function public.coach_de(uuid)  from anon, public;
revoke execute on function public.mon_coach_id()  from anon, public;
grant  execute on function public.coach_de(uuid)  to authenticated;
grant  execute on function public.mon_coach_id()  to authenticated;


-- ------------------------------------------------------------- les policies
-- Chacun voit les liens qui le concernent, des deux côtés : le coaché doit
-- pouvoir constater qui a accès à son carnet, et le coach voir ses demandes.
-- Personne n'écrit dans cette table à la main — tout passe par les fonctions
-- plus bas, qui vérifient de quel côté du lien se trouve l'appelant.
drop policy if exists "Chacun voit ses liens" on public.liens_coach;
create policy "Chacun voit ses liens"
  on public.liens_coach for select
  using (auth.uid() = client_id or auth.uid() = coach_id);

revoke all   on public.liens_coach from anon;
revoke all   on public.liens_coach from authenticated;
grant  select on public.liens_coach to authenticated;

-- L'ouverture du mur, et elle tient en quatre policies SELECT. Elles s'ajoutent
-- aux policies « Chacun gere ses … » de la section 4 sans les toucher : deux
-- policies permissives se cumulent, donc le propriétaire garde tous ses droits
-- et le coach n'obtient que la lecture.
drop policy if exists "Le coach lit les seances de son coache" on public.seances;
create policy "Le coach lit les seances de son coache"
  on public.seances for select using (public.coach_de(user_id));

drop policy if exists "Le coach lit les exercices de son coache" on public.exercices;
create policy "Le coach lit les exercices de son coache"
  on public.exercices for select using (public.coach_de(user_id));

drop policy if exists "Le coach lit les series de son coache" on public.series;
create policy "Le coach lit les series de son coache"
  on public.series for select using (public.coach_de(user_id));

drop policy if exists "Le coach lit les exercices memorises de son coache" on public.exercices_perso;
create policy "Le coach lit les exercices memorises de son coache"
  on public.exercices_perso for select using (public.coach_de(user_id));

-- Chacun doit pouvoir nommer l'autre : le coaché voit le pseudo de son coach,
-- le coach voit ceux de ses coachés. Rien de plus que le profil réduit, qui ne
-- contient ni email ni donnée de carnet.
drop policy if exists "Le coach voit le profil de son coache" on public.profils;
create policy "Le coach voit le profil de son coache"
  on public.profils for select using (public.coach_de(user_id));

drop policy if exists "Chacun voit le profil de son coach" on public.profils;
create policy "Chacun voit le profil de son coach"
  on public.profils for select using (user_id = public.mon_coach_id());


-- ---------------------------------------------------------- devenir coach
-- Être coach est une capacité qui s'ajoute, pas un type de compte : un coach a
-- son propre carnet comme tout le monde, et peut lui-même être coaché.
create or replace function public.devenir_coach()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_code text;
  v_essais int := 0;
begin
  if v_user is null then raise exception 'Aucune session : connexion requise.'; end if;

  select code_coach into v_code from public.profils where user_id = v_user;
  if v_code is not null then
    update public.profils set est_coach = true where user_id = v_user;
    return v_code;
  end if;

  -- Alphabet sans O/0 ni I/1 : ce code se lit à voix haute et se recopie à la
  -- main, c'est là qu'on perd les gens.
  loop
    v_essais := v_essais + 1;
    v_code := (
      select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
                               (floor(random() * 32) + 1)::int, 1), '')
      from generate_series(1, 8)
    );
    exit when not exists (select 1 from public.profils where code_coach = v_code);
    if v_essais > 20 then raise exception 'Impossible de generer un code.'; end if;
  end loop;

  update public.profils set est_coach = true, code_coach = v_code where user_id = v_user;
  return v_code;
end;
$$;

-- Cesser d'être coach ne supprime pas l'historique : les liens actifs passent
-- en « revoque », datés. Un coaché doit pouvoir constater après coup que
-- l'accès a bien été coupé, et quand.
create or replace function public.cesser_coach()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_user uuid := auth.uid();
begin
  if v_user is null then raise exception 'Aucune session : connexion requise.'; end if;
  update public.liens_coach
     set statut = 'revoque', fini_le = now()
   where coach_id = v_user and statut in ('actif', 'en_attente');
  update public.profils set est_coach = false, code_coach = null where user_id = v_user;
end;
$$;


-- --------------------------------------------------------- demander un coach
-- C'est le coaché qui saisit le code : il est la personne dont les données
-- seront exposées, c'est donc à lui d'engager. Le coach devra accepter — sans
-- quoi n'importe qui pourrait s'inventer des clients.
create or replace function public.demander_coach(p_code text, p_version_politique text default '1')
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_coach uuid;
  v_lien  uuid;
begin
  if v_user is null then raise exception 'Aucune session : connexion requise.'; end if;

  select user_id into v_coach
  from public.profils
  where code_coach = upper(trim(coalesce(p_code, ''))) and est_coach;

  if v_coach is null then raise exception 'Code inconnu.'; end if;
  if v_coach = v_user then raise exception 'Ce code est le tien.'; end if;

  if exists (select 1 from public.liens_coach where client_id = v_user and statut = 'actif') then
    raise exception 'Tu as deja un coach. Coupe le lien actuel avant d en demander un autre.';
  end if;

  -- Une demande déjà en attente vers ce coach : on ne la duplique pas.
  select id into v_lien from public.liens_coach
   where client_id = v_user and coach_id = v_coach and statut = 'en_attente';

  if v_lien is null then
    insert into public.liens_coach (coach_id, client_id)
    values (v_coach, v_user) returning id into v_lien;
  end if;

  -- La trace du consentement se pose ici, au moment où la personne agit, et
  -- pas au moment où l'accès s'ouvre : c'est cet instant-là qu'il faut pouvoir
  -- prouver.
  insert into public.consentements (user_id, type, version_politique)
  values (v_user, 'coaching', coalesce(nullif(trim(p_version_politique), ''), '1'));

  return jsonb_build_object(
    'lien', v_lien,
    'coach', (select pseudo from public.profils where user_id = v_coach)
  );
end;
$$;

-- Le coach répond. Accepter ouvre l'accès ; refuser le ferme sans le supprimer,
-- pour que le coaché voie qu'il a été traité.
create or replace function public.repondre_demande(p_lien uuid, p_accepte boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ok   boolean;
begin
  if v_user is null then raise exception 'Aucune session : connexion requise.'; end if;

  select true into v_ok from public.liens_coach
   where id = p_lien and coach_id = v_user and statut = 'en_attente';
  if v_ok is null then raise exception 'Demande introuvable.'; end if;

  if p_accepte then
    update public.liens_coach
       set statut = 'actif', accepte_le = now()
     where id = p_lien;
  else
    update public.liens_coach
       set statut = 'refuse', fini_le = now()
     where id = p_lien;
  end if;
end;
$$;

-- Révocable des deux côtés, et sans délai : la policy relit le statut à chaque
-- requête, donc l'accès tombe dans la même transaction. Il n'y a pas de jeton
-- à faire expirer ni de cache à vider.
create or replace function public.revoquer_lien(p_lien uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_ok   boolean;
begin
  if v_user is null then raise exception 'Aucune session : connexion requise.'; end if;

  select true into v_ok from public.liens_coach
   where id = p_lien and (client_id = v_user or coach_id = v_user)
     and statut in ('actif', 'en_attente');
  if v_ok is null then raise exception 'Lien introuvable.'; end if;

  update public.liens_coach set statut = 'revoque', fini_le = now() where id = p_lien;
end;
$$;


-- --------------------------------------------------------- lire côté coach
-- SECURITY INVOKER, et c'est le point important : la fonction ne vérifie
-- aucun droit elle-même. Elle demande les séances de p_client, et RLS répond.
-- Sans lien actif, le résultat est vide — pas parce qu'un « if » l'a décidé,
-- mais parce que la base n'a rien à montrer. Il n'y a donc aucun contrôle à
-- oublier ici.
create or replace function public.tirer_jours_de(p_client uuid, p_depuis timestamptz default null)
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
    where s.user_id = p_client
      and (p_depuis is null or s.updated_at > p_depuis)
  ) d;
$$;

-- La liste des coachés d'un coach, avec de quoi juger l'assiduité sans ouvrir
-- le carnet. Comme au-dessus : aucun contrôle de droit ici, RLS filtre.
drop function if exists public.mes_coaches();
create or replace function public.mes_coaches()
returns table (
  lien_id     uuid,
  client_id   uuid,
  pseudo      text,
  statut      text,
  demande_le  timestamptz,
  accepte_le  timestamptz,
  nb_seances  bigint,
  derniere    date
)
language sql
security invoker
stable
set search_path = public
as $$
  select l.id, l.client_id, p.pseudo, l.statut, l.demande_le, l.accepte_le,
         coalesce(s.n, 0), s.derniere
  from public.liens_coach l
  left join public.profils p on p.user_id = l.client_id
  left join (
    select se.user_id, count(*) n, max(se.date) derniere
    from public.seances se group by se.user_id
  ) s on s.user_id = l.client_id
  where l.coach_id = auth.uid() and l.statut in ('en_attente', 'actif')
  order by l.statut, l.demande_le desc;
$$;

-- Le coach du coaché, s'il en a un. Le lien en attente compte : il faut voir
-- qu'une demande est partie, sinon on la refait.
drop function if exists public.mon_coach();
create or replace function public.mon_coach()
returns table (
  lien_id    uuid,
  coach_id   uuid,
  pseudo     text,
  statut     text,
  demande_le timestamptz,
  accepte_le timestamptz
)
language sql
security invoker
stable
set search_path = public
as $$
  select l.id, l.coach_id, p.pseudo, l.statut, l.demande_le, l.accepte_le
  from public.liens_coach l
  left join public.profils p on p.user_id = l.coach_id
  where l.client_id = auth.uid() and l.statut in ('en_attente', 'actif')
  order by l.demande_le desc
  limit 1;
$$;

revoke execute on function public.devenir_coach()                    from anon, public;
revoke execute on function public.cesser_coach()                     from anon, public;
revoke execute on function public.demander_coach(text, text)         from anon, public;
revoke execute on function public.repondre_demande(uuid, boolean)    from anon, public;
revoke execute on function public.revoquer_lien(uuid)                from anon, public;
revoke execute on function public.tirer_jours_de(uuid, timestamptz)  from anon, public;
revoke execute on function public.mes_coaches()                      from anon, public;
revoke execute on function public.mon_coach()                        from anon, public;
grant  execute on function public.devenir_coach()                    to authenticated;
grant  execute on function public.cesser_coach()                     to authenticated;
grant  execute on function public.demander_coach(text, text)         to authenticated;
grant  execute on function public.repondre_demande(uuid, boolean)    to authenticated;
grant  execute on function public.revoquer_lien(uuid)                to authenticated;
grant  execute on function public.tirer_jours_de(uuid, timestamptz)  to authenticated;
grant  execute on function public.mes_coaches()                      to authenticated;
grant  execute on function public.mon_coach()                        to authenticated;

-- ============================================================================
-- 11. MESSAGERIE ET NOTIFICATIONS
-- ============================================================================
-- Transposition d'un système écrit pour Next.js, où chaque écriture sensible
-- passait par une route serveur portant la clé service_role. Top Set n'a pas de
-- serveur, et ne doit pas en avoir un pour ça : tout ce que ces routes
-- faisaient — vérifier qui parle, refuser un contenu falsifié, écrire une
-- notification que personne d'autre ne peut écrire — se dit ici en policies et
-- en déclencheurs, donc en un seul endroit et sans clé à protéger.

create table if not exists public.messages_support (
  id      uuid primary key default gen_random_uuid(),
  -- Le fil appartient au membre, des deux côtés : un message écrit par
  -- l'administrateur porte quand même le user_id du membre. Sans ça il n'y
  -- aurait pas de conversation, juste deux listes.
  user_id uuid not null references auth.users (id) on delete cascade,
  auteur  text not null,
  corps   text not null,
  lu      boolean not null default false,
  cree_le timestamptz not null default now()
);

alter table public.messages_support drop constraint if exists messages_auteur_connu;
alter table public.messages_support add  constraint messages_auteur_connu
  check (auteur in ('membre', 'admin', 'systeme'));

alter table public.messages_support drop constraint if exists messages_corps_borne;
alter table public.messages_support add  constraint messages_corps_borne
  check (char_length(corps) between 1 and 4000);

-- Un message peut venir d'un retour : le formulaire le recopie dans le fil,
-- pour que la conversation commence par ce que la personne a demandé et non
-- par un accusé de réception qui ne répond à rien. « set null » : effacer un
-- retour ne doit pas trouer la conversation.
alter table public.messages_support
  add column if not exists retour_id uuid references public.retours (id) on delete set null;

create index if not exists messages_fil_idx on public.messages_support (user_id, cree_le);
create index if not exists messages_non_lus_idx on public.messages_support (user_id, auteur) where not lu;

alter table public.messages_support enable row level security;

drop policy if exists "Chacun lit son fil" on public.messages_support;
create policy "Chacun lit son fil"
  on public.messages_support for select
  using (auth.uid() = user_id or public.est_admin());

-- Le point qui compte : la policy vérifie que « auteur » correspond au rôle
-- réel de celui qui écrit. Un membre ne peut pas insérer un message signé
-- « admin », même en fabriquant la requête à la main — ce n'est pas le
-- formulaire qui l'empêche, c'est la base.
drop policy if exists "Chacun ecrit dans son fil" on public.messages_support;
create policy "Chacun ecrit dans son fil"
  on public.messages_support for insert
  with check (
    (auth.uid() = user_id and auteur = 'membre')
    or (public.est_admin() and auteur = 'admin')
  );

drop policy if exists "Marquer les messages comme lus" on public.messages_support;
create policy "Marquer les messages comme lus"
  on public.messages_support for update
  using (auth.uid() = user_id or public.est_admin())
  with check (auth.uid() = user_id or public.est_admin());

-- RLS filtre des lignes, pas des colonnes : sans droit restreint à « lu », la
-- policy ci-dessus laisserait réécrire le corps d'un message déjà envoyé. Le
-- droit de table dit la vraie règle — on ne marque que la lecture.
revoke all on public.messages_support from anon;
revoke all on public.messages_support from authenticated;
grant  select on public.messages_support to authenticated;
grant  insert (user_id, auteur, corps) on public.messages_support to authenticated;
grant  update (lu)   on public.messages_support to authenticated;


-- ============================================================================
-- Les notifications d'administration
-- ============================================================================
-- Écrites uniquement par des déclencheurs : il n'y a AUCUNE policy insert, donc
-- personne ne peut en fabriquer une depuis le navigateur. C'est ce que faisait
-- la clé service_role côté serveur dans le système d'origine, en moins de code
-- et sans secret à garder.
create table if not exists public.notifications_admin (
  id      uuid primary key default gen_random_uuid(),
  type    text not null,
  -- « cascade » : voir la section 13. Le contenu porte le pseudo ou le début
  -- d'un message ; une notification orpheline restait donc identifiable.
  user_id uuid references auth.users (id) on delete cascade,
  contenu text,
  lu      boolean not null default false,
  cree_le timestamptz not null default now()
);

alter table public.notifications_admin drop constraint if exists notif_type_connu;
alter table public.notifications_admin add  constraint notif_type_connu
  check (type in ('inscription', 'message', 'retour', 'coach'));

create index if not exists notif_tri_idx on public.notifications_admin (lu, cree_le desc);

alter table public.notifications_admin enable row level security;

drop policy if exists "Un admin lit les notifications" on public.notifications_admin;
create policy "Un admin lit les notifications"
  on public.notifications_admin for select using (public.est_admin());

drop policy if exists "Un admin marque comme lues" on public.notifications_admin;
create policy "Un admin marque comme lues"
  on public.notifications_admin for update
  using (public.est_admin()) with check (public.est_admin());

revoke all on public.notifications_admin from anon;
revoke all on public.notifications_admin from authenticated;
grant  select on public.notifications_admin to authenticated;
grant  update (lu) on public.notifications_admin to authenticated;


-- ---------------------------------------------------------- les déclencheurs
-- SECURITY DEFINER parce qu'ils écrivent dans une table où personne n'a le
-- droit d'insérer. Ils ne lisent aucun paramètre venu du client : ce qu'ils
-- inscrivent, ils le prennent dans la ligne qui vient d'être écrite — c'est la
-- version base de données de « relire la source plutôt que croire le corps de
-- la requête ».
create or replace function public.notifier_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_table_name = 'profils' then
    insert into public.notifications_admin (type, user_id, contenu)
    values ('inscription', new.user_id, coalesce(new.pseudo, 'sans pseudo'));

  elsif tg_table_name = 'messages_support' then
    -- Un message de l'administrateur ne se notifie pas à lui-même. La copie
    -- d'un retour non plus : le retour a déjà sa propre notification, et un
    -- seul geste ne doit en produire qu'une.
    if new.auteur = 'membre' and new.retour_id is null then
      insert into public.notifications_admin (type, user_id, contenu)
      values ('message', new.user_id, left(new.corps, 200));
    end if;

  elsif tg_table_name = 'retours' then
    insert into public.notifications_admin (type, user_id, contenu)
    values ('retour', new.user_id, new.type || ' · ' || left(new.corps, 180));

  elsif tg_table_name = 'liens_coach' then
    insert into public.notifications_admin (type, user_id, contenu)
    values ('coach', new.client_id, 'nouvelle demande de coaching');
  end if;

  return new;
end;
$$;

drop trigger if exists notif_inscription on public.profils;
create trigger notif_inscription after insert on public.profils
  for each row execute function public.notifier_admin();

drop trigger if exists notif_message on public.messages_support;
create trigger notif_message after insert on public.messages_support
  for each row execute function public.notifier_admin();

drop trigger if exists notif_retour on public.retours;
create trigger notif_retour after insert on public.retours
  for each row execute function public.notifier_admin();

drop trigger if exists notif_coach on public.liens_coach;
create trigger notif_coach after insert on public.liens_coach
  for each row execute function public.notifier_admin();


-- ------------------------------------------------------ lecture côté admin
-- Comme tirer_jours_de() : SECURITY INVOKER, aucun contrôle dans la fonction,
-- RLS répond. Un non-administrateur obtient une liste vide, pas une erreur —
-- et il ne peut rien en déduire.
drop function if exists public.admin_fils();
create or replace function public.admin_fils()
returns table (
  user_id     uuid,
  pseudo      text,
  dernier     text,
  dernier_le  timestamptz,
  non_lus     bigint,
  total       bigint
)
language sql
security invoker
stable
set search_path = public
as $$
  select m.user_id,
         p.pseudo,
         (select corps from public.messages_support x
           where x.user_id = m.user_id order by x.cree_le desc limit 1),
         max(m.cree_le),
         count(*) filter (where m.auteur = 'membre' and not m.lu),
         count(*)
  from public.messages_support m
  left join public.profils p on p.user_id = m.user_id
  group by m.user_id, p.pseudo
  order by max(m.cree_le) desc
  limit 200;
$$;

revoke execute on function public.admin_fils() from anon, public;
grant  execute on function public.admin_fils() to authenticated;


-- ============================================================================
-- Ce que ce projet ne peut PAS faire, et pourquoi c'est écrit ici
-- ============================================================================
-- Le système d'origine envoyait un email à l'administrateur à chaque nouveau
-- message, depuis une route serveur qui relisait le message en base avant de
-- composer l'email. Top Set est un site statique : il n'y a pas de route où
-- mettre ce code, et la clé service_role n'a rien à faire dans un navigateur.
--
-- Les notifications ci-dessus remplacent la partie utile — savoir qu'il s'est
-- passé quelque chose — sans email. Si l'email devient nécessaire, la voie
-- propre est une Edge Function Supabase déclenchée par un webhook sur
-- notifications_admin : le secret reste chez Supabase, le dépôt reste statique.
-- Ce n'est pas fait tant que personne ne l'a demandé.
--
-- De même, modifier ou supprimer le compte d'un autre utilisateur exige la clé
-- service_role. Ça se fait dans Supabase → Authentication → Users, et c'est
-- très bien ainsi : ces gestes-là méritent de sortir de l'app.

-- --------------------------------------------------- l'accusé de réception
-- Envoyer un retour dans le vide, c'est ne pas savoir s'il est parti. Ce
-- déclencheur recopie le retour dans le fil du membre — la conversation
-- commence par sa question — puis ajoute un accusé signé « systeme » :
-- personne n'a encore lu son retour, et le signer « admin » serait un mensonge
-- poli. La vraie réponse arrivera au même endroit.
--
-- SECURITY DEFINER parce qu'aucune policy n'autorise à écrire un message
-- « systeme » — c'est justement ce qui garantit qu'aucun navigateur ne peut en
-- fabriquer un.
create or replace function public.accuser_retour()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Deux lignes dans la même transaction partagent le même now() : sans
  -- horodatage explicite, l'accusé pourrait s'afficher avant la question.
  insert into public.messages_support (user_id, auteur, corps, retour_id, cree_le)
  values (new.user_id, 'membre', new.corps, new.id, new.cree_le);

  insert into public.messages_support (user_id, auteur, corps, retour_id, cree_le)
  values (new.user_id, 'systeme',
          'Bien reçu. On te répond ici même, dès que possible. '
          || 'Tu peux ajouter des détails dans cette conversation en attendant.',
          new.id, new.cree_le + interval '1 millisecond');
  return null;
end;
$$;

drop trigger if exists retours_accuse on public.retours;
create trigger retours_accuse
  after insert on public.retours
  for each row when (new.user_id is not null)
  execute function public.accuser_retour();

-- Les retours envoyés AVANT ce déclencheur n'ont jamais ouvert de
-- conversation : ils attendaient dans l'espace admin sans rien qui permette
-- d'y répondre. On les recopie une fois dans le fil de leur auteur, à leur date
-- d'origine. Pas d'accusé de réception : il arriverait des jours après la
-- question et dirait « bien reçu » à quelqu'un qui attend déjà une réponse.
--
-- Rejouable : un retour déjà recopié (par ce bloc ou par le déclencheur) porte
-- son retour_id dans le fil, et n'est pas recopié deux fois. Aucune
-- notification : notifier_admin() ignore les messages qui viennent d'un
-- retour. Un retour déjà lu ou traité arrive lu — il n'est pas nouveau.
insert into public.messages_support (user_id, auteur, corps, retour_id, cree_le, lu)
select r.user_id, 'membre', r.corps, r.id, r.cree_le, r.statut <> 'nouveau'
from public.retours r
where r.user_id is not null
  and not exists (
    select 1 from public.messages_support m where m.retour_id = r.id
  );


-- ============================================================================
-- 12. LA CONVERSATION COACH ↔ COACHÉ
-- ============================================================================
-- Même forme que la messagerie de support, autre paire. On ne réutilise pas
-- messages_support : là-bas le fil appartient à une personne, et l'autre partie
-- est « l'administration » — une seule et même personne pour tout le monde.
-- Ici il y a deux comptes, et la question « qui a le droit d'écrire » se répond
-- par le lien, pas par un rôle.

create table if not exists public.messages_coach (
  id        uuid primary key default gen_random_uuid(),
  coach_id  uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references auth.users (id) on delete cascade,
  auteur    text not null,
  corps     text not null,
  lu        boolean not null default false,
  cree_le   timestamptz not null default now()
);

alter table public.messages_coach drop constraint if exists mcoach_auteur_connu;
alter table public.messages_coach add  constraint mcoach_auteur_connu
  check (auteur in ('coach', 'client'));

alter table public.messages_coach drop constraint if exists mcoach_corps_borne;
alter table public.messages_coach add  constraint mcoach_corps_borne
  check (char_length(corps) between 1 and 4000);

alter table public.messages_coach drop constraint if exists mcoach_pas_soi_meme;
alter table public.messages_coach add  constraint mcoach_pas_soi_meme
  check (coach_id <> client_id);

create index if not exists mcoach_fil_idx
  on public.messages_coach (coach_id, client_id, cree_le);
create index if not exists mcoach_non_lus_idx
  on public.messages_coach (client_id, coach_id, auteur) where not lu;

alter table public.messages_coach enable row level security;

-- Le coaché garde son historique même après avoir coupé l'accès : c'est sa
-- conversation, et couper le suivi n'efface pas ce qui s'est dit. Le coach,
-- lui, ne lit que tant que le lien est actif — c'est exactement la règle du
-- carnet, et elle ne doit pas se relâcher ici.
drop policy if exists "Les deux lisent leur fil" on public.messages_coach;
create policy "Les deux lisent leur fil"
  on public.messages_coach for select
  using (auth.uid() = client_id or public.coach_de(client_id));

-- Écrire demande le lien ACTIF, et que l'auteur déclaré corresponde au rôle
-- réel. Un coaché ne peut pas signer « coach », un coach ne peut pas écrire
-- dans le fil de quelqu'un qu'il ne suit pas, et personne ne peut fabriquer
-- une conversation entre deux inconnus.
drop policy if exists "Les deux ecrivent dans leur fil" on public.messages_coach;
create policy "Les deux ecrivent dans leur fil"
  on public.messages_coach for insert
  with check (
    (auth.uid() = client_id and auteur = 'client' and public.mon_coach_id() = coach_id)
    or (auth.uid() = coach_id and auteur = 'coach' and public.coach_de(client_id))
  );

drop policy if exists "Marquer le fil du coach comme lu" on public.messages_coach;
create policy "Marquer le fil du coach comme lu"
  on public.messages_coach for update
  using      (auth.uid() = client_id or public.coach_de(client_id))
  with check (auth.uid() = client_id or public.coach_de(client_id));

-- Encore la même leçon : RLS filtre des lignes, pas des colonnes. Sans droit
-- restreint à « lu », la policy ci-dessus laisserait réécrire le corps d'un
-- message déjà envoyé.
revoke all on public.messages_coach from anon;
revoke all on public.messages_coach from authenticated;
grant  select, insert on public.messages_coach to authenticated;
grant  update (lu)   on public.messages_coach to authenticated;


-- ============================================================================
-- 13. SUPPRESSION DE COMPTE (RGPD — droit à l'effacement)
-- ============================================================================
-- Tout est en « on delete cascade » depuis auth.users : supprimer le compte
-- efface séances, exercices, séries, exercices mémorisés, consentements,
-- profil, liens de coaching, conversations et notifications. Seuls les
-- retours restent, sans auteur (voir la table retours).
-- La suppression du compte lui-même se fait depuis le dashboard Supabase
-- (Authentication → Users), faute de serveur pour porter la clé service_role.
--
-- Les notifications étaient en « set null », pour garder une trace de ce qui
-- s'était passé sans que la personne soit identifiable. Mais leur contenu
-- porte le pseudo (inscription) ou les 200 premiers caractères d'un message :
-- elles l'étaient encore. La base existante est corrigée ici, et les
-- notifications déjà orphelines — celles de comptes supprimés avant cette
-- version — sont effacées. Aucune notification n'est créée sans auteur :
-- user_id nul veut toujours dire « compte supprimé ».
alter table public.notifications_admin
  drop constraint if exists notifications_admin_user_id_fkey;
alter table public.notifications_admin
  add constraint notifications_admin_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;
delete from public.notifications_admin where user_id is null;
