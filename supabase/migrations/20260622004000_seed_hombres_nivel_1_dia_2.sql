create extension if not exists pgcrypto;

do $$
begin
  create type public.routine_gender as enum ('hombres', 'damas');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.video_type as enum ('youtube', 'upload', 'none');
exception when duplicate_object then null;
end $$;

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  gender public.routine_gender not null,
  level integer not null,
  name text not null,
  description text,
  cover_image_url text,
  days_count integer not null default 1,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  day integer not null,
  position integer not null default 0,
  title text not null,
  repetitions text,
  tip text,
  cover_image_url text,
  video_type public.video_type not null default 'none',
  youtube_id text,
  video_url text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.exercises
add column if not exists repetitions text;

create index if not exists exercises_routine_day_position_idx
on public.exercises (routine_id, day, position);

do $$
declare
  target_routine_id uuid;
begin
  select id
    into target_routine_id
  from public.routines
  where gender = 'hombres'
    and level = 1
  order by is_published desc, sort_order asc, created_at asc
  limit 1;

  if target_routine_id is null then
    insert into public.routines (gender, level, name, description, days_count, is_published, sort_order)
    values ('hombres', 1, 'Hombres Nivel 1', 'Rutina inicial para hombres.', 2, true, 1)
    returning id into target_routine_id;
  end if;

  update public.routines
  set days_count = greatest(days_count, 2),
      is_published = true,
      updated_at = now()
  where id = target_routine_id;

  delete from public.exercises
  where routine_id = target_routine_id
    and day = 2;

  insert into public.exercises (routine_id, day, position, title, repetitions, video_type, youtube_id)
  values
    (target_routine_id, 2, 0, 'Subidas al step', '4 x 20', 'youtube', 'd7NnSFMIdgA'),
    (target_routine_id, 2, 1, 'Abdomen cruzados', '4 x 12', 'youtube', 'yi9t1VFN3JU'),
    (target_routine_id, 2, 2, 'Elevacion piernas', '4 x 12', 'youtube', 'l_N4S4S68Sg'),
    (target_routine_id, 2, 3, 'Hombros trapecios encogimiento', '4 x 12', 'youtube', 'gT8CenL_g7g'),
    (target_routine_id, 2, 4, 'Vuelos laterales sentado', '3 x 12', 'youtube', 'Kz6_L7_X_uM'),
    (target_routine_id, 2, 5, 'Vuelos frontales con disco', '4 x 12', 'youtube', 'E8SOnX7pccI'),
    (target_routine_id, 2, 6, 'Triceps 1 mano extension', '4 x 10', 'youtube', 'u8w3Us_FWb4'),
    (target_routine_id, 2, 7, 'Espalda remo 1 mano', '4 x 10', 'youtube', 'own3uEE4wP8'),
    (target_routine_id, 2, 8, 'Espalda remo Dorian', '4 x 10', 'youtube', 'Zf0g-A_yN9k'),
    (target_routine_id, 2, 9, 'Bailarina aductor', '4 x 10', 'youtube', 'F0S1_WvM58s'),
    (target_routine_id, 2, 10, 'Pecho Hamer 45 grados', '3 x 10', 'youtube', 'hkU6fSHcslw'),
    (target_routine_id, 2, 11, 'Biceps sentado con mancuernas', '4 x 12', 'youtube', 'DUTcx5B-ddk');
end $$;

notify pgrst, 'reload schema';
