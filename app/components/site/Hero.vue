<script setup lang="ts">
import { buildLayout, type GraphItem } from '~/composables/useSystemGraph'

const props = defineProps<{ hook: string; items: GraphItem[] }>()

const { activeIndex } = useSystemState()
const { pulses } = useSignalPulse()

const sentinel = ref<HTMLElement | null>(null)
useHeroSentinel(sentinel)

const { heroPassed } = useSystemState()

/** Draw-in runs once, on first paint. */
const drawing = ref(true)
onMounted(() => {
  // The draw window is data-derived; give it the same budget plus a beat.
  const settle = setTimeout(() => { drawing.value = false }, 2600)
  onUnmounted(() => clearTimeout(settle))
})

const nodeCount = computed(() => props.items.length)

/**
 * The graph area reserves its own size from the server-rendered markup.
 *
 * Both routings are in the DOM (so SSR is correct at either breakpoint and the
 * swap needs no JS), which means neither may be allowed to contribute height —
 * otherwise the taller one lays out first and collapses when the media query
 * hides it, which is a ~0.15 layout shift. Instead the frame owns the height
 * via aspect-ratio, and the bus ratio is inlined per render because bus height
 * is a function of the project count.
 */
const busHeight = computed(() => buildLayout(props.items, 'bus', 'hero').height)
const frameStyle = computed(() => ({
  '--bus-ratio': `360 / ${busHeight.value}`,
  '--radial-ratio': '1000 / 680',
}))
const pad = (n: number) => String(n).padStart(2, '0')

const readoutState = computed(() => {
  if (activeIndex.value === null) return 'idle'
  return props.items[activeIndex.value]?.title ?? 'idle'
})

function jumpTo(index: number) {
  const target = props.items[index]
  if (!target) return
  document.getElementById(`project-${target.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <section id="top" ref="sentinel" class="hero">
    <div class="stage">
      <div class="graph-frame" :style="frameStyle">
        <SiteSystemGraph
          class="graph graph-radial"
          :items="items"
          mode="radial"
          preset="hero"
          labels
          interactive
          :draw="drawing"
          :paused="heroPassed"
          :active="activeIndex"
          :pulses="pulses"
          @select="jumpTo"
        />

        <SiteSystemGraph
          class="graph graph-bus"
          :items="items"
          mode="bus"
          preset="hero"
          labels
          interactive
          :draw="drawing"
          :paused="heroPassed"
          :active="activeIndex"
          :pulses="pulses"
          @select="jumpTo"
        />
      </div>

      <div class="core-content">
        <p class="ident">Shashvat Rajyaguru</p>
        <h1 class="hook">{{ hook }}</h1>
      </div>
    </div>

    <!-- Live readout. Mono earns its place here: aligned numerals, a real
         system reading, not decoration. -->
    <dl class="readout" aria-label="System status">
      <div class="cell">
        <dt>nodes</dt>
        <dd>{{ pad(nodeCount) }}</dd>
      </div>
      <div class="cell">
        <dt>links</dt>
        <dd>{{ pad(nodeCount) }}</dd>
      </div>
      <div class="cell wide">
        <dt>reading</dt>
        <dd>{{ readoutState }}</dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.hero {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-24);
  padding: var(--space-48) var(--space-24) var(--space-24);
  max-width: 1180px;
  margin: 0 auto;
}

.stage {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-24);
}

/* The frame, not the SVGs, owns the height — so the hidden routing can never
   push the page around before the media query resolves. */
.graph-frame {
  position: relative;
  width: 100%;
  aspect-ratio: var(--bus-ratio);
  order: 2;
}

.graph {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: none;
}

/* ── mobile: vertical signal bus, hook above it ────────────────────────── */

.graph-bus {
  display: block;
}

.core-content {
  order: 1;
}

.ident {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--text-tertiary);
  margin: 0 0 var(--space-12);
}

.hook {
  font-family: var(--font-display);
  font-size: clamp(30px, 7.4vw, 44px);
  line-height: 1.12;
  letter-spacing: -0.015em;
  color: var(--text);
  margin: 0;
  text-wrap: balance;
}

.readout {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-16) var(--space-24);
  margin: 0;
  padding-top: var(--space-16);
  border-top: 1px solid var(--border-soft);
  font-family: var(--font-mono);
  font-size: 11px;
}

.cell {
  display: flex;
  align-items: baseline;
  gap: var(--space-8);
  min-width: 0;
}

.cell dt {
  color: var(--text-faint);
  letter-spacing: 0.02em;
}

.cell dd {
  margin: 0;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.cell.wide dd {
  color: var(--accent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── desktop: radial graph, hook inside the core ───────────────────────── */

@media (min-width: 768px) {
  .hero {
    padding: var(--space-48);
  }

  .stage {
    display: block;
    width: min(100%, 1080px);
    margin: 0 auto;
  }

  .graph-frame {
    aspect-ratio: var(--radial-ratio);
  }

  .graph-bus {
    display: none;
  }

  .graph-radial {
    display: block;
  }

  /* Matches the core rect the SVG reserves (46% × 40%, centred), so the
     hook line literally sits at the centre of the system. */
  .core-content {
    position: absolute;
    left: 27%;
    top: 34.5%;
    width: 46%;
    height: 31%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 var(--space-16);
  }

  .hook {
    font-size: clamp(24px, 2.7vw, 40px);
  }

  .ident {
    margin-bottom: var(--space-8);
  }
}

@media (min-width: 1024px) {
  .hero {
    padding: var(--space-48) var(--space-96) var(--space-32);
  }
}

/* Short-and-wide viewports: keep the whole graph on screen. */
@media (min-width: 768px) and (max-height: 820px) {
  .stage {
    width: min(100%, calc((100vh - 220px) * 1000 / 680));
  }
}
</style>
