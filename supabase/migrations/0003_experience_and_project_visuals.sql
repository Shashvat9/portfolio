-- Stage 9 — per-project visuals + experience timeline.
--
-- Purely additive: one nullable column on projects, two new tables. Nothing is
-- dropped or rewritten, so the site renders identically before and after this
-- migration is applied (see app/utils/visual.ts — an unset `visual` falls back
-- to derivation from the project's own tags/category, exactly the way
-- utils/category.ts treats the optional `category` column).

-- 1. projects.visual — which scroll-driven visual a project's section renders.
--
-- The *kind* of animation is content, not code: it says what this project IS
-- ("this one is a detector", "this one is a pipeline"), which is a property of
-- the project and therefore belongs in the row rather than in a title match.
-- NULL means "derive it" — see visual.ts. Keeping NULL as the default means
-- adding a project in the dashboard never requires picking a visual to get a
-- sensible one.
alter table public.projects
  add column if not exists visual text
  check (visual is null or visual in ('assembly', 'detection', 'pipeline', 'reasoning'));

comment on column public.projects.visual is
  'Scroll-driven visual for this project section. NULL = derive from tags/category.';

-- 2. experience — internships and employment, rendered as the timeline that
-- runs between the project sections and the synthesis line.
--
-- end_date IS NULL is the single source of truth for "still running". No
-- separate boolean: two columns that can disagree about whether a role is
-- current is exactly the kind of state this site shouldn't carry.
create table if not exists public.experience (
  id uuid primary key default gen_random_uuid(),
  order_index integer not null default 0,
  role text not null,
  organization text not null,
  start_date date not null,
  end_date date,
  location text,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- A role cannot finish before it starts. Cheap to enforce, and the timeline
  -- computes durations from these two columns.
  constraint experience_dates_ordered check (end_date is null or end_date >= start_date)
);

comment on table public.experience is
  'Roles shown on the public timeline. end_date NULL = currently running.';

-- 3. experience_tags — same shape as project_tags so the tag component and the
-- reorder helper are shared rather than reimplemented.
create table if not exists public.experience_tags (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.experience(id) on delete cascade,
  tag_text text not null,
  order_index integer not null default 0
);

create index if not exists experience_order_idx on public.experience(order_index);
create index if not exists experience_tags_experience_id_idx on public.experience_tags(experience_id);

-- RLS — identical posture to every other table: the world reads, the single
-- authenticated dashboard user writes.
alter table public.experience enable row level security;
alter table public.experience_tags enable row level security;

drop policy if exists "public read experience" on public.experience;
create policy "public read experience" on public.experience for select using (true);

drop policy if exists "auth write experience" on public.experience;
create policy "auth write experience" on public.experience for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "public read experience_tags" on public.experience_tags;
create policy "public read experience_tags" on public.experience_tags for select using (true);

drop policy if exists "auth write experience_tags" on public.experience_tags;
create policy "auth write experience_tags" on public.experience_tags for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
