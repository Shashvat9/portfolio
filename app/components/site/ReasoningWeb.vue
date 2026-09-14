<script setup lang="ts">
/**
 * Reasoning visual — a mind wandering, not a machine executing.
 *
 * This is the one place on the site where irregularity is the point. Every
 * other visual is even: the pipeline's stages are equally spaced and equally
 * timed, the graph's packets travel at one constant speed, the schematic's
 * layers are evenly distributed. Here, branch angles, lengths, fan-out,
 * firing delays and firing periods are all pulled from the project's seeded
 * stream, so nothing lines up with anything else and no two paths pulse
 * together.
 *
 * Paths that trail off are deliberate: a branch marked `fades` has no terminal
 * node and its stroke dissolves toward the end, so the eye follows a thought
 * that goes nowhere. Its signal restarts on its own irregular period rather
 * than joining the others.
 *
 * Irregular is not random: the stream is seeded from the project id (see
 * utils/seeded.ts), so the same project draws the same tree on the server and
 * on the client and across navigations. Only the *look* is unruly.
 */
import { buildReasoning, VISUAL_VIEWBOX } from '~/composables/useProjectVisual'

const props = defineProps<{ projectKey: string; tagCount: number }>()

const layout = computed(() => buildReasoning(props.projectKey, props.tagCount))
const vb = VISUAL_VIEWBOX
</script>

<template>
  <svg
    class="reasoning"
    :viewBox="`0 0 ${vb.width} ${vb.height}`"
    fill="none"
    role="img"
    :aria-label="`Reasoning diagram: ${layout.nodes.length} thought nodes on branching, partly unresolved paths`"
  >
    <!-- One uniform fit of the grown tree into the shared canvas, so every
         project's visual occupies the same frame as the other three. -->
    <g :transform="layout.transform">
    <!-- Thought paths. The base stroke draws in on scrub; the travelling
         signal is the same packet primitive as everywhere else, but running
         on each path's own irregular period. -->
    <g class="paths">
      <g
        v-for="path in layout.paths"
        :key="path.id"
        class="path-group"
        :class="{ fades: path.fades }"
        :style="path.style"
      >
        <path class="trace" :d="path.d" pathLength="100" />
        <path class="signal" :d="path.d" pathLength="100" />
      </g>
    </g>

    <!-- Nodes fire out of step with each other and with the paths. -->
    <g class="nodes">
      <circle
        v-for="node in layout.nodes"
        :key="node.id"
        class="thought"
        :cx="node.x"
        :cy="node.y"
        :r="node.r"
        :style="node.style"
      />
    </g>

    <!-- The root. The one fixed point the wandering starts from. -->
    <circle class="root" :cx="layout.root.x" :cy="layout.root.y" r="5" />
    <circle class="root-halo" :cx="layout.root.x" :cy="layout.root.y" r="5" />
    </g>
  </svg>
</template>

<style scoped>
.reasoning {
  display: block;
  width: 100%;
  height: auto;
}

/* ── scrub ─────────────────────────────────────────────────────────────────
   Paths are grouped by depth, so the tree grows outward from the root as the
   section is read rather than appearing all at once. */
.path-group,
.thought {
  --local: clamp(0, calc((var(--scrub, 1) - var(--t0)) * var(--inv-span)), 1);
}

/* ── paths ─────────────────────────────────────────────────────────────── */

.trace {
  stroke: var(--edge);
  stroke-width: 1;
  fill: none;
  vector-effect: non-scaling-stroke;
  stroke-dasharray: 100;
  stroke-dashoffset: calc((1 - var(--local)) * 100);
}

/* A path that trails off is dotted and faint, rather than masked by a
   gradient: an SVG mask forces the whole group through an offscreen buffer on
   every frame of the signal animation, which is real main-thread cost for a
   softer edge nobody is looking closely at. */
.path-group.fades .trace {
  stroke-dasharray: 2 3;
  opacity: 0.55;
}

/* The travelling signal. Same zero-length-dash dot as the system graph, but
   every path runs on its own delay and its own period, so the firing never
   settles into a rhythm. `alternate` makes a signal run out and come back
   instead of looping cleanly — a thought revisited rather than a packet
   delivered. */
.signal {
  stroke: var(--packet);
  stroke-width: 3;
  stroke-linecap: round;
  fill: none;
  stroke-dasharray: 0.01 100;
  stroke-dashoffset: 100;
  opacity: calc(var(--local) * 0.9);
  animation: wander var(--fire-duration) ease-in-out var(--fire-delay) infinite alternate;
}

@keyframes wander {
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 0; }
}

/* A path that trails off never completes its run — the signal stops partway
   and returns, which is what "and then the thought went nowhere" looks like. */
.path-group.fades .signal {
  animation-name: wander-partial;
  stroke-width: 2.6;
}

@keyframes wander-partial {
  from { stroke-dashoffset: 100; }
  to { stroke-dashoffset: 46; }
}

/* ── nodes ─────────────────────────────────────────────────────────────── */

.thought {
  fill: var(--bg);
  stroke: var(--node);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
  opacity: var(--local);
  transform-box: fill-box;
  transform-origin: center;
  animation: fire var(--fire-duration) ease-in-out var(--fire-delay) infinite;
}

/* Firing is a fill flash, not a scale pop — it stays off the layout path and
   matches the graph's active-node treatment. */
@keyframes fire {
  0%, 62%, 100% { fill: var(--bg); stroke: var(--node); }
  70%, 84% { fill: var(--node-active); stroke: var(--node-active); }
}

.root {
  fill: var(--node-active);
}

.root-halo {
  fill: none;
  stroke: var(--node-active);
  stroke-width: 1;
  transform-box: fill-box;
  transform-origin: center;
  animation: root-breathe 3.6s ease-in-out infinite;
}

/* The one steady pulse in the whole visual — the thing doing the thinking. */
@keyframes root-breathe {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(2.2); opacity: 0; }
}

@media (max-width: 639px) {
  /* Phone: the outermost branches are the smallest and the first to become
     illegible, so the tree is pruned to its readable depth rather than being
     drawn at a size nobody can follow. */
  .path-group:nth-child(n + 15),
  .thought:nth-child(n + 15) {
    display: none;
  }

  .signal {
    stroke-width: 3.4;
  }
}

/* Static end state: the whole tree drawn, nodes at rest, no firing and no
   travelling signals. The shape of the thinking survives; the motion does not. */
@media (prefers-reduced-motion: reduce) {
  .trace {
    stroke-dashoffset: 0;
  }

  .signal {
    display: none;
  }

  .thought {
    opacity: 1;
    animation: none;
    fill: var(--bg);
  }

  .root-halo {
    animation: none;
    opacity: 0.35;
    transform: scale(1.7);
  }
}
</style>
