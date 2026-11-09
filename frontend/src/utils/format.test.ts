import { formatCapacity, formatDateTime, formatRam, formatWatts, formatWeight } from './format'

describe('format', () => {
  it.each([
    [512, '512 MB'],
    [2048, '2 GB'],
    [16384, '16 GB'],
  ])('formatRam(%i) = %s', (mb, expected) => expect(formatRam(mb)).toBe(expected))

  it.each([
    [80, '80 GB'],
    [750, '750 GB'],
    [1000, '1 TB'],
    [4000, '4 TB'],
  ])('formatCapacity(%i) = %s', (gb, expected) => expect(formatCapacity(gb)).toBe(expected))

  it('formats weight in kg or lb', () => {
    expect(formatWeight(8100)).toBe('8.1 kg')
    expect(formatWeight(7257, 'lb')).toBe('16 lb')
    expect(formatWeight(6260, 'lb')).toBe('13.8 lb')
  })

  it('formats watts', () => expect(formatWatts(500)).toBe('500 W'))

  it('formats timestamps in the local time zone', () => {
    const iso = '2026-11-09T01:13:52+00:00'
    const expected = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
    expect(formatDateTime(iso)).toBe(expected)
    expect(formatDateTime(iso)).toMatch(/2026/)
  })
})
