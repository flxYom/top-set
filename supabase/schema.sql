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
--   · Pas de table profiles ni de rôle admin. Rien ne s'en sert ici, et une
--     table qu'on n'utilise pas est une surface d'attaque gratuite.
--   · Pas de vues d'agrégats. L'app calcule déjà volume et records en local,
--     sur des données qu'elle a déjà en cache. Les ajouter serait du code à
--     sécuriser pour zéro gain.
--
-- Modèle : carnets strictement privés. Personne ne voit les séances d'un autre.
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
grant select, insert on public.consentements to authenticated;


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
      insert into public.series (id, exercice_id, user_id, ordre, poids, reps, rpe, repos, fait)
      values (public.uuid_ou_neuf(v_se ->> 'id'), v_ex_id, v_user, j,
              nullif(v_se ->> 'poids', '')::numeric,
              coalesce(v_se ->> 'reps', ''),
              nullif(v_se ->> 'rpe', '')::numeric,
              coalesce(v_se ->> 'repos', ''),
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

revoke execute on function public.pousser_jour(date, jsonb) from anon, public;
revoke execute on function public.tirer_jours(timestamptz)  from anon, public;
grant  execute on function public.pousser_jour(date, jsonb) to authenticated;
grant  execute on function public.tirer_jours(timestamptz)  to authenticated;
grant  execute on function public.maintenant()              to authenticated;


-- ============================================================================
-- 7. SUPPRESSION DE COMPTE (RGPD — droit à l'effacement)
-- ============================================================================
-- Tout est en « on delete cascade » depuis auth.users : supprimer le compte
-- efface séances, exercices, séries, exercices mémorisés et consentements.
-- La suppression du compte lui-même se fait depuis le dashboard Supabase
-- (Authentication → Users), faute de serveur pour porter la clé service_role.
