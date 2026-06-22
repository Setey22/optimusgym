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
  order by created_at asc
  limit 1;

  if target_routine_id is null then
    insert into public.routines (gender, level, name, description, days_count, is_published, sort_order)
    values ('hombres', 1, 'Hombres Nivel 1', 'Rutina inicial para hombres - Dia 1.', 1, true, 1)
    returning id into target_routine_id;
  else
    update public.routines
    set days_count = greatest(days_count, 1),
        is_published = true,
        updated_at = now()
    where id = target_routine_id;
  end if;

  delete from public.exercises
  where routine_id = target_routine_id
    and day = 1;

  insert into public.exercises (routine_id, day, position, title, repetitions, video_type, youtube_id)
  values
    (target_routine_id, 1, 0, 'Bici', '5 min', 'youtube', 'NqncPmYJJLc'),
    (target_routine_id, 1, 1, 'Abdomen bolita', '4 x 12', 'youtube', 'D1ydYW_yWmY'),
    (target_routine_id, 1, 2, 'Abdomen plancha', '4 x 20 seg', 'youtube', 'zfY5XXa26ug'),
    (target_routine_id, 1, 3, 'Pecho Hamer 45 grados', '4 x 10', 'youtube', 'hkU6fSHcslw'),
    (target_routine_id, 1, 4, 'Pecho Hamer 90 grados', '4 x 10', 'youtube', 'Vr6SCwA3TSY'),
    (target_routine_id, 1, 5, 'Espalda remo 45 grados', '4 x 10', 'youtube', 'j2paN-0DxRg'),
    (target_routine_id, 1, 6, 'Espalda remo 90 grados', '4 x 10', 'youtube', 'FOusO8JMU3Q'),
    (target_routine_id, 1, 7, 'Piernas extensiones', '4 x 10', 'youtube', 'DI34ngDC8FU'),
    (target_routine_id, 1, 8, 'Piernas isometricos', '4 x 20 seg', 'youtube', 'LOOHr7p-_XQ'),
    (target_routine_id, 1, 9, 'Gemelos con barra', '4 x 15', 'youtube', 'qdogJJnXEmU'),
    (target_routine_id, 1, 10, 'Biceps banco Scott', '4 x 10', 'youtube', 'Ks5KNBSmw6A'),
    (target_routine_id, 1, 11, 'Frances triceps', '4 x 10', 'youtube', 'BTkLgHG7kzo'),
    (target_routine_id, 1, 12, 'Hombro lateral', '4 x 12', 'youtube', 'hgLpdwMtEEs');
end $$;

notify pgrst, 'reload schema';
