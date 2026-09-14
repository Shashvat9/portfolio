<script setup lang="ts">
/**
 * The scroll-scrubbed stage that sits inside every project section.
 *
 * Before Stage 9 this only appeared for projects carrying a version history or
 * uploaded images, which is why three of the four sections were static. Now
 * every project gets a visual, chosen by its `visual` kind (see
 * utils/visual.ts) — but which visual, and how long its scroll runs, is still
 * entirely a function of the live data:
 *
 *   · kind             = projects.visual, or derived from the project's tags
 *   · timeline length  = stage count × a per-stage scroll budget
 *   · stage count      = version/image count, or the visual's own element count
 *   · tile thresholds  = index / version count
 *   · frame thresholds = index / (loadable) image count
 *
 * Uploaded images still win over any generated visual — a real photograph of
 * the thing beats a diagram of it. Images that fail to load drop out and the
 * remaining frames re-time, so a deleted file degrades to a shorter sequence
 * rather than a blank frame.
 */
import type { Database } from '~/types/database.types'
import type { VisualKind } from '~/utils/visual'
import { visualStageCount } from '~/composables/useProjectVisual'

type Version = Database['public']['Tables']['project_versions']['Row']

const props = defineProps<{
  versions: Version[]
  images: { id: string; url: string }[]
  title: string
  kind: VisualKind
  /** Stable per-project seed for the generated geometry. Never the title. */
  projectKey: string
  /** Live tag text — detection classes, pipeline stage names. */
  labels: string[]
}>()

const failed = ref<Set<string>>(new Set())
const usableImages = computed(() => props.images.filter((img) => !failed.value.has(img.id)))

function onImageError(id: string) {
  failed.value = new Set(failed.value).add(id)
}

/** Steps the generated visual has, when no images are driving the sequence. */
const generatedStages = computed(() => visualStageCount(props.kind, props.labels.length))

/** Total scrub stages — the longest track wins, minimum one. */
const stages = computed(() =>
  Math.max(props.versions.length, usableImages.value.length, generatedStages.value, 1),
)

/** Scroll budget grows with the stage count so every stage gets equal travel.
    The track is one viewport of lead-in plus one slice per stage; the scrub
    driver then maps (height − viewport) onto 0→1, so timing redistributes
    automatically when a version, image or tag is added or removed. */
const SVH_PER_STAGE = 55
const trackStyle = computed(() => {
  const height = `calc(100svh + ${stages.value * SVH_PER_STAGE}svh)`
  // Same value drives min-height and contain-intrinsic-size, so a section that
  // has not been rendered yet still reserves its true height.
  return { minHeight: height, '--track-height': height }
})

function window_(index: number, count: number) {
  const t0 = count <= 1 ? 0 : index / count
  const span = count <= 1 ? 1 : 1 / count
  return { '--t0': t0.toFixed(4), '--inv-span': (1 / span).toFixed(4) } as Record<string, string>
}

const tileStyles = computed(() => props.versions.map((_, i) => window_(i, props.versions.length)))
const frameStyles = computed(() => usableImages.value.map((_, i) => window_(i, usableImages.value.length)))

const track = ref<HTMLElement | null>(null)
// No overshoot: the track's own height already encodes the stage budget.
useScrollScrub(track)

/** Idle animation inside this section stops while the section is off-screen. */
const paused = useOffscreenPause(track)
</script>

<template>
  <div ref="track" class="sequence" :class="{ 'is-paused': paused }" :style="trackStyle">
    <div class="sticky">
      <div class="stage">
        <!-- Image-driven frames when the project has them… -->
        <div v-if="usableImages.length" class="frames">
          <img
            v-for="(img, i) in usableImages"
            :key="img.id"
            class="frame"
            :src="img.url"
            :alt="`${title} — stage ${i + 1} of ${usableImages.length}`"
            :style="frameStyles[i]"
            loading="lazy"
            decoding="async"
            @error="onImageError(img.id)"
          />
        </div>

        <!-- …otherwise the system draws itself, in whichever language this
             project speaks. Same stroke weights, same packet grammar, same
             accent across all four — only the behaviour differs. -->
        <SiteDetectionFrame
          v-else-if="kind === 'detection'"
          :project-key="projectKey"
          :labels="labels"
        />
        <SitePipelineFlow v-else-if="kind === 'pipeline'" :labels="labels" />
        <SiteReasoningWeb
          v-else-if="kind === 'reasoning'"
          :project-key="projectKey"
          :tag-count="labels.length"
        />
        <SiteDeviceSchematic v-else :stages="stages" />
      </div>

      <ol v-if="versions.length" class="tiles">
        <li
          v-for="(v, i) in versions"
          :key="v.id"
          class="tile"
          :class="{ 'in-progress': v.status === 'in_progress' }"
          :style="tileStyles[i]"
        >
          <span class="marker" />
          <p class="label">{{ v.label }}</p>
          <p class="sublabel">{{ v.sublabel }}</p>
          <p class="description">{{ v.description }}</p>
        </li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.sequence {
  --scrub: 1;
  position: relative;
  margin-top: var(--space-24);
}

.sticky {
  position: sticky;
  top: 0;
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--space-24);
  padding: var(--space-48) 0;
}

.stage {
  position: relative;
  width: 100%;
  max-width: 460px;
  margin: 0 auto;
}

.frames {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
}

.frame {
  --local: clamp(0, calc((var(--scrub) - var(--t0)) * var(--inv-span)), 1);
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  /* Opacity + transform only — no layout work per frame. */
  opacity: var(--local);
  transform: scale(calc(0.985 + var(--local) * 0.015));
  border: 1px solid var(--border-soft);
}

.tiles {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-12);
  margin: 0;
  padding: 0;
}

.tile {
  --local: clamp(0, calc((var(--scrub) - var(--t0)) * var(--inv-span)), 1);
  flex: 1 1 150px;
  min-width: 132px;
  padding: var(--space-12);
  border: 1px solid var(--border-soft);
  background: var(--surface);
  /* Un-reached stages sit back rather than disappearing, so the row always
     reads as a complete progression. */
  opacity: calc(0.32 + var(--local) * 0.68);
  transform: translateY(calc((1 - var(--local)) * 8px));
}

.tile.in-progress {
  border-style: dashed;
  border-color: var(--border-dash);
  background: transparent;
}

.marker {
  display: block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  margin-bottom: var(--space-8);
  transform: scale(calc(0.6 + var(--local) * 0.4));
}

.tile.in-progress .marker {
  background: transparent;
  border: 1px dotted var(--accent);
}

.label {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--accent);
  margin: 0 0 var(--space-4);
  font-variant-numeric: tabular-nums;
}

.sublabel {
  font-size: 14px;
  color: var(--text);
  margin: 0 0 var(--space-8);
}

.description {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-secondary);
  margin: 0;
}

@media (min-width: 768px) {
  .stage {
    max-width: 520px;
  }
}

/* Off-screen sections stop animating. Named selectors rather than `:deep(*)`:
   a universal descendant selector makes the browser re-match every element in
   the subtree each time the class flips. */
.sequence.is-paused :deep(.flow),
.sequence.is-paused :deep(.signal),
.sequence.is-paused :deep(.thought),
.sequence.is-paused :deep(.root-halo) {
  animation-play-state: paused;
}

/* The decisive one for load cost. Each section's scrubbed track is several
   viewports tall and all four are in the DOM from the first paint, so the
   browser was styling, laying out and starting animations for ~100 SVG
   elements nobody could see yet. `content-visibility: auto` lets it skip that
   work until the section is near the viewport.

   `contain-intrinsic-size: auto <height>` is what keeps this free of layout
   shift: the track's height is already known (it is the scroll budget, set
   inline from the stage count), so a skipped section still reserves exactly
   the space it will occupy, and `auto` makes the browser remember the real
   size once rendered. Sticky scrubbing inside is unaffected — the sticky
   child still positions against the viewport, not against this element. */
.sequence {
  content-visibility: auto;
  contain-intrinsic-size: auto var(--track-height);
}

/* Static fallback: no sticky scrubbing at all. The sequence collapses to its
   finished state — visual fully drawn, last frame shown, every tile lit. */
@media (prefers-reduced-motion: reduce) {
  .sequence {
    --scrub: 1;
    min-height: 0 !important;
  }

  .sticky {
    position: static;
    min-height: 0;
    padding: var(--space-24) 0;
  }

  .frames {
    aspect-ratio: auto;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-12);
  }

  .frame {
    position: static;
    inset: auto;
    width: auto;
    max-width: 220px;
    height: auto;
    opacity: 1;
    transform: none;
  }

  .tile {
    opacity: 1;
    transform: none;
  }

  .marker {
    transform: none;
  }
}
</style>
