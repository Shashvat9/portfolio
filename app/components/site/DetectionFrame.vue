<script setup lang="ts">
/**
 * Detection visual — what the model literally does.
 *
 * A schematic aerial scene, over which bounding boxes resolve one at a time as
 * the section is scrolled, each carrying a class label and a confidence. Boxes
 * appear progressively rather than together: that sequencing *is* the subject,
 * so a single fade-in of all of them would say nothing.
 *
 * The class labels are the project's own tags, pulled live — so this is the
 * project's real content being detected, not invented class names. The
 * confidence figures are illustrative, part of a line drawing rather than a
 * readout: there is no photograph here and nothing claims to be model output.
 *
 * Vocabulary is shared with the Stage 8 system layer: 1px `--edge` strokes
 * with non-scaling-stroke, the pathLength/dashoffset draw primitive, `--packet`
 * for the live element, mono + tabular numerals for readouts.
 */
import { buildDetection, VISUAL_VIEWBOX } from '~/composables/useProjectVisual'

const props = defineProps<{ projectKey: string; labels: string[] }>()

const layout = computed(() => buildDetection(props.projectKey, props.labels))
const vb = VISUAL_VIEWBOX
const gridId = useId()
</script>

<template>
  <svg
    class="detection"
    :viewBox="`0 0 ${vb.width} ${vb.height}`"
    fill="none"
    role="img"
    :aria-label="`Detection diagram: ${layout.count} bounding boxes resolving onto an aerial scene`"
  >
    <defs>
      <pattern :id="gridId" width="42" height="42" patternUnits="userSpaceOnUse">
        <path d="M42 0 L0 0 0 42" stroke="var(--grid)" stroke-width="1" fill="none" />
      </pattern>
    </defs>

    <!-- Frame + substrate. The same grid field the hero graph sits on. -->
    <rect class="field" width="100%" height="100%" :fill="`url(#${gridId})`" />
    <rect class="frame" x="0.5" y="0.5" :width="vb.width - 1" :height="vb.height - 1" />

    <!-- The scene being looked at: abstract ground features, drawn faint so
         the detections stay the subject. -->
    <g class="scene">
      <path
        v-for="f in layout.features"
        :key="f.id"
        :class="f.kind"
        :d="f.d"
      />
    </g>

    <!-- Sensor readout, top-left, in the system's instrument voice. -->
    <g class="readout" aria-hidden="true">
      <text class="readout-key" x="10" y="18">detections</text>
      <text class="readout-value" x="84" y="18">{{ String(layout.count).padStart(2, '0') }}</text>
    </g>

    <!-- Boxes. Corner brackets rather than closed rectangles — it reads as an
         overlay on a scene instead of a drawn shape in it. -->
    <g class="boxes">
      <g v-for="box in layout.boxes" :key="box.id" class="box" :style="box.style">
        <path
          class="bracket"
          :d="`M${box.x},${box.y + box.h * 0.3} L${box.x},${box.y} L${box.x + box.w * 0.3},${box.y}
               M${box.x + box.w * 0.7},${box.y} L${box.x + box.w},${box.y} L${box.x + box.w},${box.y + box.h * 0.3}
               M${box.x + box.w},${box.y + box.h * 0.7} L${box.x + box.w},${box.y + box.h} L${box.x + box.w * 0.7},${box.y + box.h}
               M${box.x + box.w * 0.3},${box.y + box.h} L${box.x},${box.y + box.h} L${box.x},${box.y + box.h * 0.7}`"
          pathLength="100"
        />
        <!-- Label plate sits above its box, or below when that slot is taken
             by another plate (the layout resolves the collisions). Class and
             confidence share one <text> so the confidence flows after the
             label natively — no measured offsets that drift when the label
             text or the font size changes. -->
        <text
          class="plate"
          :x="box.labelX"
          :y="box.labelY"
          :text-anchor="box.anchor"
        >{{ box.label }} <tspan class="confidence">{{ box.confidence }}</tspan></text>
      </g>
    </g>
  </svg>
</template>

<style scoped>
.detection {
  display: block;
  width: 100%;
  height: auto;
}

.field {
  opacity: 0.5;
}

.frame {
  fill: none;
  stroke: var(--core-line);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  opacity: 0.7;
}

/* ── scene ─────────────────────────────────────────────────────────────── */

.road {
  fill: none;
  stroke: var(--edge);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  opacity: 0.55;
}

.block {
  fill: none;
  stroke: var(--edge);
  stroke-width: 1;
  vector-effect: non-scaling-stroke;
  opacity: 0.32;
}

/* ── readout ───────────────────────────────────────────────────────────── */

.readout-key,
.readout-value {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.04em;
}

.readout-key {
  fill: var(--text-faint);
}

.readout-value {
  fill: var(--accent);
  font-variant-numeric: tabular-nums;
}

/* ── boxes ─────────────────────────────────────────────────────────────────
   Each box owns a slice of the scroll. `--local` is the same clamp every
   scrubbed element in the site uses, off the container's `--scrub`. */

.box {
  --local: clamp(0, calc((var(--scrub, 1) - var(--t0)) * var(--inv-span)), 1);
}

/* The bracket draws itself in — the Stage 8 pathLength primitive, unchanged. */
.bracket {
  stroke: var(--node-active);
  stroke-width: 1.5;
  vector-effect: non-scaling-stroke;
  fill: none;
  stroke-dasharray: 100;
  stroke-dashoffset: calc((1 - var(--local)) * 100);
  /* A box that has just resolved sits at full strength; earlier ones settle
     back so the most recent detection reads as the live one. */
  opacity: calc(0.45 + var(--local) * 0.55);
}

/* The label plate follows its box, appearing only once the box has mostly
   drawn — a confidence figure before there is a detection is nonsense. */
.plate {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.02em;
  fill: var(--text-secondary);
  opacity: clamp(0, calc((var(--local) - 0.55) * 2.4), 1);
}

.confidence {
  fill: var(--accent);
  font-variant-numeric: tabular-nums;
}

/* Phone: the scene is the same, but a 420-wide canvas at 340px makes nine
   boxes and their labels illegible. The later (smaller) detections drop out
   and the remaining labels scale up — a considered reduction, not a squeeze. */
@media (max-width: 639px) {
  .box:nth-child(n + 6) {
    display: none;
  }

  .plate {
    font-size: 11px;
  }

  .readout-key,
  .readout-value {
    font-size: 11px;
  }

  .bracket {
    stroke-width: 2;
  }
}

/* Static end state: every box fully drawn, every label present, nothing in
   motion. The diagram still communicates — it just does not perform. */
@media (prefers-reduced-motion: reduce) {
  .bracket {
    stroke-dashoffset: 0;
    opacity: 0.85;
  }

  .plate {
    opacity: 1;
  }
}
</style>
