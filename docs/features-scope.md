# Portfolio Site — Features & Scope

Companion doc to `design-system.md`. Defines functional requirements before build.

---

## Stack (confirmed)
- **Frontend:** Nuxt.js (Vue)
- **Hosting:** Vercel (free tier), no dedicated server
- **Backend/DB/Auth:** Supabase (free tier)
- **Language:** Node

---

## 1. Public Site (landing page)

Single scrolling page, no login required. Renders all content dynamically from Supabase — nothing hardcoded, so dashboard edits reflect live.

Sections (per locked wireframe + design system):
1. Hero — name + hook line
2. Project sections (dynamic list, ordered) — each with:
   - Eyebrow label (category)
   - Title
   - Body copy
   - Tag pills
   - Variant-specific block: metadata (ROLE/TEAM) for work entries, citation for research entries
   - Optional version-progression tiles (for projects with iteration history, e.g. DP)
   - Optional uploaded image(s)
3. Synthesis block
4. Footer — name, copyright, email/linkedin links, resume download link

---

## 2. Auth

- Supabase Auth, simplest method (email/password) — single user (you), no multi-user roles needed.
- Dashboard routes protected — redirect to login if unauthenticated.

---

## 3. Dashboard (authenticated, content management)

Full CRUD — everything editable, nothing fixed in code.

### 3.1 Site-level content
- Hero hook line — edit text
- Synthesis line — edit text
- Footer links — email, LinkedIn URL
- Resume — upload/replace PDF (stored in Supabase Storage, dashboard swaps the file)

### 3.2 Projects (full CRUD)
- **Add** new project (new card, appended or positioned in order)
- **Edit** existing project:
  - Eyebrow/category label
  - Title
  - Body copy
  - Tags (add/remove/reorder tag pills)
  - Variant type: work (ROLE/TEAM fields) vs research (citation field)
  - Version-progression tiles, if applicable (add/edit/reorder V1, V2, V3... + in-progress tile state)
  - Image(s) — upload via dashboard, stored in Supabase Storage
- **Delete** project
- **Reorder** projects (drag or up/down control — determines scroll order on landing page)

### 3.3 Images
- Upload only — no external image URLs pasted in, dashboard handles upload to Supabase Storage, site references stored asset.

---

## 4. Data model (Supabase, draft)

**site_content** (single row)
- hero_hook (text)
- synthesis_line (text)
- footer_email (text)
- footer_linkedin (text)
- resume_file_path (text, Supabase Storage ref)

**projects** (table)
- id
- order_index (int, for reorder)
- eyebrow (text)
- title (text)
- body (text)
- variant (enum: 'work' | 'research')
- role (text, nullable — work variant)
- team (text, nullable — work variant)
- citation (text, nullable — research variant)
- created_at / updated_at

**project_tags** (table, FK → projects)
- project_id
- tag_text
- order_index

**project_versions** (table, FK → projects — for DP-style progression tiles)
- project_id
- label (e.g. "V1 · 2019")
- sublabel (e.g. "breadboard prototype")
- description
- status (enum: 'complete' | 'in_progress')
- order_index

**project_images** (table, FK → projects)
- project_id
- storage_path
- order_index

---

## 5. Dark Mode Toggle

- Tokens already role-based (see design-system.md color tokens) — dark mode is a token swap, not a rebuild.
- Toggle placement: nav (simple sun/moon icon or similar, matches minimal nav style).
- Persistence: store preference in localStorage (client-side) — no need for Supabase/auth involvement, applies to public site for any visitor.
- Need: define dark-mode token values (invert bg/surface, adjust text/border roles) — not yet drafted, do this alongside dashboard build.

## 6. Analytics / Visitor Tracking

- Lightweight, privacy-respecting option given free-tier/no-server constraint — options to pick from before build:
  - **Vercel Analytics** (native to hosting, zero extra setup, free tier available)
  - **Plausible/Umami** (privacy-focused, free self-host or cheap hosted tier)
  - **Supabase-based custom tracking** (log pageviews to a table — more control, more build work)
- Suggest **Vercel Analytics** as default pick — simplest, no extra account/service needed since already deploying there. Confirm or override before build.
- Scope: pageviews + basic referrer/device data. No user-level tracking, no cookies requiring consent banners (Vercel Analytics is cookieless).

## 7. Out of scope (for now)
- Multi-user / roles
- Comments/contact form (footer just links to email, no form submission handling)

---

## Build order (suggested)
1. Supabase schema (tables above) + storage buckets (resume, images)
2. Auth (login page + protected dashboard route)
3. Dashboard CRUD screens (site content → projects → tags/versions/images)
4. Public landing page (fetch + render from Supabase)
5. Dark mode token values + toggle (nav + localStorage persistence)
6. Analytics integration (Vercel Analytics, pending confirmation)
7. Responsive pass (mobile/tablet/desktop per design-system.md)
8. Deploy to Vercel
