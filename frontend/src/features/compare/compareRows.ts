import { formatCapacity, formatRam, formatWatts, formatWeight, type WeightUnit } from '../../utils/format'
import { storageTypeLabels, usbPortTypeLabels } from '../computers/labels'
import type { ComputerDetails, UsbPortType } from '../computers/types'

/** Which way is better for a spec, if either. */
export type Better = 'higher' | 'lower'

export interface CompareRow {
  key: string
  label: string
  display: (computer: ComputerDetails, weightUnit: WeightUnit) => string
  /** A number to rank by; rows without one (e.g. model names) aren't ranked. */
  rank?: (computer: ComputerDetails) => number
  better?: Better
}

const usbCount = (computer: ComputerDetails, type: UsbPortType) =>
  computer.usbPorts.find((p) => p.type === type)?.count ?? 0

const usbRow = (type: UsbPortType): CompareRow => ({
  key: `usb-${type}`,
  label: usbPortTypeLabels[type],
  display: (c) => String(usbCount(c, type)),
  rank: (c) => usbCount(c, type),
  better: 'higher',
})

export const compareRows: CompareRow[] = [
  {
    key: 'processor',
    label: 'Processor',
    display: (c) => `${c.processor.manufacturer} ${c.processor.model}`,
  },
  {
    key: 'graphicsCard',
    label: 'Graphics card',
    display: (c) => `${c.graphicsCard.manufacturer} ${c.graphicsCard.model}`,
  },
  { key: 'ram', label: 'RAM', display: (c) => formatRam(c.ramMb), rank: (c) => c.ramMb, better: 'higher' },
  {
    key: 'storage',
    label: 'Storage',
    display: (c) => formatCapacity(c.storageCapacityGb),
    rank: (c) => c.storageCapacityGb,
    better: 'higher',
  },
  {
    key: 'storageType',
    label: 'Storage type',
    display: (c) => storageTypeLabels[c.storageType],
    // SSDs are faster: ranked above HDDs.
    rank: (c) => (c.storageType === 'Ssd' ? 1 : 0),
    better: 'higher',
  },
  { key: 'psu', label: 'Power supply', display: (c) => formatWatts(c.psuWatts), rank: (c) => c.psuWatts, better: 'higher' },
  {
    key: 'weight',
    label: 'Weight',
    display: (c, unit) => formatWeight(c.weightGrams, unit),
    rank: (c) => c.weightGrams,
    better: 'lower',
  },
  {
    key: 'usbTotal',
    label: 'USB ports (total)',
    display: (c) => String(c.usbPorts.reduce((sum, p) => sum + p.count, 0)),
    rank: (c) => c.usbPorts.reduce((sum, p) => sum + p.count, 0),
    better: 'higher',
  },
  usbRow('Usb2'),
  usbRow('Usb3'),
  usbRow('UsbC'),
]

/**
 * Positions of the best computers for a row: all that share the best value. None when the row
 * isn't ranked or every computer has the same value (nothing stands out).
 */
export function bestIndexes(row: CompareRow, computers: ComputerDetails[]): Set<number> {
  if (!row.rank || !row.better || computers.length < 2) return new Set()
  const values = computers.map(row.rank)
  const best = row.better === 'higher' ? Math.max(...values) : Math.min(...values)
  if (values.every((v) => v === best)) return new Set()
  return new Set(values.flatMap((v, i) => (v === best ? [i] : [])))
}

/** Whether the computers differ on this row (as shown to the user). */
export const rowDiffers = (row: CompareRow, computers: ComputerDetails[], weightUnit: WeightUnit) =>
  new Set(computers.map((c) => row.display(c, weightUnit))).size > 1
