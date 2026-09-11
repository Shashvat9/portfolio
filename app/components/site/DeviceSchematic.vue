<script setup lang="ts">
/**
 * Procedural assembly schematic — the fallback visual for the scroll-scrubbed
 * build sequence when a project has no uploaded images (which is every project
 * in the database today).
 *
 * It is deliberately diagrammatic, not a mock photograph: an abstract system
 * drawing itself together. Layers are a fixed *library*, but how they are
 * distributed across the scroll is derived entirely from the stage count, so
 * a project with two versions gets the same schematic assembled in two big
 * steps and one with eight gets it in eight fine ones.
 */
const props = defineProps<{ stages: number }>()

/** Ordered assembly layers. Each is revealed as the scrub crosses its share. */
const LAYERS = [
  'substrate',
  'grid',
  'bus',
  'core-block',
  'io-blocks',
  'sensor',
  'signal',
  'shell',
] as const

const layers = computed(() =>
  LAYERS.map((name, i) => {
    // Layers spread evenly across the whole scrub; each fades in over a
    // window one layer wide. Nothing here is tied to a specific stage count —
    // the stage count only sets how long the scroll timeline is.
    const t0 = i / LAYERS.length
    const span = 1 / LAYERS.length
    return { name, t0, invSpan: 1 / span, style: { '--t0': String(t0), '--inv-span': String(1 / span) } as Record<string, string> }
  }),
)

/** Evenly spaced module blocks — count follows the stage count, so a longer
    version history literally builds a denser board. */
const modules = computed(() => {
  const n = Math.min(6, Math.max(2, props.stages))
  return Array.from({ length: n }, (_, i) => ({
    x: 96 + (i % 3) * 74,
    y: 128 + Math.floor(i / 3) * 58,
  }))
})
</script>

<template>
  <svg class="schematic" viewBox="0 0 420 300" fill="none" role="presentation" aria-hidden="true">
    <g v-for="layer in layers" :key="layer.name" class="layer" :class="`l-${layer.name}`" :style="layer.style">
      <template v-if="layer.name === 'substrate'">
        <rect class="draw" x="60" y="70" width="300" height="180" rx="4" path-length="100" />
      </template>

      <template v-else-if="layer.name === 'grid'">
        <g class="hair">
          <path v-for="x in 5" :key="`v${x}`" class="draw" :d="`M${60 + x * 50},76 L${60 + x * 50},244`" path-length="100" />
          <path v-for="y in 2" :key="`h${y}`" class="draw" :d="`M66,${70 + y * 60} L354,${70 + y * 60}`" path-length="100" />
        </g>
      </template>

      <template v-else-if="layer.name === 'bus'">
        <path class="draw trace" d="M60 160 L96 160 L96 118 L210 118" path-length="100" />
        <path class="draw trace" d="M360 190 L300 190 L300 232 L170 232" path-length="100" />
      </template>

      <template v-else-if="layer.name === 'core-block'">
        <rect class="block" x="176" y="140" width="68" height="52" rx="2" />
        <circle class="pin" cx="210" cy="166" r="4" />
      </template>

      <template v-else-if="layer.name === 'io-blocks'">
        <rect v-for="(m, i) in modules" :key="i" class="module" :x="m.x" :y="m.y" width="34" height="24" rx="1.5" />
      </template>

      <template v-else-if="layer.name === 'sensor'">
        <circle class="lens-ring" cx="300" cy="112" r="22" />
        <circle class="lens" cx="300" cy="112" r="10" />
      </template>

      <template v-else-if="layer.name === 'signal'">
        <path class="draw arc" d="M300 84 A 40 40 0 0 1 340 112" path-length="100" />
        <path class="draw arc" d="M300 70 A 56 56 0 0 1 354 112" path-length="100" />
      </template>

      <template v-else>
        <rect class="draw shell" x="40" y="50" width="340" height="220" rx="10" path-length="100" />
      </template>
    </g>
  </svg>
</template>

<style scoped>
.schematic {
  display: block;
  width: 100%;
  height: auto;
}

/* Per-layer progress, derived from the container's --scrub. Registered as a
   number in main.css so calc() on it is well-defined. */
.layer {
  --local: clamp(0, calc((var(--scrub, 1) - var(--t0)) * var(--inv-span)), 1);
  opacity: var(--local);
  transform: translateY(calc((1 - var(--local)) * 5px));
}

/* Stroked layers draw themselves in as the scrub passes — the same
   pathLength/dashoffset primitive the hero graph uses. */
.draw {
  stroke: var(--edge);
  stroke-width: 1;
  fill: none;
  vector-effect: non-scaling-stroke;
  stroke-dasharray: 100;
  stroke-dashoffset: calc((1 - var(--local)) * 100);
}

.hair .draw {
  stroke: var(--grid);
}

.trace,
.arc {
  stroke: var(--edge-active);
  opacity: 0.6;
}

.shell {
  stroke: var(--core-line);
  stroke-dasharray: 100;
}

.block {
  fill: var(--surface);
  stroke: var(--node);
  stroke-width: 1;
}

.module {
  fill: none;
  stroke: var(--node);
  stroke-width: 1;
  opacity: 0.75;
}

.pin {
  fill: var(--node-active);
}

.lens-ring {
  fill: none;
  stroke: var(--node);
  stroke-width: 1;
}

.lens {
  fill: var(--node-active);
  opacity: 0.85;
}

@media (prefers-reduced-motion: reduce) {
  .layer {
    opacity: 1;
    transform: none;
  }

  .draw {
    stroke-dashoffset: 0;
  }
}
</style>
