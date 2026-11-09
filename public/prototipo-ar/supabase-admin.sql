-- Visor-222: ejecutar en el SQL Editor de un proyecto Supabase propio.
-- Se aplican permisos reales en PostgreSQL, NO en el JavaScript.
-- Desactiva la inscripción pública desde Auth > Providers > Email.
create table if not exists public.visor222_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.visor222_admins enable row level security;
revoke all on public.visor222_admins from anon;
grant select on public.visor222_admins to authenticated;
drop policy if exists "Admin can read own membership" on public.visor222_admins;
create policy "Admin can read own membership" on public.visor222_admins
  for select to authenticated using (user_id=(select auth.uid()));

create table if not exists public.visor222_admin_projects (
  id text primary key,
  project jsonb not null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.visor222_admin_projects enable row level security;
revoke all on public.visor222_admin_projects from anon;
grant select, insert, update, delete on public.visor222_admin_projects to authenticated;

drop policy if exists "Only admins can see projects" on public.visor222_admin_projects;
create policy "Only admins can see projects" on public.visor222_admin_projects
for select to authenticated using (
 exists(select 1 from public.visor222_admins a where a.user_id=(select auth.uid()))
);
drop policy if exists "Only admins can insert projects" on public.visor222_admin_projects;
create policy "Only admins can insert projects" on public.visor222_admin_projects
for insert to authenticated with check (
 updated_by=(select auth.uid()) and
 exists(select 1 from public.visor222_admins a where a.user_id=(select auth.uid()))
);
drop policy if exists "Only admins can update projects" on public.visor222_admin_projects;
create policy "Only admins can update projects" on public.visor222_admin_projects
for update to authenticated
using (
 exists(select 1 from public.visor222_admins a where a.user_id=(select auth.uid()))
)
with check (
 updated_by=(select auth.uid()) and
 exists(select 1 from public.visor222_admins a where a.user_id=(select auth.uid()))
);
drop policy if exists "Only admins can delete projects" on public.visor222_admin_projects;
create policy "Only admins can delete projects" on public.visor222_admin_projects
for delete to authenticated using (
 exists(select 1 from public.visor222_admins a where a.user_id=(select auth.uid()))
);
-- Sin políticas de escritura sobre visor222_admins.
-- Crea al primer administrador en Dashboard > Authentication > Users > Add user,
-- copia su UUID y ejecuta manualmente:
-- insert into public.visor222_admins (user_id)
-- values ('COLOCA-AQUI-EL-UUID-REAL-DEL-ADMINISTRADOR');
-- NUNCA pongas la service_role key en GitHub Pages.
