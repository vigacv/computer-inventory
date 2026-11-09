/** Display formatting. The API always uses canonical units (MB, GB, grams, watts). */

export type WeightUnit = 'kg' | 'lb'

const GRAMS_PER_POUND = 453.59237

const trim = (n: number, digits = 1) => Number(n.toFixed(digits)).toString()

/** 512 → "512 MB", 8192 → "8 GB" */
export const formatRam = (mb: number) => (mb >= 1024 ? `${trim(mb / 1024)} GB` : `${mb} MB`)

/** 750 → "750 GB", 2000 → "2 TB" (drive sizes are decimal) */
export const formatCapacity = (gb: number) => (gb >= 1000 ? `${trim(gb / 1000)} TB` : `${gb} GB`)

export const formatWeight = (grams: number, unit: WeightUnit = 'kg') =>
  unit === 'kg' ? `${trim(grams / 1000)} kg` : `${trim(grams / GRAMS_PER_POUND)} lb`

export const formatWatts = (watts: number) => `${watts} W`

const dateTimeFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })

/** ISO timestamp in the user's locale and time zone, e.g. "9 Nov 2026, 01:13". */
export const formatDateTime = (iso: string) => dateTimeFormat.format(new Date(iso))
