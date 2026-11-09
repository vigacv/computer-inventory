import { z } from 'zod'
import { GRAMS_PER_POUND, type WeightUnit } from '../../../utils/format'
import type { ComputerDetails, ComputerSpec, StorageType, UsbPortType } from '../types'

/** Mirrors the API's ComputerLimits, so most mistakes are caught before a request is made. */
export const limits = {
  maxRamMb: 1024 * 1024,
  maxStorageGb: 1_000_000,
  maxWeightGrams: 200_000,
  maxPsuWatts: 5_000,
  maxPortsPerType: 50,
} as const

export type RamUnit = 'MB' | 'GB'
export type StorageUnit = 'GB' | 'TB'

/** Each size unit expressed in the API's canonical unit (MB, GB or grams). */
export const ramUnits: Record<RamUnit, number> = { MB: 1, GB: 1024 }
export const storageUnits: Record<StorageUnit, number> = { GB: 1, TB: 1000 }
export const weightUnits: Record<WeightUnit, number> = { kg: 1000, lb: GRAMS_PER_POUND }

export const usbPortTypes: UsbPortType[] = ['Usb2', 'Usb3', 'UsbC']

const amount = (label: string) =>
  z.number({ error: `Enter the ${label}.` }).positive(`The ${label} must be greater than 0.`)

/**
 * The form works in friendly units (16 GB, 2 TB, 8.1 kg); `toSpec` converts to the API's
 * canonical units. Limits are checked after conversion, so they hold whatever unit is chosen.
 */
export const computerFormSchema = z
  .object({
    processorId: z.number({ error: 'Choose a processor.' }),
    graphicsCardId: z.number({ error: 'Choose a graphics card.' }),
    ram: z.object({ value: amount('RAM'), unit: z.enum(['MB', 'GB']) }),
    storage: z.object({ value: amount('storage capacity'), unit: z.enum(['GB', 'TB']), type: z.enum(['Hdd', 'Ssd']) }),
    weight: z.object({ value: amount('weight'), unit: z.enum(['kg', 'lb']) }),
    psuWatts: amount('PSU wattage').int('Use whole watts.'),
    usbPorts: z.array(
      z.object({
        type: z.enum(['Usb2', 'Usb3', 'UsbC']),
        count: z
          .number({ error: 'Enter how many.' })
          .int('Use a whole number.')
          .min(1, 'At least 1.')
          .max(limits.maxPortsPerType, `At most ${limits.maxPortsPerType}.`),
      }),
    ),
  })
  .superRefine((form, ctx) => {
    const tooBig = (path: (string | number)[], ok: boolean, max: string) => {
      if (!ok) ctx.addIssue({ code: 'custom', path, message: `That's more than the maximum of ${max}.` })
    }
    tooBig(['ram', 'value'], toCanonical(form.ram.value, ramUnits[form.ram.unit]) <= limits.maxRamMb, '1 TB')
    tooBig(
      ['storage', 'value'],
      toCanonical(form.storage.value, storageUnits[form.storage.unit]) <= limits.maxStorageGb,
      '1,000 TB',
    )
    tooBig(
      ['weight', 'value'],
      toCanonical(form.weight.value, weightUnits[form.weight.unit]) <= limits.maxWeightGrams,
      '200 kg',
    )
    tooBig(['psuWatts'], form.psuWatts <= limits.maxPsuWatts, `${limits.maxPsuWatts} W`)

    const seen = new Set<UsbPortType>()
    form.usbPorts.forEach((port, i) => {
      if (seen.has(port.type)) {
        ctx.addIssue({ code: 'custom', path: ['usbPorts', i, 'type'], message: 'This port type is already listed.' })
      }
      seen.add(port.type)
    })
  })

export type ComputerFormValues = z.input<typeof computerFormSchema>

/** Converts a value in some unit (given as its size in canonical units) to a whole canonical number. */
export const toCanonical = (value: number, unitSize: number) => Math.round(value * unitSize)

/** Converts between units of the same kind, keeping the amount (rounded for display). */
export const convertUnit = (value: number, fromSize: number, toSize: number) =>
  Number(((value * fromSize) / toSize).toFixed(3))

/** Picks the largest unit that shows the value as a whole number (16384 MB → 16 GB). */
function exactUnit<U extends string>(canonical: number, units: Record<U, number>, fallback: U): { value: number; unit: U } {
  const [unit, size] = (Object.entries(units) as [U, number][])
    .sort(([, a], [, b]) => b - a)
    .find(([, size]) => canonical % size === 0) ?? [fallback, units[fallback]]
  return { value: canonical / size, unit }
}

export const emptyFormValues = (weightUnit: WeightUnit): ComputerFormValues => ({
  processorId: undefined as unknown as number,
  graphicsCardId: undefined as unknown as number,
  ram: { value: NaN, unit: 'GB' },
  storage: { value: NaN, unit: 'GB', type: 'Ssd' },
  weight: { value: NaN, unit: weightUnit },
  psuWatts: NaN,
  usbPorts: [],
})

export function toFormValues(computer: ComputerDetails, weightUnit: WeightUnit): ComputerFormValues {
  return {
    processorId: computer.processor.id,
    graphicsCardId: computer.graphicsCard.id,
    ram: exactUnit<RamUnit>(computer.ramMb, ramUnits, 'MB'),
    storage: { ...exactUnit<StorageUnit>(computer.storageCapacityGb, storageUnits, 'GB'), type: computer.storageType },
    weight: { value: convertUnit(computer.weightGrams, 1, weightUnits[weightUnit]), unit: weightUnit },
    psuWatts: computer.psuWatts,
    usbPorts: computer.usbPorts.map((p) => ({ ...p })),
  }
}

/**
 * Converts form values to what the API expects. When editing, an unchanged weight keeps the stored
 * grams: showing 8100 g as 17.9 lb and converting back would otherwise save 8119 g.
 */
export function toSpec(values: ComputerFormValues, original?: { form: ComputerFormValues; weightGrams: number }): ComputerSpec {
  const weightUnchanged =
    original !== undefined &&
    original.form.weight.value === values.weight.value &&
    original.form.weight.unit === values.weight.unit

  return {
    processorId: values.processorId,
    graphicsCardId: values.graphicsCardId,
    ramMb: toCanonical(values.ram.value, ramUnits[values.ram.unit]),
    storageCapacityGb: toCanonical(values.storage.value, storageUnits[values.storage.unit]),
    storageType: values.storage.type as StorageType,
    weightGrams: weightUnchanged ? original.weightGrams : toCanonical(values.weight.value, weightUnits[values.weight.unit]),
    psuWatts: values.psuWatts,
    usbPorts: values.usbPorts.map((p) => ({ type: p.type, count: p.count })),
  }
}

/** Where each API field's errors are shown in the form. */
const apiFieldToFormField: Record<string, string> = {
  processorId: 'processorId',
  graphicsCardId: 'graphicsCardId',
  ramMb: 'ram.value',
  storageCapacityGb: 'storage.value',
  storageType: 'storage.type',
  weightGrams: 'weight.value',
  psuWatts: 'psuWatts',
  usbPorts: 'usbPorts.root',
}

/**
 * Maps the API's field errors (already in form path style, e.g. "usbPorts.0.count") onto form fields.
 * Anything without a matching field goes to `root`, shown at the top of the form.
 */
export function toFormErrors(apiErrors: Record<string, string[]>): { field: string; message: string }[] {
  return Object.entries(apiErrors).map(([apiField, messages]) => {
    const field = apiFieldToFormField[apiField] ?? (/^usbPorts\.\d+\.(count|type)$/.test(apiField) ? apiField : 'root.server')
    return { field, message: messages.join(' ') }
  })
}
