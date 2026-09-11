/**
 * Reordering helper shared by every ordered list in the dashboard.
 *
 * The previous implementation swapped the `order_index` values of two rows.
 * That silently no-ops whenever two rows happen to share an index (which a
 * failed write, a manual edit or a delete can easily produce) and leaves gaps
 * behind. Since the public site's node graph now derives node *position* from
 * this ordering, a wrong or ambiguous index is visible on the live site — so
 * reordering renormalises the whole list to a dense 0..n-1 sequence instead.
 */

export interface Ordered {
  id: string
  order_index: number
}

/** Moves `index` by `direction` and returns the list renumbered 0..n-1. */
export function moveWithin<T extends Ordered>(items: T[], index: number, direction: -1 | 1): T[] | null {
  const target = index + direction
  if (target < 0 || target >= items.length) return null
  const next = [...items]
  const [moved] = next.splice(index, 1)
  if (!moved) return null
  next.splice(target, 0, moved)
  return next.map((item, i) => ({ ...item, order_index: i }))
}

/** Rows whose stored index differs from their new position — the minimal write set. */
export function changedRows<T extends Ordered>(before: T[], after: T[]): T[] {
  const previous = new Map(before.map((item) => [item.id, item.order_index]))
  return after.filter((item) => previous.get(item.id) !== item.order_index)
}
