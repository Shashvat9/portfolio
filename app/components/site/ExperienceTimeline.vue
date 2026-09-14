<script setup lang="ts">
/**
 * Experience timeline.
 *
 * The rest of the site draws the work as a graph in space — nodes around a
 * core. This is the same system seen along its other axis: one signal path
 * running down through time, with each role a node on it. Deliberately not a
 * separate visual idea, and deliberately not a résumé list: same 1px `--edge`
 * strokes, same node markers, same packet primitive, same accent.
 *
 * "Still running" is the state that matters here, and it is carried the same
 * way the V4 in-progress version tile carries it: a dotted accent marker and a
 * dashed, unterminated rail. Signal is still flowing into that node and the
 * line below it has not been drawn yet, because it hasn't happened yet. A role
 * is ongoing when `end_date` is null — one column, no flag that can disagree
 * with it.
 *
 * Nothing here is tied to a count: one entry and eight entries both lay out,
 * the scrub windows divide by whatever is present, and reordering in the
 * dashboard reorders the rail.
 */
import { formatRange, formatDuration, isOngoing } from '~/utils/dates'

export interface ExperienceEntry {
  id: string
  role: string
  organization: string
  start_date: string
  end_date: string | null
  location: string | null
  description: string
  experience_tags?: { id: string; tag_text: string; order_index: number }[]
}

const props = defineProps<{ entries: ExperienceEntry[] }>()

const track = ref<HTMLElement | null>(null)
// A gentle overshoot so the last entry finishes lighting before the section
// leaves the viewport.
useScrollScrub(track, 0.25)

/** Rail traffic stops while the timeline is off-screen. */
const paused = useOffscreenPause(track)

const rows = computed(() =>
  props.entries.map((entry, i) => ({
    ...entry,
    ongoing: isOngoing(entry.end_date),
    range: formatRange(entry.start_date, entry.end_date),
    duration: formatDuration(entry.start_date, entry.end_date),
    tags: [...(entry.experience_tags ?? [])].sort((a, b) => a.order_index - b.order_index),
    paragraphs: entry.description.split('\n\n').filter(Boolean),
    isLast: i === props.entries.length - 1,
    // Equal slice of the scroll per entry — the count divides the timeline, so
    // adding a fifth role re-times the other four rather than overflowing.
    style: {
      '--t0': (i / props.entries.length).toFixed(4),
      '--inv-span': String(props.entries.length),
    } as Record<string, string>,
  })),
)
</script>

<template>
  <section
    v-if="rows.length"
    id="experience"
    ref="track"
    class="experience"
    :class="{ 'is-paused': paused }"
  >
    <header class="section-head">
      <p class="kicker">Experience</p>
      <h2 class="section-title">Where the signal has run</h2>
    </header>

    <ol class="timeline">
      <li
        v-for="row in rows"
        :key="row.id"
        class="entry"
        :class="{ ongoing: row.ongoing, last: row.isLast }"
        :style="row.style"
      >
        <!-- The rail. One SVG per row, stretched to the row's height: the
             trunk is a straight vertical line, so non-uniform scaling is
             invisible, and non-scaling-stroke keeps it exactly 1px and its
             packet caps round at any row height. -->
        <div class="rail" aria-hidden="true">
          <svg class="rail-svg" viewBox="0 0 24 100" preserveAspectRatio="none" fill="none">
            <path class="trunk" d="M12,0 V100" pathLength="100" />
            <!-- Traffic on the segment, same zero-length-dash dot the system
                 graph uses. A finished role's signal has already passed
                 through; the running one is still carrying it. -->
            <path v-if="!row.isLast || row.ongoing" class="flow" d="M12,0 V100" pathLength="100" />
          </svg>
          <span class="node" />
        </div>

        <div class="content">
          <p class="role">{{ row.role }}</p>
          <p class="org">{{ row.organization }}</p>

          <p class="when">
            <span class="range">{{ row.range }}</span>
            <span v-if="row.duration" class="duration">{{ row.duration }}</span>
            <span v-if="row.location" class="location">{{ row.location }}</span>
            <!-- The explicit readout, in the instrument voice the hero uses. -->
            <span v-if="row.ongoing" class="running">running</span>
          </p>

          <div v-if="row.paragraphs.length" class="description">
            <p v-for="(para, i) in row.paragraphs" :key="i">{{ para }}</p>
          </div>

          <!-- Same tag pills as the project sections. -->
          <ul v-if="row.tags.length" class="tags">
            <li v-for="tag in row.tags" :key="tag.id">{{ tag.tag_text }}</li>
          </ul>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.experience {
  --scrub: 1;
  /* Off-screen at first paint like the project sections; same reasoning. No
     explicit intrinsic size — the timeline's height depends on its copy, so
     the browser's remembered size is the honest estimate. */
  content-visibility: auto;
  contain-intrinsic-size: auto 900px;
  max-width: 900px;
  margin: 0 auto;
  padding: var(--space-48) var(--space-24);
}

.section-head {
  margin-bottom: var(--space-32);
}

.kicker {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--text-tertiary);
  margin: 0 0 var(--space-8);
}

/* The same core marker the dashboard and the graph use. */
.kicker::before {
  content: '';
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}

.section-title {
  font-family: var(--font-display);
  font-size: clamp(26px, 4vw, 40px);
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--text);
  margin: 0;
}

/* ── timeline ──────────────────────────────────────────────────────────── */

.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
}

.entry {
  --local: clamp(0, calc((var(--scrub) - var(--t0)) * var(--inv-span)), 1);
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: var(--space-16);
  /* The row must be able to shrink-wrap its content for the rail to stretch
     to exactly the row height. */
  align-items: stretch;
}

.rail {
  position: relative;
  width: 24px;
}

.rail-svg {
  display: block;
  width: 100%;
  height: 100%;
}

.trunk {
  stroke: var(--edge);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  stroke-dasharray: 100;
  /* Draws downward as the section is read. */
  stroke-dashoffset: calc((1 - var(--local)) * 100);
}

/* A running role's rail continues past its node into time that hasn't
   happened yet, so it is dashed and never arrives anywhere — the same
   unfinished treatment as the in-progress version tile. */
.entry.ongoing.last .trunk {
  stroke-dasharray: 2 4;
  stroke-dashoffset: 0;
  stroke: var(--border-dash);
  opacity: calc(0.3 + var(--local) * 0.7);
}

.experience.is-paused .flow {
  animation-play-state: paused;
}

.flow {
  stroke: var(--packet);
  stroke-width: 3;
  stroke-linecap: round;
  vector-effect: non-scaling-stroke;
  stroke-dasharray: 0.01 50;
  animation: flow-down 3.4s linear infinite;
  opacity: calc(var(--local) * 0.75);
}

@keyframes flow-down {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: -50; }
}

/* The node sits at the top of its row, on the rail. */
.node {
  position: absolute;
  top: 6px;
  left: 50%;
  width: 9px;
  height: 9px;
  margin-left: -4.5px;
  border-radius: 50%;
  border: 1.5px solid var(--node);
  background: var(--bg);
  transform: scale(calc(0.7 + var(--local) * 0.3));
  transition: background-color 0.3s ease, border-color 0.3s ease;
}

/* Reached roles light up, exactly like an active graph node. */
.entry .node {
  background: color-mix(in srgb, var(--node-active) calc(var(--local) * 100%), var(--bg));
  border-color: color-mix(in srgb, var(--node-active) calc(var(--local) * 100%), var(--node));
}

/* Still running: dotted accent ring, hollow centre — the V4 in-progress tile's
   marker, unchanged. */
.entry.ongoing .node {
  background: transparent;
  border: 1px dotted var(--accent);
  box-shadow: 0 0 0 5px color-mix(in srgb, var(--accent) calc(var(--local) * 12%), transparent);
}

/* ── content ───────────────────────────────────────────────────────────── */

.content {
  padding-bottom: var(--space-32);
  opacity: calc(0.35 + var(--local) * 0.65);
  transform: translateY(calc((1 - var(--local)) * 6px));
}

.entry.last .content {
  padding-bottom: 0;
}

.role {
  font-family: var(--font-display);
  font-size: clamp(19px, 2.4vw, 23px);
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--text);
  margin: 0;
}

.org {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 2px 0 var(--space-8);
}

/* Dates and status are instrument readings — mono, aligned numerals. */
.when {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-8) var(--space-12);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-faint);
  margin: 0 0 var(--space-12);
  font-variant-numeric: tabular-nums;
}

.duration::before,
.location::before {
  content: '';
  display: inline-block;
  width: 1px;
  height: 0.9em;
  background: var(--border-soft);
  margin-right: var(--space-12);
  vertical-align: -0.1em;
}

.running {
  color: var(--accent);
  border: 1px dotted var(--accent);
  padding: 1px var(--space-8);
  letter-spacing: 0.04em;
}

.description {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  max-width: 62ch;
  margin-bottom: var(--space-12);
}

.description p {
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
}

/* Identical to the project card's tag pills. */
.tags {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-8);
  margin: 0;
  padding: 0;
}

.tags li {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: var(--space-4) var(--space-8);
  border: 1px solid var(--border-soft);
  color: var(--text-secondary);
  transition: border-color 0.15s ease, color 0.15s ease;
}

.tags li:hover {
  border-color: var(--accent);
  color: var(--accent);
}

@media (min-width: 768px) {
  .experience {
    padding: var(--space-96) var(--space-48);
  }

  .entry {
    grid-template-columns: 32px 1fr;
    gap: var(--space-24);
  }

  .rail {
    width: 32px;
  }

  .content {
    padding-bottom: var(--space-48);
  }
}

@media (min-width: 1024px) {
  .experience {
    padding: var(--space-96);
  }
}

/* Static end state: rail fully drawn, every role lit, no traffic. The "still
   running" distinction survives, because it is carried by the dotted marker
   and the dashed tail rather than by motion. */
@media (prefers-reduced-motion: reduce) {
  .experience {
    --scrub: 1;
  }

  .trunk {
    stroke-dashoffset: 0;
  }

  .flow {
    display: none;
  }

  .node {
    transform: none;
    transition: none;
  }

  .content {
    opacity: 1;
    transform: none;
  }
}
</style>
