/**
 * Geometry for the per-project scroll visuals.
 *
 * Three different behaviours, one vocabulary. Every layout here is built from
 * the project's *live* content — the tag list supplies detection classes and
 * pipeline stage names, and the element counts follow from it — and from a
 * seed derived from the project id, never from `Math.random()` (see
 * utils/seeded.ts) and never from a project title.
 *
 * Consequences, all of them intentional:
 *   · editing tags in the dashboard changes the visual
 *   · the same project draws the same shape on the server and on the client
 *   · a new project gets a coherent visual with no code change
 *
 * Each element carries `--t0` / `--inv-span`, the same per-element scrub
 * window the Stage 8 schematic uses, so all four visuals are driven by one
 * `--scrub` custom property and none of them runs JS per frame.
 */
import { seededStream } from '~/utils/seeded'

/** Shared canvas. Matching the Stage 8 schematic keeps stroke weights and
    label sizes consistent across all four visuals without per-visual tuning. */
export const VISUAL_VIEWBOX = { width: 420, height: 300 }

/** Per-element scrub window, as consumed by the `--local` clamp in CSS. */
export function scrubWindow(index: number, count: number) {
  const n = Math.max(1, count)
  const t0 = index / n
  return { '--t0': t0.toFixed(4), '--inv-span': String(n) } as Record<string, string>
}

/* ── detection ──────────────────────────────────────────────────────────────
   What the model literally does: boxes resolve onto a scene, one at a time,
   each with a class and a confidence. */

export interface DetectionBox {
  id: string
  x: number
  y: number
  w: number
  h: number
  label: string
  confidence: string
  /** Where the label plate is anchored, so it never runs off the frame or
      lands on top of another box's plate. */
  labelX: number
  labelY: number
  anchor: 'start' | 'end'
  style: Record<string, string>
}

export interface SceneFeature {
  id: string
  d: string
  kind: 'road' | 'block'
}

export interface DetectionLayout {
  boxes: DetectionBox[]
  features: SceneFeature[]
  /** Scan sweep sits just ahead of the most recently resolved box. */
  count: number
}

const round = (n: number) => Math.round(n * 100) / 100

/**
 * Boxes are laid out on a coarse jittered grid rather than at free random:
 * free placement piles them on top of each other at small sizes, which stops
 * reading as separate detections. The grid guarantees separation; the jitter
 * removes the grid from view.
 */
export function buildDetection(key: string, labels: string[]): DetectionLayout {
  const rng = seededStream(`${key}:detection`)
  const { width, height } = VISUAL_VIEWBOX

  // Count follows the live tag list — more classes, a busier scene — clamped
  // to what stays legible at 420×300 and on a phone.
  const classes = labels.length ? labels : ['object']
  const count = Math.min(9, Math.max(4, classes.length * 2))

  // Ground features: an abstract aerial scene, not a photograph. Drawn faintly
  // so the boxes remain the subject.
  const features: SceneFeature[] = []
  const roads = rng.int(2, 3)
  for (let i = 0; i < roads; i++) {
    const y = round(height * ((i + 1) / (roads + 1)) + rng.range(-18, 18))
    const bend = round(rng.range(-26, 26))
    features.push({
      id: `road-${i}`,
      kind: 'road',
      d: `M0,${y} Q${width / 2},${round(y + bend)} ${width},${round(y + rng.range(-14, 14))}`,
    })
  }
  const blocks = rng.int(3, 5)
  for (let i = 0; i < blocks; i++) {
    const bw = round(rng.range(34, 74))
    const bh = round(rng.range(26, 52))
    const bx = round(rng.range(8, width - bw - 8))
    const by = round(rng.range(8, height - bh - 8))
    features.push({ id: `block-${i}`, kind: 'block', d: `M${bx},${by} h${bw} v${bh} h${-bw} Z` })
  }

  // Grid cells sized to hold `count` boxes with room to jitter.
  const cols = Math.ceil(Math.sqrt(count))
  const rows = Math.ceil(count / cols)
  const cellW = width / cols
  const cellH = height / rows

  // Mono advance in user units, taken at the LARGEST font size the plate is
  // ever set at (11 user units on phones; 9 on desktop). SVG font-size is in
  // user units, so it scales with the viewBox rather than the viewport — which
  // means the phone breakpoint, not the desktop one, decides whether a label
  // fits. Estimating from the smaller size let the widest label overflow the
  // right edge on mobile only. Only used to choose which edge to anchor to,
  // never to position text by measurement.
  const CHAR_W = 11 * 0.6

  /** Plate height in user units, at the largest font size. */
  const PLATE_H = 12
  /** Plate rects already placed, for collision checks. */
  const placed: { left: number; right: number; top: number; bottom: number }[] = []

  const boxes: DetectionBox[] = []
  for (let i = 0; i < count; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const w = round(rng.range(cellW * 0.36, cellW * 0.62))
    const h = round(rng.range(cellH * 0.34, cellH * 0.58))
    const x = round(col * cellW + rng.range(10, Math.max(12, cellW - w - 10)))
    const y = round(row * cellH + rng.range(10, Math.max(12, cellH - h - 10)))

    const label = classes[i % classes.length]!
    // "label 0.00" — the plate's full width. A plate that would overrun the
    // right edge is flipped to hang off the box's right edge instead, so it
    // stays inside the frame at any font size rather than being clipped.
    const plateWidth = (label.length + 5) * CHAR_W
    const overruns = x + plateWidth > width - 4
    const anchor: DetectionBox['anchor'] = overruns ? 'end' : 'start'
    const labelX = anchor === 'end' ? round(Math.min(x + w, width - 4)) : x
    const left = anchor === 'end' ? labelX - plateWidth : labelX

    // Plates are placed one at a time against what is already down. Boxes sit
    // on a jittered grid, so two in the same row can easily want the same strip
    // of space above them — at the phone font size that reads as one label
    // printed over another. Try above the box, then below it, then further
    // above; take the first slot that is clear.
    const candidates = [y - 4, y + h + 11, y - 16]
    let labelY = candidates[0]!
    for (const cy of candidates) {
      const top = cy - PLATE_H
      const bottom = cy + 2
      const clash = placed.some((r) =>
        left < r.right && left + plateWidth > r.left && top < r.bottom && bottom > r.top,
      )
      // Also refuse a slot that would fall outside the frame entirely.
      if (!clash && top > 0 && bottom < height) { labelY = cy; break }
      labelY = cy
    }
    placed.push({ left, right: left + plateWidth, top: labelY - PLATE_H, bottom: labelY + 2 })

    boxes.push({
      id: `box-${i}`,
      x,
      y,
      w,
      h,
      labelX,
      labelY: round(labelY),
      anchor,
      // Real tag text, cycled — a detector finding several instances of the
      // same class is exactly right, and it keeps every label truthful to the
      // project's own content rather than inventing class names.
      label,
      // Illustrative, not measured: this is a diagram of what detection looks
      // like, not a readout of model output. Seeded so it never reshuffles.
      confidence: rng.range(0.62, 0.97).toFixed(2),
      style: scrubWindow(i, count),
    })
  }

  return { boxes, features, count }
}

/* ── pipeline ───────────────────────────────────────────────────────────────
   The restrained one. Even spacing, even timing, constant packet speed — the
   orderliness is the characterisation, so nothing here is jittered. */

export interface PipelineStage {
  id: string
  label: string
  index: number
  x: number
  y: number
  w: number
  h: number
  /** Connector into this stage from the previous one. Empty for the first. */
  link: string
  linkLength: number
  style: Record<string, string>
}

export interface PipelineLayout {
  mode: 'row' | 'column'
  viewBox: string
  width: number
  height: number
  stages: PipelineStage[]
}

const ROW = { width: 420, height: 150, boxW: 74, boxH: 46, padX: 12 }
const COLUMN = { width: 300, boxW: 190, boxH: 52, gap: 34, padY: 16 }

/**
 * Two routings, same grammar — the Stage 8 hero precedent. A horizontal
 * pipeline squeezed to 375px puts four stage labels into ~80px each, which is
 * unreadable, so portrait gets a real vertical variant rather than a scaled
 * one. Both ship server-side and swap by media query.
 */
export function buildPipeline(labels: string[], mode: 'row' | 'column'): PipelineLayout {
  const stageLabels = labels.length ? labels : ['ingest', 'validate', 'settle']
  const n = stageLabels.length

  const stages: PipelineStage[] = []

  if (mode === 'row') {
    const { width, height, boxW, boxH, padX } = ROW
    const cy = height / 2
    // Even spacing across the full width — the gap falls out of the count, so
    // three stages and six stages are both evenly distributed.
    const span = width - padX * 2
    const step = n === 1 ? 0 : (span - boxW) / (n - 1)

    for (let i = 0; i < n; i++) {
      const x = round(n === 1 ? (width - boxW) / 2 : padX + i * step)
      const y = round(cy - boxH / 2)
      const prevRight = padX + (i - 1) * step + boxW
      const link = i === 0 ? '' : `M${round(prevRight)},${round(cy)} L${round(x)},${round(cy)}`
      stages.push({
        id: `stage-${i}`, label: stageLabels[i]!, index: i,
        x, y, w: boxW, h: boxH,
        link, linkLength: Math.max(1, x - prevRight),
        style: scrubWindow(i, n),
      })
    }

    return { mode, viewBox: `0 0 ${width} ${height}`, width, height, stages }
  }

  const { width, boxW, boxH, gap, padY } = COLUMN
  const height = padY * 2 + n * boxH + Math.max(0, n - 1) * gap
  const x = round((width - boxW) / 2)

  for (let i = 0; i < n; i++) {
    const y = round(padY + i * (boxH + gap))
    const prevBottom = padY + (i - 1) * (boxH + gap) + boxH
    const cx = width / 2
    const link = i === 0 ? '' : `M${cx},${round(prevBottom)} L${cx},${round(y)}`
    stages.push({
      id: `stage-${i}`, label: stageLabels[i]!, index: i,
      x, y, w: boxW, h: boxH,
      link, linkLength: Math.max(1, y - prevBottom),
      style: scrubWindow(i, n),
    })
  }

  return { mode, viewBox: `0 0 ${width} ${round(height)}`, width, height: round(height), stages }
}

/* ── reasoning ──────────────────────────────────────────────────────────────
   The loose one. Irregularity is the point here, so angles, lengths, firing
   delays and which paths dead-end are all pulled from the seeded stream —
   deliberately breaking the even spacing the other three visuals keep. */

export interface ThoughtPath {
  id: string
  d: string
  depth: number
  length: number
  /** A path that trails off instead of arriving — no terminal node. */
  fades: boolean
  style: Record<string, string>
}

export interface ThoughtNode {
  id: string
  x: number
  y: number
  r: number
  depth: number
  style: Record<string, string>
}

export interface ReasoningLayout {
  paths: ThoughtPath[]
  nodes: ThoughtNode[]
  root: { x: number; y: number }
  /** Uniform fit of the grown tree into the shared canvas. */
  transform: string
}

/**
 * Grows a tree left-to-right. Each branch picks its own angle, length and
 * children from the stream, so no two projects wander the same way and no two
 * branches of one project are in step. Depth follows the tag count so a richer
 * project thinks further out, which keeps the element budget tied to content.
 */
export function buildReasoning(key: string, tagCount: number): ReasoningLayout {
  const rng = seededStream(`${key}:reasoning`)
  const { width, height } = VISUAL_VIEWBOX

  const maxDepth = Math.min(4, Math.max(2, Math.ceil(tagCount / 2) + 1))
  const root = { x: 34, y: height / 2 }

  const paths: ThoughtPath[] = []
  const nodes: ThoughtNode[] = []
  // Total elements is bounded so a heavily-tagged project cannot explode the
  // node count — irregular, still cheap.
  const BUDGET = 26

  interface Pending { x: number; y: number; angle: number; depth: number }
  let frontier: Pending[] = [{ x: root.x, y: root.y, angle: 0, depth: 0 }]
  let id = 0

  while (frontier.length && paths.length < BUDGET) {
    const next: Pending[] = []

    for (const branch of frontier) {
      if (branch.depth >= maxDepth) continue
      // Fan-out varies per branch — some thoughts split three ways, some carry
      // straight on. This is what stops the tree looking like a diagram.
      const children = branch.depth === 0 ? rng.int(2, 3) : rng.int(1, 3)

      for (let c = 0; c < children && paths.length < BUDGET; c++) {
        // Spread narrows with depth so the tree stays inside the frame, but the
        // angle within that spread is free.
        const spread = 1.15 / (branch.depth + 1)
        const angle = branch.angle + rng.range(-spread, spread)
        const length = rng.range(46, 92) * (1 - branch.depth * 0.14)

        const x = round(branch.x + Math.cos(angle) * length)
        const y = round(branch.y + Math.sin(angle) * length)
        // Keep inside the canvas; a branch that would leave simply stops.
        if (x > width - 12 || y < 12 || y > height - 12) continue

        // Control point offset perpendicular to the run — thought-paths curve,
        // they do not travel in straight lines.
        const mx = round((branch.x + x) / 2 + Math.cos(angle + Math.PI / 2) * rng.range(-16, 16))
        const my = round((branch.y + y) / 2 + Math.sin(angle + Math.PI / 2) * rng.range(-16, 16))

        const depth = branch.depth + 1
        // Deeper paths are likelier to trail off unresolved.
        const fades = depth >= 2 && rng.chance(0.34)

        paths.push({
          id: `p${id}`,
          d: `M${round(branch.x)},${round(branch.y)} Q${mx},${my} ${x},${y}`,
          depth,
          length: Math.hypot(x - branch.x, y - branch.y),
          fades,
          style: {
            // Irregular on purpose: every path has its own delay and its own
            // period, unlike the pipeline's lockstep.
            '--fire-delay': `${rng.range(0, 4.5).toFixed(2)}s`,
            '--fire-duration': `${rng.range(2.4, 6.2).toFixed(2)}s`,
            ...scrubWindow(Math.min(depth - 1, maxDepth - 1), maxDepth),
          },
        })

        if (!fades) {
          nodes.push({
            id: `n${id}`,
            x, y,
            r: round(Math.max(2.1, 4.4 - depth * 0.55)),
            depth,
            style: {
              '--fire-delay': `${rng.range(0, 4).toFixed(2)}s`,
              '--fire-duration': `${rng.range(1.8, 4.6).toFixed(2)}s`,
              ...scrubWindow(Math.min(depth - 1, maxDepth - 1), maxDepth),
            },
          })
          next.push({ x, y, angle, depth })
        }
        id++
      }
    }

    frontier = next
  }

  // The tree is grown, not placed: how far it reaches depends on the seed, the
  // fan-out it happened to pick and which branches ran out of room. So measure
  // what actually grew and fit it into the shared canvas with one uniform
  // scale.
  //
  // Fitting by *transform* rather than by viewBox is deliberate: all four
  // visuals must sit in the same 420×300 frame, or the sticky stage would
  // change shape from section to section and the four would stop reading as
  // one system. The scale is uniform, so the tree's proportions — the thing
  // the seed actually determines — survive untouched.
  const xs = [root.x]
  const ys = [root.y]
  for (const n of nodes) { xs.push(n.x); ys.push(n.y) }
  for (const p of paths) {
    // Sample the endpoints and the control point of each quadratic.
    for (const m of p.d.matchAll(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g)) {
      xs.push(Number(m[1])); ys.push(Number(m[2]))
    }
  }
  const PAD = 16
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const treeW = Math.max(1, Math.max(...xs) - minX)
  const treeH = Math.max(1, Math.max(...ys) - minY)

  const availW = width - PAD * 2
  const availH = height - PAD * 2
  // Never magnify past 1.6: a sparse tree blown up to fill the frame would
  // carry visibly fatter node dots than a dense one.
  const scale = Math.min(availW / treeW, availH / treeH, 1.6)

  // Centre whatever is left over after scaling.
  const tx = PAD + (availW - treeW * scale) / 2 - minX * scale
  const ty = PAD + (availH - treeH * scale) / 2 - minY * scale

  return {
    paths,
    nodes,
    root,
    transform: `translate(${round(tx)} ${round(ty)}) scale(${round(scale)})`,
  }
}

/* ── scroll budget ──────────────────────────────────────────────────────── */

/**
 * How many discrete steps a visual has, which is what the scroll timeline is
 * sized from. Derived per kind from the same live inputs the geometry uses, so
 * a project whose tags grow gets a proportionally longer sequence instead of
 * cramming more elements into a fixed scroll.
 */
export function visualStageCount(kind: string, tagCount: number): number {
  switch (kind) {
    case 'detection':
      // One step per box.
      return Math.min(9, Math.max(4, tagCount * 2))
    case 'pipeline':
      // One step per stage.
      return Math.max(3, tagCount)
    case 'reasoning':
      // One step per depth ring, matching buildReasoning's maxDepth.
      return Math.min(4, Math.max(2, Math.ceil(tagCount / 2) + 1))
    default:
      // Assembly is paced by its version/image tracks instead.
      return 1
  }
}
