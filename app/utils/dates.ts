/**
 * Date formatting for the experience timeline.
 *
 * Supabase `date` columns arrive as plain 'YYYY-MM-DD' strings. They are parsed
 * by hand rather than through `new Date(string)`: that constructor treats a
 * bare date as UTC midnight and then renders it in the viewer's local zone, so
 * anyone west of Greenwich sees every start date land a month early. These are
 * calendar months, not instants — they carry no timezone and must not acquire
 * one.
 */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

interface YearMonth {
  year: number
  month: number
}

function parse(iso: string): YearMonth | null {
  const match = /^(\d{4})-(\d{2})/.exec(iso)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  if (!Number.isFinite(year) || month < 0 || month > 11) return null
  return { year, month }
}

/** '2024-06-01' → 'Jun 2024'. */
export function formatMonthYear(iso: string | null | undefined): string {
  if (!iso) return ''
  const ym = parse(iso)
  return ym ? `${MONTHS[ym.month]} ${ym.year}` : ''
}

/** A null end date means the role is still running. */
export function formatRange(start: string, end: string | null): string {
  const from = formatMonthYear(start)
  return end ? `${from} — ${formatMonthYear(end)}` : `${from} — Present`
}

/**
 * Whole months between the two dates, inclusive of the starting month, phrased
 * the way a CV does. An open-ended role is measured to today.
 */
export function formatDuration(start: string, end: string | null, today = new Date()): string {
  const from = parse(start)
  if (!from) return ''
  const to = end
    ? parse(end)
    : { year: today.getFullYear(), month: today.getMonth() }
  if (!to) return ''

  const months = (to.year - from.year) * 12 + (to.month - from.month) + 1
  if (months < 1) return ''
  if (months < 12) return `${months} mo`

  const years = Math.floor(months / 12)
  const rest = months % 12
  const yearPart = `${years} yr${years > 1 ? 's' : ''}`
  return rest ? `${yearPart} ${rest} mo` : yearPart
}

/** True when the role has no end date — the timeline's "still running" state. */
export function isOngoing(end: string | null | undefined): boolean {
  return end === null || end === undefined || end === ''
}
