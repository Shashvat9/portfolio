<script setup lang="ts">
/**
 * The one graph renderer. Used at hero scale and as the pinned mini graph —
 * same component, same CSS, so the two are guaranteed to speak the same
 * visual language rather than merely resembling each other.
 *
 * Every animation is a stroked path with pathLength="100" driven by
 * stroke-dashoffset:
 *   · draw-in      — dasharray 100, offset 100 → 0
 *   · packet flow  — dasharray 0.01/gap, offset looping by one gap
 *   · hover pulse  — dasharray 0.01/100, offset 100 → 0, one shot
 * All of it is CSS. No JS runs per frame for the idle "living" state.
 */
import { buildLayout, edgeDrawDelay, edgeDrawDuration, packetPeriod, packetsPerEdge, PATH_UNITS, type GraphItem } from '~/composables/useSystemGraph'

const props = withDefaults(
  defineProps<{
    items: GraphItem[]
    mode?: 'radial' | 'bus'
    preset?: 'hero' | 'mini'
    /** Show node title labels (hero radial / mobile bus only). */
    labels?: boolean
    /** Play the draw-in animation on mount. */
    draw?: boolean
    /** Node index currently being read, if any. */
    active?: number | null
    /** Per-project one-shot pulse counters, keyed by project id. */
    pulses?: Record<string, number>
    /** Emitted when a node is activated, so the graph can be used to navigate. */
    interactive?: boolean
    /** Halts the idle animation while this graph is off-screen. */
    paused?: boolean
  }>(),
  { mode: 'radial', preset: 'hero', labels: false, draw: false, active: null, pulses: () => ({}), interactive: false, paused: false },
)

const emit = defineEmits<{ select: [index: number] }>()

const layout = computed(() => buildLayout(props.items, props.mode, props.preset))
const count = computed(() => layout.value.nodes.length)
const perEdge = computed(() => packetsPerEdge(count.value))

/** Dash gap between packets on one edge — spacing follows packet count. */
const packetGap = computed(() => PATH_UNITS / perEdge.value)

function edgeStyle(index: number, length: number) {
  return {
    '--draw-delay': `${edgeDrawDelay(index, count.value)}s`,
    '--draw-duration': `${edgeDrawDuration()}s`,
    '--flow-duration': `${packetPeriod(length, props.preset) * perEdge.value}s`,
    '--flow-gap': String(packetGap.value),
    // Stagger the flow so packets don't leave every edge in lockstep.
    '--flow-delay': `${-(index * 0.37) % 2}s`,
  } as Record<string, string>
}

function nodeStyle(index: number) {
  // Pulse phase spread across the node set — no two nodes breathe together.
  return {
    '--pulse-delay': `${(index / Math.max(1, count.value)) * 2.8}s`,
    '--appear-delay': `${edgeDrawDelay(index, count.value) + edgeDrawDuration() * 0.55}s`,
  } as Record<string, string>
}

/**
 * Hover pulses. Each bump of a project's counter renders a fresh one-shot
 * packet element (keyed by the counter) which removes itself when its
 * animation ends — so repeated hovers retrigger cleanly.
 */
const livePulses = ref<{ key: string; id: string; d: string; duration: number }[]>([])

watch(
  () => props.pulses,
  (next, prev) => {
    for (const [id, seq] of Object.entries(next ?? {})) {
      if ((prev?.[id] ?? 0) === seq) continue
      const edge = layout.value.edges.find((e) => e.id === id)
      if (!edge) continue
      livePulses.value = [
        ...livePulses.value,
        { key: `${id}-${seq}`, id, d: edge.d, duration: packetPeriod(edge.length, props.preset) * 0.8 },
      ]
    }
  },
  { deep: true },
)

function dropPulse(key: string) {
  livePulses.value = livePulses.value.filter((p) => p.key !== key)
}

const gridId = useId()
</script>

<template>
  <svg
    class="system-graph"
    :class="[`is-${layout.mode}`, `preset-${preset}`, { 'is-drawing': draw, 'is-paused': paused }]"
    :viewBox="layout.viewBox"
    fill="none"
    role="img"
    :aria-label="`System graph: ${count} project ${count === 1 ? 'node' : 'nodes'} connected to a central core`"
  >
    <defs>
      <pattern :id="gridId" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M40 0 L0 0 0 40" stroke="var(--grid)" stroke-width="1" fill="none" />
      </pattern>
    </defs>

    <!-- Field grid: gives the graph a substrate to sit on rather than floating. -->
    <rect v-if="preset === 'hero'" class="field" width="100%" height="100%" :fill="`url(#${gridId})`" />

    <!-- Core boundary. Edges terminate here, not at a point, so the hook line
         inside it reads as the centre of the system. -->
    <g class="core">
      <!-- The hook line sits inside this box on desktop, so the core is drawn
           as a region. Everywhere else the core is just a point. -->
      <rect
        v-if="mode === 'radial' && preset === 'hero'"
        :x="layout.core.x" :y="layout.core.y"
        :width="layout.core.w" :height="layout.core.h"
        :rx="layout.core.r"
        class="core-box"
      />
      <circle v-else :cx="layout.core.cx" :cy="layout.core.cy" :r="preset === 'mini' ? 3.2 : 4.5" class="core-dot" />
    </g>

    <!-- Orbit ring: adjacent nodes are also linked to each other, so the
         graph reads as a mesh under load rather than four lone spokes. -->
    <g v-if="layout.ring.length" class="ring">
      <g
        v-for="arc in layout.ring"
        :key="arc.id"
        class="ring-group"
        :style="edgeStyle(arc.index, arc.length)"
      >
        <path class="ring-edge" :d="arc.d" :path-length="PATH_UNITS" />
        <path class="ring-flow" :d="arc.d" :path-length="PATH_UNITS" />
      </g>
    </g>

    <g class="edges">
      <g
        v-for="edge in layout.edges"
        :key="edge.id"
        class="edge-group"
        :class="{ 'is-active': active === edge.index }"
        :style="edgeStyle(edge.index, edge.length)"
      >
        <!-- base line (draw-in) -->
        <path class="edge" :d="edge.d" :path-length="PATH_UNITS" />
        <!-- continuous packet flow -->
        <path class="flow" :d="edge.d" :path-length="PATH_UNITS" />
      </g>
    </g>

    <!-- One-shot hover signal pulses, same primitive as the flow above. -->
    <g class="pulses">
      <path
        v-for="p in livePulses"
        :key="p.key"
        class="pulse"
        :d="p.d"
        :path-length="PATH_UNITS"
        :style="{ '--pulse-duration': `${p.duration}s` }"
        @animationend="dropPulse(p.key)"
      />
    </g>

    <g class="nodes">
      <g
        v-for="node in layout.nodes"
        :key="node.id"
        class="node-group"
        :class="{ 'is-active': active === node.index, 'is-interactive': interactive }"
        :style="nodeStyle(node.index)"
        :tabindex="interactive ? 0 : undefined"
        :role="interactive ? 'button' : undefined"
        :aria-label="interactive ? `Jump to ${node.title}` : undefined"
        @click="interactive && emit('select', node.index)"
        @keydown.enter.prevent="interactive && emit('select', node.index)"
        @keydown.space.prevent="interactive && emit('select', node.index)"
      >
        <circle class="halo" :cx="node.x" :cy="node.y" :r="layout.nodeRadius" />
        <circle class="dot" :cx="node.x" :cy="node.y" :r="layout.nodeRadius" />
        <title v-if="!interactive">{{ node.title }}</title>
        <text
          v-if="labels"
          class="node-label"
          :x="node.labelX"
          :y="node.labelY"
          :text-anchor="node.anchor"
        >{{ node.label }}</text>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.system-graph {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.field {
  opacity: 0.55;
}

.core-box {
  fill: none;
  stroke: var(--core-line);
  stroke-width: 1;
  stroke-dasharray: 2 4;
  opacity: 0.75;
}

.preset-mini .core-box {
  stroke-dasharray: none;
}

.core-dot {
  fill: var(--node-active);
}

/* ── edges ─────────────────────────────────────────────────────────────── */

.edge {
  stroke: var(--edge);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
}

.preset-mini .edge {
  stroke-width: 1;
}

/* Draw-in: the graph builds itself on load, staggered across the edge set. */
.is-drawing .edge {
  stroke-dasharray: 100;
  stroke-dashoffset: 100;
  animation: draw-in var(--draw-duration) ease-out var(--draw-delay) forwards;
}

@keyframes draw-in {
  to { stroke-dashoffset: 0; }
}

/* Packets. A zero-length dash with a round cap renders as a travelling dot;
   offsetting by exactly one gap per cycle makes the loop seamless. */
.flow {
  stroke: var(--packet);
  stroke-width: 3.5;
  stroke-linecap: round;
  stroke-dasharray: 0.01 var(--flow-gap);
  animation: flow var(--flow-duration) linear var(--flow-delay) infinite;
  opacity: 0.8;
}

.preset-mini .flow {
  stroke-width: 3;
}

@keyframes flow {
  from { stroke-dashoffset: 0; }
  to { stroke-dashoffset: calc(var(--flow-gap) * -1); }
}

/* Flow waits for its own edge to finish drawing. */
.is-drawing .flow {
  opacity: 0;
  animation:
    flow var(--flow-duration) linear var(--flow-delay) infinite,
    fade-in 0.5s ease-out calc(var(--draw-delay) + var(--draw-duration)) forwards;
}

@keyframes fade-in {
  to { opacity: 0.8; }
}

.edge-group.is-active .edge {
  stroke: var(--edge-active);
  opacity: 0.55;
}

.edge-group.is-active .flow {
  stroke-width: 4.5;
  opacity: 1;
}

/* Ring: fainter than the spokes, and its packets drift the other way, so the
   two routes read as distinct traffic on one system. */
.ring-edge {
  stroke: var(--edge);
  stroke-width: 1;
  opacity: 0.45;
  vector-effect: non-scaling-stroke;
}

.is-drawing .ring-edge {
  opacity: 0;
  animation: ring-in 0.7s ease-out calc(var(--draw-delay) + var(--draw-duration) * 0.6) forwards;
}

@keyframes ring-in {
  to { opacity: 0.45; }
}

.ring-flow {
  stroke: var(--packet);
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-dasharray: 0.01 var(--flow-gap);
  opacity: 0.4;
  animation: ring-flow calc(var(--flow-duration) * 1.7) linear var(--flow-delay) infinite;
}

@keyframes ring-flow {
  from { stroke-dashoffset: calc(var(--flow-gap) * -1); }
  to { stroke-dashoffset: 0; }
}

.is-drawing .ring-flow {
  opacity: 0;
  animation:
    ring-flow calc(var(--flow-duration) * 1.7) linear var(--flow-delay) infinite,
    ring-flow-in 0.6s ease-out calc(var(--draw-delay) + var(--draw-duration)) forwards;
}

@keyframes ring-flow-in {
  to { opacity: 0.4; }
}

/* ── hover signal pulse ────────────────────────────────────────────────── */

.pulse {
  stroke: var(--packet);
  stroke-width: 5;
  stroke-linecap: round;
  stroke-dasharray: 0.01 100;
  stroke-dashoffset: 100;
  animation: pulse-travel var(--pulse-duration) cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes pulse-travel {
  from { stroke-dashoffset: 100; opacity: 1; }
  to { stroke-dashoffset: 0; opacity: 0.15; }
}

/* ── nodes ─────────────────────────────────────────────────────────────── */

.dot {
  fill: var(--bg);
  stroke: var(--node);
  stroke-width: 1.5;
  transition: fill 0.3s ease, stroke 0.3s ease;
}

/* Gentle idle breathing — transform/opacity only, so it stays off the
   layout and paint path. */
.halo {
  fill: none;
  stroke: var(--node);
  stroke-width: 1;
  transform-box: fill-box;
  transform-origin: center;
  animation: breathe 3.6s ease-in-out var(--pulse-delay) infinite;
}

@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 0.35; }
  50% { transform: scale(2.1); opacity: 0; }
}

.is-drawing .node-group {
  opacity: 0;
  animation: node-appear 0.45s ease-out var(--appear-delay) forwards;
}

@keyframes node-appear {
  from { opacity: 0; }
  to { opacity: 1; }
}

.node-group.is-active .dot {
  fill: var(--node-active);
  stroke: var(--node-active);
}

.node-group.is-active .halo {
  stroke: var(--node-active);
  animation-duration: 1.6s;
}

.node-group.is-interactive {
  cursor: pointer;
}

.node-group.is-interactive:hover .dot,
.node-group.is-interactive:focus-visible .dot {
  fill: var(--node-active);
  stroke: var(--node-active);
}

.node-group:focus {
  outline: none;
}

.node-group:focus-visible .halo {
  stroke: var(--accent);
  stroke-width: 2;
  animation: none;
  transform: scale(2.2);
  opacity: 1;
}

.node-label {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.01em;
  fill: var(--text-secondary);
  transition: fill 0.3s ease;
}

.is-bus .node-label {
  font-size: 12px;
}

.node-group.is-active .node-label {
  fill: var(--text);
}

/* Off-screen graphs stop animating. A continuously repainting graph you can't
   see is pure main-thread cost — this is what keeps the "everything is always
   alive" look from being charged for twice over. */
.is-paused .flow,
.is-paused .ring-flow,
.is-paused .halo,
.is-paused .edge {
  animation-play-state: paused;
}

/* ── static fallback ───────────────────────────────────────────────────────
   Not a slower animation — the graph simply resolves to its finished state:
   edges fully drawn, nodes at rest, packets removed from the render tree. */
@media (prefers-reduced-motion: reduce) {
  .edge,
  .is-drawing .edge {
    stroke-dasharray: none;
    stroke-dashoffset: 0;
    animation: none;
  }

  .flow,
  .is-drawing .flow,
  .ring-flow,
  .is-drawing .ring-flow,
  .pulse {
    display: none;
  }

  .ring-edge,
  .is-drawing .ring-edge {
    opacity: 0.35;
    animation: none;
  }

  .halo {
    animation: none;
    opacity: 0.28;
    transform: scale(1.7);
  }

  .is-drawing .node-group {
    opacity: 1;
    animation: none;
  }

  .node-group.is-active .halo {
    stroke: var(--node-active);
    opacity: 0.5;
  }
}
</style>
