<script setup lang="ts">
/**
 * Pinned "you are here" indicator. Takes over once the hero graph scrolls
 * away, showing the same topology at small scale — and it is the same
 * component, so node layout, packet flow and pulse rendering are identical
 * by construction rather than by resemblance.
 */
import type { GraphItem } from '~/composables/useSystemGraph'

const props = defineProps<{ items: GraphItem[] }>()

const { activeIndex, heroPassed } = useSystemState()
const { pulses } = useSignalPulse()

const activeTitle = computed(() =>
  activeIndex.value === null ? null : (props.items[activeIndex.value]?.title ?? null),
)

function jumpTo(index: number) {
  const target = props.items[index]
  if (!target) return
  document.getElementById(`project-${target.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <!-- While the hero graph is still on screen this panel is hidden, so it must
       also leave the tab order — an aria-hidden container holding focusable
       nodes is a real trap, not just an audit warning. -->
  <aside v-if="items.length" class="mini" :class="{ visible: heroPassed }" :aria-hidden="!heroPassed" :inert="!heroPassed">
    <SiteSystemGraph
      :items="items"
      mode="radial"
      preset="mini"
      :active="activeIndex"
      :pulses="pulses"
      :interactive="heroPassed"
      :paused="!heroPassed"
      @select="jumpTo"
    />
    <p class="caption">
      <span class="key">reading</span>
      <span class="value">{{ activeTitle ?? '—' }}</span>
    </p>
  </aside>
</template>

<style scoped>
.mini {
  position: fixed;
  z-index: 40;
  left: var(--space-16);
  bottom: var(--space-16);
  width: 132px;
  padding: var(--space-8);
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  border: 1px solid var(--border-soft);
  backdrop-filter: blur(6px);
  /* Transform + opacity only — the pin never triggers layout. */
  opacity: 0;
  transform: translateY(12px) scale(0.96);
  transition: opacity 0.35s ease, transform 0.35s ease;
  pointer-events: none;
}

.mini.visible {
  opacity: 1;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}

.caption {
  margin: var(--space-8) 0 0;
  font-family: var(--font-mono);
  font-size: 9px;
  line-height: 1.4;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.key {
  color: var(--text-faint);
}

.value {
  color: var(--accent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* On phones the pin shrinks to a bare status chip — a 132px panel would eat
   a third of the reading column. */
@media (max-width: 767px) {
  .mini {
    left: auto;
    right: var(--space-12);
    bottom: var(--space-12);
    width: 64px;
    padding: var(--space-4);
  }

  .caption .key {
    display: none;
  }

  .caption {
    font-size: 8px;
    margin-top: var(--space-4);
  }
}

@media (min-width: 1280px) {
  .mini {
    left: var(--space-24);
    bottom: var(--space-24);
    width: 148px;
  }
}
</style>
