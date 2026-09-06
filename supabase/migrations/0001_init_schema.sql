-- Portfolio site — initial schema
-- Tables per docs/features-scope.md §4. Single-user site: all reads are public,
-- all writes require an authenticated session (Supabase email/password auth).

-- 1. site_content — single row of site-wide editable copy
create table if not exists public.site_content (
  id integer primary key default 1,
  hero_hook text not null default '',
  synthesis_line text not null default '',
  footer_email text not null default '',
  footer_linkedin text not null default '',
  resume_file_path text,
  updated_at timestamptz not null default now(),
  constraint site_content_singleton check (id = 1)
);

-- 2. projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  order_index integer not null default 0,
  eyebrow text not null,
  title text not null,
  body text not null,
  variant text not null check (variant in ('work', 'research')),
  role text,
  team text,
  citation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. project_tags
create table if not exists public.project_tags (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  tag_text text not null,
  order_index integer not null default 0
);

-- 4. project_versions — DP-style hardware/firmware progression tiles
create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  label text not null,
  sublabel text not null,
  description text not null,
  status text not null check (status in ('complete', 'in_progress')),
  order_index integer not null default 0
);

-- 5. project_images
create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null,
  order_index integer not null default 0
);

create index if not exists project_tags_project_id_idx on public.project_tags(project_id);
create index if not exists project_versions_project_id_idx on public.project_versions(project_id);
create index if not exists project_images_project_id_idx on public.project_images(project_id);
create index if not exists projects_order_idx on public.projects(order_index);

-- Row Level Security — public (anon) can read everything, only an authenticated
-- session (the single dashboard user) can write.
alter table public.site_content enable row level security;
alter table public.projects enable row level security;
alter table public.project_tags enable row level security;
alter table public.project_versions enable row level security;
alter table public.project_images enable row level security;

create policy "public read site_content" on public.site_content for select using (true);
create policy "auth write site_content" on public.site_content for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read projects" on public.projects for select using (true);
create policy "auth write projects" on public.projects for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read project_tags" on public.project_tags for select using (true);
create policy "auth write project_tags" on public.project_tags for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read project_versions" on public.project_versions for select using (true);
create policy "auth write project_versions" on public.project_versions for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public read project_images" on public.project_images for select using (true);
create policy "auth write project_images" on public.project_images for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Storage buckets: resume (single PDF) and images (project images). Both public
-- for read (site renders/links them for anonymous visitors); writes require auth.
insert into storage.buckets (id, name, public)
values ('resume', 'resume', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

create policy "public read resume bucket" on storage.objects for select
  using (bucket_id = 'resume');
create policy "auth insert resume bucket" on storage.objects for insert to authenticated
  with check (bucket_id = 'resume');
create policy "auth update resume bucket" on storage.objects for update to authenticated
  using (bucket_id = 'resume');
create policy "auth delete resume bucket" on storage.objects for delete to authenticated
  using (bucket_id = 'resume');

create policy "public read images bucket" on storage.objects for select
  using (bucket_id = 'images');
create policy "auth insert images bucket" on storage.objects for insert to authenticated
  with check (bucket_id = 'images');
create policy "auth update images bucket" on storage.objects for update to authenticated
  using (bucket_id = 'images');
create policy "auth delete images bucket" on storage.objects for delete to authenticated
  using (bucket_id = 'images');
