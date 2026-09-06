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
| `text-tertiary` | `#888888` | labels, eyebrows |
| `text-faint` | `#999999` | captions, meta |
| `border-dash` | `#b3b3ad` | section rules, placeholders |
| `border-soft` | `#d8d8d2` | card / divider |
| `accent` | `#c1502e` | V1–V3 markers, tag hover, links |

---

## 02 · Type Scale

- **Display / hero / synthesis:** Newsreader (serif) — quiet, confident without shouting
- **Structural / body / labels / metadata:** IBM Plex Mono

| Level | Example | Size |
|---|---|---|
| H1 | "Wayfinding Device" | 40 → 72px |
| H2 | "Aerial Object Detection" | 28 → 44px |
| H3 | "Payments Infrastructure" | 18 → 22px |
| H4 / eyebrow | "01 · ACCESSIBILITY / IoT" | 11px, +0.15em tracking |
| Body | "Assistive navigation hardware for low-vision users." | 12 → 13px |
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

- Content: **Shashvat Rajyaguru** (left) · **WORK** · **CONTACT** (right)
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

Two variants, same base structure (eyebrow label, title, body copy, tag row):

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
- EMAIL · LINKEDIN · RESUME ↓

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
