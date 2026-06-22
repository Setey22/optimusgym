do $$
begin
  create type public.app_role as enum ('admin');
exception when duplicate_object then null;
end $$;

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

grant usage on schema public to anon, authenticated;
grant select on public.routines to anon, authenticated;
grant select on public.exercises to anon, authenticated;
grant all on public.routines to authenticated;
grant all on public.exercises to authenticated;
grant select on public.user_roles to authenticated;

alter table public.routines enable row level security;
alter table public.exercises enable row level security;
alter table public.user_roles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'routines'
      and policyname = 'Published routines are readable'
  ) then
    create policy "Published routines are readable"
    on public.routines
    for select
    to anon, authenticated
    using (is_published = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'exercises'
      and policyname = 'Exercises for published routines are readable'
  ) then
    create policy "Exercises for published routines are readable"
    on public.exercises
    for select
    to anon, authenticated
    using (
      exists (
        select 1
        from public.routines r
        where r.id = exercises.routine_id
          and r.is_published = true
      )
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'routines'
      and policyname = 'Admins can manage routines'
  ) then
    create policy "Admins can manage routines"
    on public.routines
    for all
    to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'exercises'
      and policyname = 'Admins can manage exercises'
  ) then
    create policy "Admins can manage exercises"
    on public.exercises
    for all
    to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_roles'
      and policyname = 'Users can read own role rows'
  ) then
    create policy "Users can read own role rows"
    on public.user_roles
    for select
    to authenticated
    using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
  end if;
end $$;

notify pgrst, 'reload schema';
