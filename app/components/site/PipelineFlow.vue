<script setup lang="ts">
/**
 * Pipeline visual — transactions moving through ordered stages.
 *
 * Deliberately the most restrained of the four. Stages are evenly spaced, the
 * scrub windows are equal, packets travel at one constant speed with uniform
 * spacing, and nothing is jittered or staggered out of step. That regularity
 * is the characterisation: this is the regulated-fintech section, and it
 * should read as controlled throughput rather than activity.
 *
 * Stage names are the project's live tags, so the pipeline says what this
 * system is actually built from and re-stages itself when the tags are edited.
 *
 * Both routings ship server-side and swap by media query — the Stage 8 hero
 * precedent — so the layout is correct at either breakpoint with no JS, and
 * the frame owns the height so the hidden routing can never shift the page.
 */
import { buildPipeline } from '~/composables/useProjectVisual'

const props = defineProps<{ labels: string[] }>()

const row = computed(() => buildPipeline(props.labels, 'row'))
const column = computed(() => buildPipeline(props.labels, 'column'))

/** Both routings, rendered together and swapped by media query. */
const routings = computed(() => [column.value, row.value])

const frameStyle = computed(() => ({
  '--row-ratio': `${row.value.width} / ${row.value.height}`,
  '--column-ratio': `${column.value.width} / ${column.value.height}`,
}))

/** One period for every connector, so packet speed never varies by stage. */
const FLOW_PERIOD = 2.6
/** Packets in flight per connector. Even spacing falls out of the count. */
const PACKETS = 3
</script>

<template>
  <!-- The accessible name lives on the frame, not on the two SVGs: both
       routings are always in the DOM and only CSS knows which one is visible,
       so naming each would announce the same diagram twice at every
       breakpoint. -->
  <div
    class="pipeline-frame"
    :style="frameStyle"
    role="img"
    :aria-label="`Pipeline diagram: ${row.stages.length} stages — ${row.stages.map((s) => s.label).join(', ')}`"
  >
    <svg
      v-for="layout in routings"
      :key="layout.mode"
      class="pipeline"
      :class="`is-${layout.mode}`"
      :viewBox="layout.viewBox"
      fill="none"
      aria-hidden="true"
    >
      <g
        v-for="stage in layout.stages"
        :key="stage.id"
        class="stage"
        :style="stage.style"
      >
        <!-- Connector from the previous stage, with its steady traffic. The
             base line draws in on scrub; the packets are pure CSS and run
             continuously, so the pipeline is alive before you reach it. -->
        <template v-if="stage.link">
          <path class="link" :d="stage.link" pathLength="100" />
          <path
            class="flow"
            :d="stage.link"
            pathLength="100"
            :style="{ '--flow-gap': String(100 / PACKETS), '--flow-duration': `${FLOW_PERIOD}s` }"
          />
        </template>

        <rect
          class="box"
          :x="stage.x"
          :y="stage.y"
          :width="stage.w"
          :height="stage.h"
          pathLength="100"
        />
        <!-- Stage index, in the instrument voice: aligned numerals, mono. -->
        <text class="index" :x="stage.x + 8" :y="stage.y + 15">
          {{ String(stage.index + 1).padStart(2, '0') }}
        </text>
        <text class="label" :x="stage.x + 8" :y="stage.y + stage.h - 10">{{ stage.label }}</text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
/* The frame owns the size. Both routings are in the DOM so SSR is correct at
   either breakpoint; neither may contribute height or the hidden one collapses
   and costs a layout shift (the exact bug fixed in the hero at Stage 8). */
.pipeline-frame {
  position: relative;
  width: 100%;
  aspect-ratio: var(--column-ratio);
}

.pipeline {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: none;
}

.is-column {
  display: block;
}

@media (min-width: 640px) {
  .pipeline-frame {
    aspect-ratio: var(--row-ratio);
  }

  .is-column {
    display: none;
  }

  .is-row {
    display: block;
  }
}

/* ── scrub ─────────────────────────────────────────────────────────────────
   Equal windows, in order. No stagger, no easing tricks. */
.stage {
  --local: clamp(0, calc((var(--scrub, 1) - var(--t0)) * var(--inv-span)), 1);
}

/* ── structure ─────────────────────────────────────────────────────────── */

.link {
  stroke: var(--edge);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  stroke-dasharray: 100;
  stroke-dashoffset: calc((1 - var(--local)) * 100);
}

.box {
  fill: var(--surface);
  stroke: var(--edge);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  stroke-dasharray: 100;
  stroke-dashoffset: calc((1 - var(--local)) * 100);
}

/* A stage that has been reached is live: its border takes the accent and its
   fill lifts. Same active-edge treatment the system graph uses. */
.stage .box {
  stroke: color-mix(in srgb, var(--edge-active) calc(var(--local) * 100%), var(--edge));
}

.index {
  font-family: var(--font-mono);
  font-size: 9px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  fill: var(--accent);
  opacity: var(--local);
}

.label {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.01em;
  fill: var(--text-secondary);
  opacity: calc(0.35 + var(--local) * 0.65);
}

/* ── traffic ───────────────────────────────────────────────────────────────
   The Stage 8 packet primitive, unchanged: a zero-length dash with a round
   cap reads as a travelling dot, and offsetting by exactly one gap per cycle
   makes the loop seamless. Every connector shares one period and one gap, so
   the whole pipeline moves in time with itself. */
.flow {
  stroke: var(--packet);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-dasharray: 0.01 var(--flow-gap);
  animation: flow var(--flow-duration) linear infinite;
  /* Traffic only exists on a connector that has been drawn. */
  opacity: calc(var(--local) * 0.85);
}

@keyframes flow {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: calc(var(--flow-gap) * -1); }
}

@media (max-width: 639px) {
  .index,
  .label {
    font-size: 11px;
  }

  .flow {
    stroke-width: 3.4;
  }
}

/* Static end state: pipeline fully drawn, every stage lit, no traffic. */
@media (prefers-reduced-motion: reduce) {
  .link,
  .box {
    stroke-dashoffset: 0;
  }

  .flow {
    display: none;
  }

  .index,
  .label {
    opacity: 1;
  }
}
</style>
