/**
 * Category facets for a project.
 *
 * The stored `eyebrow` carries three things at once: a sequence number, a set
 * of category words, and an ALL-CAPS presentation. Two of those are design
 * tells we're removing — the numbering isn't a real sequence, and the caps are
 * texture — but the *words* are content and must survive untouched.
 *
 * So: strip the leading "NN ·" counter, split the remainder into discrete
 * facets (rendered as separate elements rather than joined by middots), and
 * undo the shouting without damaging acronyms.
 *
 * If a project has an explicit `category` column it wins outright; this
 * derivation is the fallback so the site behaves correctly whether or not the
 * optional migration in supabase/migrations has been applied.
 */

/** Leading "01 ·", "02.", "3 -" style counters. Not a real sequence — dropped. */
const LEADING_INDEX = /^\s*\d{1,2}\s*[·.\-–—:]\s*/

/** Facet separators: middot, slash, pipe. */
const FACET_SPLIT = /\s*[·|/]\s*/

/**
 * De-shout a token without mangling acronyms. A token is only title-cased if
 * it is *entirely* uppercase letters and long enough to be a word rather than
 * an initialism — so ACCESSIBILITY → Accessibility and FINTECH → Fintech,
 * while AI, OCR and IoT (which already carries a lowercase letter) are left
 * exactly as they are.
 */
function deshout(token: string): string {
  if (!/^[A-Z]+$/.test(token)) return token
  if (token.length < 4) return token
  return token[0] + token.slice(1).toLowerCase()
}

export function categoryFacets(project: { eyebrow?: string | null; category?: string | null }): string[] {
  const source = project.category?.trim() || project.eyebrow || ''
  if (!source) return []

  return source
    .replace(LEADING_INDEX, '')
    .split(FACET_SPLIT)
    .map((facet) =>
      facet
        .trim()
        .split(/\s+/)
        .map(deshout)
        .join(' '),
    )
    .filter(Boolean)
}
