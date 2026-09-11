# Portfolio Design System

Tokens, type, and components for Shashvat Rajyaguru's portfolio site.
Sparse, deliberate, architected — whitespace is a design decision, not empty space.

---

## 01 · Color Tokens

Named as roles, not raw values, so a dark theme is a token swap — surfaces invert, text/border roles stay semantically identical.

| Token | Value | Usage |
|---|---|---|
| `bg` | `#fafaf8` | page background |
| `surface` | `#ffffff` | nav / raised panels |
| `text` | `#111111` | primary text |
| `text-secondary` | `#555555` | body copy |
| `text-tertiary` | `#67675f` | labels, category facets |
| `text-faint` | `#6f6f68` | captions, meta |
| `border-dash` | `#b3b3ad` | section rules, placeholders |
| `border-soft` | `#d8d8d2` | card / divider |
| `accent` | `#c1502e` | V1–V3 markers, tag hover, links |

> `text-tertiary` / `text-faint` were darkened in Stage 8 for WCAG AA — see §11.
> Stage 8 also adds the system-layer tokens (`edge`, `node`, `packet`, `grid`,
> `core-line`); those are tabulated in §11.

---

## 02 · Type Scale

- **Display / hero / synthesis / body:** Newsreader (serif) — quiet, confident without shouting
- **Structural only:** IBM Plex Mono — tags, version labels, the hero system
  readout, dashboard controls. Stage 8 moved prose off mono; see §11.

| Level | Example | Size |
|---|---|---|
| H1 | "Wayfinding Device" | 40 → 72px |
| H2 | "Aerial Object Detection" | 28 → 44px |
| H3 | "Payments Infrastructure" | 18 → 22px |
| Category facet | "Accessibility" · "IoT" (separate elements) | 13px, sentence case |
| Body | "Assistive navigation hardware for low-vision users." | 16px serif |
| Caption | "Fig. 1. System architecture overview." | 10px |
| Synthesis | "Different domains, same bet — build systems that outlive the problem, not the person building them." | 22 → 32px |

---

## 03 · Spacing Scale

| Value (px) | Usage |
|---|---|
| 4 | tag pill internal gap |
| 8 | label-to-title gap |
| 12 | card internal stack |
| 16 | tag row gap |
| 24 | card padding, mobile section padding |
| 32 | footer padding |
| 48 | section padding, tablet |
| 96 | section padding, desktop |

---

## 04 · Nav

- Content: **Shashvat Rajyaguru** (left), **Work**, **Contact** (right) — sentence case since Stage 8
- Behavior: hidden-until-scroll — `translateY(-100%)` at top, slides in past 80px scroll
- Style: 1px bottom border only, no shadow

---

## 05 · Tag Pill

Small label component for tech-stack tags. Split by project/version — no generic/invented tags.

| Project | Tags |
|---|---|
| DP · V1 | PHP, JavaScript, Android |
| DP · V3 | Raspberry Pi 5, Computer Vision, Haptics, Kafka, AWS |
| DP · V4 (in progress) | — (left open) |
| Sky-Sentinel | YOLOv8, PyTorch, Computer Vision |
| Payson | Java, Spring Boot, Nuxt, MSSQL |
| Samvit | Python, LLM Architecture, Memory Systems |

---

## 06 · Version Progression (DP component)

Timeline-style tiles showing hardware/firmware iteration.

| Tile | Label | Description |
|---|---|---|
| V1 · 2019 | breadboard prototype | Proof of concept. |
| V2 · 2021 | enclosed unit | Custom PCB, field trials. |
| V3 · 2025 | production unit | Certified for distribution. |
| V4 · IN PROGRESS | next-gen concept | Exploring wearable form factor. |

**In-progress tile treatment:** dotted border, muted background, no timeline-dot fill — signals "not yet resolved" rather than "complete."

---

## 07 · Project Card

Two variants, same base structure (node marker + category facets, title, body copy, tag row):

**Work entry variant** — adds a metadata row (ROLE / TEAM) instead of a citation.
> Example: Wayfinding Device — ACCESSIBILITY / IoT — "Assistive navigation hardware for low-vision users, three hardware/firmware generations across six years." — tags: Raspberry Pi 5, Computer Vision, Haptics, Kafka, AWS

**Research entry variant** — adds a citation block instead of metadata.
> Example: Aerial Object Detection — RESEARCH / COMPUTER VISION — "Lightweight detection architecture for low-altitude drone footage, evaluated against three benchmark datasets." — citation: [Author, A. et al. Conference Proceedings, Year. pp. 000–000.]

---

## 08 · Synthesis Block

Large-type standalone statement, heavy whitespace around it.

> "Different domains, same bet — build systems that outlive the problem, not the person building them."

---

## 09 · Footer

- **Shashvat Rajyaguru**
- © 2026
- Email, LinkedIn, Resume ↓ — spaced, not middot-joined, since Stage 8

---

## Locked Copy Reference (full site content)

**Hero hook:**
> "Some people finish projects. I build things that don't need me to."

**01 · Wayfinding Device (DP)** — Accessibility / IoT · 2019—ongoing
> Started with one belief: a blind person shouldn't need a companion to move through the world. V1 ran on GPS/GSM and taught me web dev, Android, and backend from scratch — but it needed constant connectivity and had no intelligence. V3 rebuilt everything: Raspberry Pi 5, camera-based object detection, haptic feedback, and offline-first communication — no internet required, zero-downtime Kafka notifications on AWS.
> V4 (in progress): turn-by-turn navigation, scene description, OCR, and fall detection.

**02 · Aerial Object Detection (Sky-Sentinel)** — Research / Computer Vision
> Aerial object detection struggles with tiny objects, occlusion, and crowded scenes. We ensembled YOLOv8x and YOLOv8m using Weighted Boxes Fusion, tested on the VisDrone dataset — the combined model hit 0.45 mAP@0.5, beating either detector alone (0.431 / 0.400), balancing accuracy against real-time UAV constraints.
> Citation: M. J. Patel, S. G. Rajyaguru, et al., "Boosting Object Detection in Aerial Imagery with Ensemble YOLOv8 Models and Weighted Boxes Fusion," *Proc. 9th Int. Conf. I-SMAC*, 2025, pp. 237–244.

**03 · Payments Infrastructure (Payson)** — Fintech · 2023—present
> Backend engineer on a financial-crime compliance platform — multi-module Java/Spring Boot, Nuxt frontend, MSSQL at scale. Work spans authentication flows, load-testing infrastructure, and production debugging across a system built for regulated data.
> ROLE: Backend · TEAM: 6 eng.

**04 · Autonomous Reasoning Agent (Samvit)** — AI · Side Project
> Not trying to build the most powerful AI — trying to build one people talk to like a friend. A system with its own memory, that decides what to keep and what to let go. Currently simulating neurochemical responses and running a default-mode-network model that lets it wander, overthink, and follow its own line of thought.

**Synthesis:**
> "Different domains, same bet — build systems that outlive the problem, not the person building them."

**Footer:** Shashvat Rajyaguru © 2026 · EMAIL · LINKEDIN · RESUME ↓

---

## 10 · System Visualization Layer (Stage 8)

The site behaves like a running system rather than a static page. This is **one
idea expressed three ways**, not three effects — hero, scroll and hover are all
facets of "you are looking at a live system".

### The single animation primitive

Every animation in the site is a stroked SVG path carrying `pathLength="100"`,
driven by `stroke-dashoffset`. Only the dash pattern changes:

| Effect | Dash pattern | Motion |
|---|---|---|
| Draw-in (page load) | `dasharray: 100` | offset `100 → 0`, staggered per edge |
| Packet flow (idle) | `dasharray: 0.01 <gap>` + round cap | offset loops by one gap, infinite |
| Hover signal pulse | `dasharray: 0.01 100` | offset `100 → 0`, one shot |
| Scrub assembly | `dasharray: 100` | offset driven by `--scrub` |

Because `pathLength` normalises every path to 100 units, none of this needs the
real geometry measured — which is what lets the graph re-lay out for any number
of projects without touching the animation code.

### Layouts

- **Radial** (≥768px) — node *i* at `-90° + i·(360°/n)`, so the graph is always
  symmetric about the vertical axis and node order follows project order
  clockwise from the top. Edges terminate on the boundary of a central core
  region; on the hero that core *is* the hook line.
- **Bus** (<768px) — a vertical signal bus with the core at the top and each
  project branching off it. A squeezed radial graph is illegible at 375px, so
  portrait gets a considered alternative rather than a shrunken one.
- Adjacent nodes are also joined by orbit arcs (n ≥ 3) so the graph reads as a
  mesh rather than lone spokes.

Both routings are rendered server-side and swapped by media query. Neither SVG
may contribute height — the graph frame owns its size via `aspect-ratio`, with
the bus ratio inlined per render (bus height is a function of node count).
Without this the hidden routing lays out first and collapses, costing ~0.15 CLS.

### Nothing geometric or temporal is hardcoded

Node count, coordinates, edge paths, ring arcs, draw-in stagger, packet period
(normalised so signal *speed* is constant across edges of different length),
scrub timeline length, version-tile thresholds and image-frame thresholds are
all computed from the live Supabase data at runtime. See
`app/composables/useSystemGraph.ts`.

### Build sequence fallbacks

| Data | Rendered |
|---|---|
| versions + images | scrubbed image frames, tiles light in step |
| versions, no images | procedural assembly schematic (`DeviceSchematic.vue`) |
| images, no versions | scrubbed image frames, no tiles |
| neither | nothing — the section is omitted |
| some images 404 | broken frames drop out, remaining frames re-time |
| all images 404 | falls back to the schematic; section still renders |

### Reduced motion

A genuinely static end state, not a slowed animation: edges resolve fully
drawn, packets are removed from the render tree (`display: none`), sticky
scrubbing is disabled and `--scrub` pins at 1 so sequences render assembled.

### Performance

Idle "living" state is pure CSS — no JS runs per frame. Scroll-linked work goes
through one shared rAF driver (`useScrollScrub.ts`) that batches all reads
before all writes and only ever writes a CSS custom property. Off-screen graphs
set `animation-play-state: paused`.

---

## 11 · Removed design tells (Stage 8)

| Removed | Replaced with |
|---|---|
| ALL-CAPS eyebrow labels | sentence-case category facets beside a live node marker |
| `01 · / 02 · / 03 ·` project numbering | nothing — it was never a real sequence |
| middot-joined meta strings | discrete elements with hairline rules |
| middot-joined ALL-CAPS footer/nav links | sentence-case links, spaced not joined |
| page-wide monospace body copy | Newsreader for prose; mono kept only where structural — tags, version labels, the system readout, dashboard controls |

**Version numbering (V1/V2/V3/V4) is kept** — that *is* a genuine sequence.

### Token changes

`text-tertiary` and `text-faint` were darkened. The original `#888888` / `#999999`
scored 3.39:1 and 2.73:1 on the page background, failing WCAG AA; they are now
`#67675f` (5.46:1) and `#6f6f68` (4.84:1). Dark-mode `text-faint` went from
`#6d6d68` (3.61:1) to `#85857e` (5.05:1). Relative emphasis order is unchanged.

| Token | Light | Dark | Usage |
|---|---|---|---|
| `edge` | `#cfcfc7` | `#3a3a35` | graph connection lines |
| `node` | `#9a9a92` | `#6f6f69` | idle node stroke |
| `node-active` / `packet` | `#c1502e` | `#e0693f` | active node, travelling packets |
| `grid` | `#e7e7e1` | `#232320` | hero field grid |
| `core-line` | `#c9c9c1` | `#3f3f39` | core boundary |
