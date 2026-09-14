/**
 * Which scroll-driven visual a project section renders.
 *
 * Each project gets an animation that expresses what that project *is* — a
 * detector draws detections, a payments pipeline moves transactions through
 * stages, a reasoning agent wanders. That mapping is content, not code, so it
 * lives in the `projects.visual` column and is editable from the dashboard.
 *
 * When the column is unset (or the optional migration has not been applied)
 * the kind is *derived* from the project's own words — its tags, category and
 * title — the same fallback shape `utils/category.ts` uses for `category`.
 *
 * The title is one signal among several, never an identity check: there is no
 * `title === 'Payments Infrastructure'` anywhere here, only domain vocabulary.
 * That distinction matters in practice — project 01 has already been renamed
 * from "Wayfinding Device" to "Drishtiprabha" in the dashboard, and still
 * derives `assembly` from its category and tags alone. A rename can in
 * principle shift a derived kind, which is the correct behaviour for something
 * that follows content; pin the `visual` column when it shouldn't.
 */

export const VISUAL_KINDS = ['assembly', 'detection', 'pipeline', 'reasoning'] as const
export type VisualKind = (typeof VISUAL_KINDS)[number]

export interface VisualSource {
  visual?: string | null
  title?: string | null
  eyebrow?: string | null
  category?: string | null
  project_tags?: { tag_text: string }[]
  project_versions?: unknown[]
}

/**
 * Signal words per kind. Deliberately about the *domain* rather than any one
 * project, so a new project in the same domain derives the right visual
 * without being told — there is no entry here that names a project.
 *
 * Every signal is at least three characters and is matched as a substring, so
 * "yolo" still finds "YOLOv8". Short ambiguous tokens are deliberately absent:
 * "ai" matches inside "chain", "domain" and "email", "pi" inside "API", and
 * "cv" inside plenty — each of them would mis-derive a project on a tag that
 * has nothing to do with the domain.
 */
const SIGNALS: Record<VisualKind, string[]> = {
  detection: [
    'detection', 'detector', 'vision', 'computer vision', 'yolo', 'aerial',
    'drone', 'uav', 'image', 'segmentation', 'recognition', 'opencv', 'camera',
  ],
  pipeline: [
    'payment', 'payments', 'fintech', 'transaction', 'ledger', 'banking', 'upi',
    'kafka', 'pipeline', 'queue', 'settlement', 'compliance', 'pci', 'stream',
    'throughput', 'infrastructure',
  ],
  reasoning: [
    'agent', 'agentic', 'reasoning', 'autonomous', 'llm', 'language model',
    'planning', 'cognition', 'inference', 'prompt',
  ],
  assembly: [
    'hardware', 'iot', 'device', 'embedded', 'firmware', 'raspberry',
    'sensor', 'haptic', 'pcb', 'enclosure', 'robotics', 'accessibility',
  ],
}

/** Kinds are checked in this order, so a more specific domain wins a tie. */
const PRECEDENCE: VisualKind[] = ['detection', 'pipeline', 'reasoning', 'assembly']

function isKind(value: unknown): value is VisualKind {
  return typeof value === 'string' && (VISUAL_KINDS as readonly string[]).includes(value)
}

/**
 * Score each kind by how many of its signal words appear in the project's own
 * words. Longer signals score higher than short ones, and multi-word phrases
 * higher still, so "computer vision" outweighs an incidental single token.
 */
function derive(source: VisualSource): VisualKind {
  const words = [
    source.category ?? '',
    source.eyebrow ?? '',
    source.title ?? '',
    ...(source.project_tags ?? []).map((t) => t.tag_text),
  ]
    .join(' ')
    .toLowerCase()

  let best: VisualKind | null = null
  let bestScore = 0

  for (const kind of PRECEDENCE) {
    let score = 0
    for (const signal of SIGNALS[kind]) {
      if (!words.includes(signal)) continue
      // Multi-word phrases are stronger evidence than a bare token.
      score += signal.includes(' ') ? 3 : signal.length > 5 ? 2 : 1
    }
    if (score > bestScore) {
      bestScore = score
      best = kind
    }
  }

  if (best) return best

  // Nothing matched. A project carrying a version history is, by definition, a
  // thing that was built in iterations — the assembly sequence is the honest
  // default for it. Anything else falls back to the pipeline, the most neutral
  // of the four.
  return (source.project_versions?.length ?? 0) > 0 ? 'assembly' : 'pipeline'
}

export function visualKind(source: VisualSource): VisualKind {
  return isKind(source.visual) ? source.visual : derive(source)
}

/** Dashboard select options. `null` = derive, and shows what it would pick. */
export const VISUAL_OPTIONS: { value: VisualKind; label: string; hint: string }[] = [
  { value: 'assembly', label: 'Assembly', hint: 'A device building itself up, layer by layer.' },
  { value: 'detection', label: 'Detection', hint: 'Bounding boxes resolving onto a scene.' },
  { value: 'pipeline', label: 'Pipeline', hint: 'Ordered stages with traffic moving through them.' },
  { value: 'reasoning', label: 'Reasoning', hint: 'Thought-paths branching, wandering and restarting.' },
]
