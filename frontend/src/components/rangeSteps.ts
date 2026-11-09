/**
 * Helpers for a range slider over a fixed list of steps (e.g. RAM sizes), where the slider
 * works with step indexes and the outer ends mean "no limit".
 */

export interface Range {
  min?: number
  max?: number
}

/** Slider thumb positions for a range. Values between steps snap inwards so the range never widens. */
export function toIndexRange(steps: readonly number[], { min, max }: Range): [number, number] {
  const last = steps.length - 1
  const lo = min === undefined ? 0 : steps.findIndex((s) => s >= min)
  const hi = max === undefined ? last : steps.findLastIndex((s) => s <= max)
  return [lo === -1 ? last : lo, hi === -1 ? 0 : hi]
}

/** Range for slider thumb positions; a thumb at either end means no limit on that side. */
export function fromIndexRange(steps: readonly number[], [lo, hi]: readonly [number, number]): Range {
  return {
    min: lo <= 0 ? undefined : steps[lo],
    max: hi >= steps.length - 1 ? undefined : steps[hi],
  }
}

/** "Any", "≥ 8 GB", "≤ 2 GB" or "8 GB – 16 GB". */
export function describeRange({ min, max }: Range, format: (value: number) => string): string {
  if (min === undefined && max === undefined) return 'Any'
  if (max === undefined) return `≥ ${format(min!)}`
  if (min === undefined) return `≤ ${format(max)}`
  return min === max ? format(min) : `${format(min)} – ${format(max)}`
}
