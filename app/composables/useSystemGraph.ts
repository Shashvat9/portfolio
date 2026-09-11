/**
 * System-graph geometry + shared "live system" state.
 *
 * Everything here is computed from the live project list at runtime — node
 * count, coordinates, edge paths, draw-in stagger and packet periods are all
 * derived from `items.length` and from analytic path lengths. There are no
 * hardcoded node counts, coordinates or keyframe times anywhere in this file,
 * so adding/removing/reordering a project in the dashboard re-lays out the
 * whole graph with no code change.
 *
 * One primitive underlies every animation in the site: a stroked path with
 * `pathLength="100"`, animated via `stroke-dashoffset`. Draw-in, continuous
 * packet flow and the hover signal pulse are all the same mechanism at
 * different dash patterns — which is what makes hero, pinned mini-graph and
 * card hover read as one system rather than three tricks.
 */

const TAU = Math.PI * 2

/** Normalised path length every graph path declares, so dash maths is scale-free. */
export const PATH_UNITS = 100

export interface GraphItem {
  id: string
  title: string
}

export interface GraphNode {
  id: string
  index: number
  /** Possibly clipped for rendering. */
  label: string
  /** Full, unclipped title — used for the accessible name. */
  title: string
  x: number
  y: number
  labelX: number
  labelY: number
  anchor: 'start' | 'middle' | 'end'
}

export interface GraphEdge {
  id: string
  index: number
  d: string
  /** Geometric length in user units — used to normalise packet speed across edges. */
  length: number
}

export interface GraphLayout {
  mode: 'radial' | 'bus'
  viewBox: string
  width: number
  height: number
  /** Central "core" region. Edges terminate on its boundary, not at a point. */
  core: { x: number; y: number; w: number; h: number; cx: number; cy: number; r: number }
  nodes: GraphNode[]
  edges: GraphEdge[]
  /** Orbit arcs between adjacent nodes. Density, and a second signal route. */
  ring: GraphEdge[]
  nodeRadius: number
}

export type GraphPreset = 'hero' | 'mini'

interface RadialConfig {
  width: number
  height: number
  /** Core box as a fraction of the viewBox. */
  coreWRatio: number
  coreHRatio: number
  orbitMarginX: number
  orbitMarginY: number
  nodeRadius: number
  labelGap: number
  cornerRadius: number
}

const RADIAL_PRESETS: Record<GraphPreset, RadialConfig> = {
  hero: {
    width: 1000,
    height: 680,
    coreWRatio: 0.46,
    coreHRatio: 0.31,
    orbitMarginX: 96,
    orbitMarginY: 74,
    nodeRadius: 6.5,
    labelGap: 15,
    cornerRadius: 3,
  },
  mini: {
    width: 148,
    height: 148,
    coreWRatio: 0.13,
    coreHRatio: 0.13,
    orbitMarginX: 26,
    orbitMarginY: 26,
    nodeRadius: 4.4,
    labelGap: 0,
    cornerRadius: 1,
  },
}

/** Where a ray at `angle` leaves an axis-aligned box centred on (cx, cy). */
function boxExit(cx: number, cy: number, halfW: number, halfH: number, angle: number) {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const tx = Math.abs(c) < 1e-6 ? Number.POSITIVE_INFINITY : halfW / Math.abs(c)
  const ty = Math.abs(s) < 1e-6 ? Number.POSITIVE_INFINITY : halfH / Math.abs(s)
  const t = Math.min(tx, ty)
  return { x: cx + c * t, y: cy + s * t }
}

function round(n: number) {
  return Math.round(n * 100) / 100
}

/**
 * SVG <text> neither wraps nor ellipsises, so a long project title would run
 * straight off the canvas. Labels are clipped to a width the layout can
 * actually hold; the full title still reaches assistive tech via <title>.
 */
function clipLabel(label: string, max: number) {
  return label.length <= max ? label : `${label.slice(0, max - 1).trimEnd()}…`
}

/**
 * Even radial distribution: node i sits at -90° + i·(360°/n), so the graph is
 * always symmetric about the vertical axis and node order follows project
 * order clockwise from the top. Works for any n ≥ 1.
 */
function radialLayout(items: GraphItem[], cfg: RadialConfig): GraphLayout {
  const n = items.length
  const { width, height } = cfg
  const cx = width / 2
  const cy = height / 2
  const coreW = width * cfg.coreWRatio
  const coreH = height * cfg.coreHRatio
  const rx = width / 2 - cfg.orbitMarginX
  const ry = height / 2 - cfg.orbitMarginY

  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  for (let i = 0; i < n; i++) {
    // Single node reads better on the right than balanced on top.
    const angle = n === 1 ? 0 : -Math.PI / 2 + (i * TAU) / n
    const c = Math.cos(angle)
    const s = Math.sin(angle)
    const x = cx + rx * c
    const y = cy + ry * s

    let anchor: GraphNode['anchor'] = 'middle'
    if (c > 0.25) anchor = 'start'
    else if (c < -0.25) anchor = 'end'

    const gap = cfg.labelGap
    const labelX = anchor === 'start' ? x + gap : anchor === 'end' ? x - gap : x
    // Vertically-placed nodes push their label clear of the dot.
    const labelY = anchor === 'middle' ? (s < 0 ? y - gap : y + gap + 8) : y + 4

    nodes.push({
      id: items[i]!.id,
      index: i,
      label: clipLabel(items[i]!.title, anchor === 'middle' ? 30 : 26),
      title: items[i]!.title,
      x: round(x),
      y: round(y),
      labelX: round(labelX),
      labelY: round(labelY),
      anchor,
    })

    const start = boxExit(cx, cy, coreW / 2, coreH / 2, angle)
    // Stop short of the node so the dot sits on the line end, not over it.
    const end = { x: x - c * cfg.nodeRadius, y: y - s * cfg.nodeRadius }
    edges.push({
      id: items[i]!.id,
      index: i,
      d: `M${round(start.x)},${round(start.y)} L${round(end.x)},${round(end.y)}`,
      length: Math.hypot(end.x - start.x, end.y - start.y),
    })
  }

  // Orbit arcs joining adjacent nodes. Below three nodes a "ring" is just a
  // line back on itself, so it is skipped.
  const ring: GraphEdge[] = []
  if (n >= 3) {
    for (let i = 0; i < n; i++) {
      const a = nodes[i]!
      const b = nodes[(i + 1) % n]!
      ring.push({
        id: `${a.id}~${b.id}`,
        index: i,
        d: `M${a.x},${a.y} A ${round(rx)} ${round(ry)} 0 0 1 ${b.x},${b.y}`,
        // Arc length along the orbit, approximated from the mean radius.
        length: ((rx + ry) / 2) * (TAU / n),
      })
    }
  }

  return {
    mode: 'radial',
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    core: { x: round(cx - coreW / 2), y: round(cy - coreH / 2), w: round(coreW), h: round(coreH), cx, cy, r: cfg.cornerRadius },
    nodes,
    edges,
    ring,
    nodeRadius: cfg.nodeRadius,
  }
}

const BUS = {
  width: 360,
  trunkX: 30,
  nodeX: 92,
  headY: 40,
  firstNodeY: 96,
  gap: 66,
  tailPad: 34,
  nodeRadius: 5.5,
  elbow: 16,
}

/**
 * Mobile variant. A squeezed radial graph is unreadable at 375px, so portrait
 * gets a considered alternative: a vertical signal bus with the core at the
 * top and each project branching off it. Same nodes, same edges, same packet
 * grammar — only the routing changes. Height grows with the project count.
 */
function busLayout(items: GraphItem[]): GraphLayout {
  const n = items.length
  const height = BUS.firstNodeY + Math.max(0, n - 1) * BUS.gap + BUS.tailPad
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  for (let i = 0; i < n; i++) {
    const y = BUS.firstNodeY + i * BUS.gap
    nodes.push({
      id: items[i]!.id,
      index: i,
      label: clipLabel(items[i]!.title, 30),
      title: items[i]!.title,
      x: BUS.nodeX,
      y,
      labelX: BUS.nodeX + 14,
      labelY: y + 4,
      anchor: 'start',
    })

    const elbowStart = y - BUS.elbow
    const d =
      `M${BUS.trunkX},${BUS.headY} ` +
      `L${BUS.trunkX},${round(elbowStart)} ` +
      `Q${BUS.trunkX},${y} ${BUS.trunkX + BUS.elbow},${y} ` +
      `L${round(BUS.nodeX - BUS.nodeRadius)},${y}`
    // Trunk run + elbow + branch run. The quarter-turn is approximated by its
    // chord; only relative length matters (it normalises packet speed).
    const length =
      (elbowStart - BUS.headY) + BUS.elbow * 1.2 + (BUS.nodeX - BUS.nodeRadius - BUS.trunkX - BUS.elbow)

    edges.push({ id: items[i]!.id, index: i, d, length: Math.max(length, 1) })
  }

  return {
    mode: 'bus',
    viewBox: `0 0 ${BUS.width} ${round(height)}`,
    width: BUS.width,
    height: round(height),
    core: { x: BUS.trunkX - 7, y: BUS.headY - 14, w: 14, h: 14, cx: BUS.trunkX, cy: BUS.headY - 7, r: 1 },
    nodes,
    edges,
    ring: [],
    nodeRadius: BUS.nodeRadius,
  }
}

export function buildLayout(items: GraphItem[], mode: 'radial' | 'bus', preset: GraphPreset = 'hero'): GraphLayout {
  if (!items.length) {
    const cfg = RADIAL_PRESETS[preset]
    return {
      mode: 'radial',
      viewBox: `0 0 ${cfg.width} ${cfg.height}`,
      width: cfg.width,
      height: cfg.height,
      core: { x: 0, y: 0, w: 0, h: 0, cx: cfg.width / 2, cy: cfg.height / 2, r: 0 },
      nodes: [],
      edges: [],
      ring: [],
      nodeRadius: cfg.nodeRadius,
    }
  }
  return mode === 'bus' ? busLayout(items) : radialLayout(items, RADIAL_PRESETS[preset])
}

/* ── Timing ─────────────────────────────────────────────────────────────────
   Durations are derived from the data, never written as fixed keyframes:
   the draw-in window is split across however many edges exist, and each
   edge's packet period is proportional to its length so signal *speed* is
   constant even when edges differ in length. */

/** Total wall time the whole graph takes to draw itself in, in seconds. */
const DRAW_WINDOW = 1.5
const DRAW_EDGE_DURATION = 0.72
/** User units a packet covers per second. */
const PACKET_SPEED = 170
const PACKET_SPEED_MINI = 42

export function edgeDrawDelay(index: number, count: number) {
  if (count <= 1) return 0
  return (index / (count - 1)) * Math.max(0, DRAW_WINDOW - DRAW_EDGE_DURATION)
}

export function edgeDrawDuration() {
  return DRAW_EDGE_DURATION
}

/** Seconds for one packet to traverse this edge, so speed matches across edges. */
export function packetPeriod(length: number, preset: GraphPreset = 'hero') {
  const speed = preset === 'mini' ? PACKET_SPEED_MINI : PACKET_SPEED
  return Math.max(0.9, length / speed)
}

/** Packets in flight per edge — denser graphs stay legible with fewer dots. */
export function packetsPerEdge(count: number) {
  return count > 6 ? 2 : 3
}

/* ── Shared live-system state ───────────────────────────────────────────── */

export interface SystemState {
  /** Index of the project section currently being read, or null in the hero. */
  activeIndex: number | null
  /** True once the hero graph has scrolled out of view (pins the mini graph). */
  heroPassed: boolean
}

export function useSystemState() {
  const activeIndex = useState<number | null>('system-active-index', () => null)
  const heroPassed = useState<boolean>('system-hero-passed', () => false)
  return { activeIndex, heroPassed }
}

/**
 * Hover signal pulses. Hovering a project card bumps that project's counter;
 * the mini graph watches it and fires a one-shot packet down the matching
 * edge using the same dash primitive as the hero flow.
 */
const pulseSeq = shallowRef<Record<string, number>>({})

export function useSignalPulse() {
  function emit(projectId: string) {
    pulseSeq.value = { ...pulseSeq.value, [projectId]: (pulseSeq.value[projectId] ?? 0) + 1 }
  }
  return { pulses: pulseSeq, emit }
}

/** Reactive `prefers-reduced-motion`. SSR-safe: assumes motion is allowed. */
export function useReducedMotion() {
  const reduced = ref(false)
  onMounted(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduced.value = mq.matches
    const onChange = (e: MediaQueryListEvent) => { reduced.value = e.matches }
    mq.addEventListener('change', onChange)
    onUnmounted(() => mq.removeEventListener('change', onChange))
  })
  return reduced
}
