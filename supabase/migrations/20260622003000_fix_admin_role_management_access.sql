grant all on public.user_roles to authenticated;

alter table public.user_roles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_roles'
      and policyname = 'Admins can manage role rows'
  ) then
    create policy "Admins can manage role rows"
    on public.user_roles
    for all
    to authenticated
    using (public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'admin'));
  end if;
end $$;

notify pgrst, 'reload schema';
