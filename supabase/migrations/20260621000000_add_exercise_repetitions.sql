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

do $$
begin
  create type public.app_role as enum ('admin');
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

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamp with time zone not null default now(),
  unique (user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

comment on column public.exercises.repetitions is 'Free-text sets, reps, or duration for an exercise, such as 4 x 15 or 4 x 20 seg.';

notify pgrst, 'reload schema';
