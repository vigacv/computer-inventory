import { detailsFixture } from '../../../test/fixtures/computers'
import { computerFormSchema, convertUnit, toFormErrors, toFormValues, toSpec, type ComputerFormValues } from './computerForm'

const valid: ComputerFormValues = {
  processorId: 5,
  graphicsCardId: 5,
  ram: { value: 16, unit: 'GB' },
  storage: { value: 2, unit: 'TB', type: 'Ssd' },
  weight: { value: 8.1, unit: 'kg' },
  psuWatts: 650,
  usbPorts: [
    { type: 'Usb3', count: 4 },
    { type: 'UsbC', count: 1 },
  ],
}

const errorsOf = (values: ComputerFormValues) => {
  const result = computerFormSchema.safeParse(values)
  return result.success ? {} : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]))
}

describe('toFormValues', () => {
  it('shows sizes in the largest unit that keeps a whole number', () => {
    const values = toFormValues(detailsFixture({ ramMb: 32768, storageCapacityGb: 2000 }), 'kg')
    expect(values.ram).toEqual({ value: 32, unit: 'GB' })
    expect(values.storage).toEqual({ value: 2, unit: 'TB', type: 'Ssd' })
  })

  it('keeps smaller units when the larger one would be fractional', () => {
    const values = toFormValues(detailsFixture({ ramMb: 512, storageCapacityGb: 750 }), 'kg')
    expect(values.ram).toEqual({ value: 512, unit: 'MB' })
    expect(values.storage.unit).toBe('GB')
  })

  it('shows weight in the preferred unit', () => {
    expect(toFormValues(detailsFixture({ weightGrams: 7257 }), 'lb').weight).toEqual({ value: 15.999, unit: 'lb' })
    expect(toFormValues(detailsFixture({ weightGrams: 8100 }), 'kg').weight).toEqual({ value: 8.1, unit: 'kg' })
  })
})

describe('toSpec', () => {
  it('converts to the API units', () => {
    expect(toSpec(valid)).toEqual({
      processorId: 5,
      graphicsCardId: 5,
      ramMb: 16384,
      storageCapacityGb: 2000,
      storageType: 'Ssd',
      weightGrams: 8100,
      psuWatts: 650,
      usbPorts: [
        { type: 'Usb3', count: 4 },
        { type: 'UsbC', count: 1 },
      ],
    })
  })

  it('converts pounds to grams', () => {
    expect(toSpec({ ...valid, weight: { value: 16, unit: 'lb' } }).weightGrams).toBe(7257)
  })

  it('keeps the stored grams when the weight was not touched', () => {
    const computer = detailsFixture({ weightGrams: 8100 })
    const form = toFormValues(computer, 'lb') // 17.857 lb: converting back would give 8100 ± rounding
    expect(toSpec(form, { form, weightGrams: 8100 }).weightGrams).toBe(8100)
  })

  it('uses the new weight when it was changed', () => {
    const form = toFormValues(detailsFixture({ weightGrams: 8100 }), 'kg')
    expect(toSpec({ ...form, weight: { value: 9, unit: 'kg' } }, { form, weightGrams: 8100 }).weightGrams).toBe(9000)
  })
})

describe('convertUnit', () => {
  it('keeps the amount when switching units', () => {
    expect(convertUnit(16, 1024, 1)).toBe(16384)
    expect(convertUnit(2, 1000, 1)).toBe(2000)
    expect(convertUnit(1, 1000, 453.59237)).toBe(2.205)
  })
})

describe('computerFormSchema', () => {
  it('accepts a complete form', () => expect(errorsOf(valid)).toEqual({}))

  it('requires components and amounts', () => {
    const errors = errorsOf({
      ...valid,
      processorId: undefined as unknown as number,
      ram: { value: NaN, unit: 'GB' },
      psuWatts: 0,
    })
    expect(errors).toMatchObject({
      processorId: 'Choose a processor.',
      'ram.value': 'Enter the RAM.',
      psuWatts: 'The PSU wattage must be greater than 0.',
    })
  })

  it('checks limits after converting units', () => {
    expect(errorsOf({ ...valid, ram: { value: 1024, unit: 'GB' } })).toEqual({})
    expect(errorsOf({ ...valid, ram: { value: 1025, unit: 'GB' } })).toHaveProperty('ram.value')
    expect(errorsOf({ ...valid, weight: { value: 450, unit: 'lb' } })).toHaveProperty('weight.value')
  })

  it('rejects repeated USB port types on the repeated row', () => {
    const errors = errorsOf({
      ...valid,
      usbPorts: [
        { type: 'Usb3', count: 1 },
        { type: 'Usb3', count: 2 },
      ],
    })
    expect(errors).toEqual({ 'usbPorts.1.type': 'This port type is already listed.' })
  })

  it('validates USB port counts', () => {
    expect(errorsOf({ ...valid, usbPorts: [{ type: 'Usb2', count: 0 }] })).toEqual({ 'usbPorts.0.count': 'At least 1.' })
    expect(errorsOf({ ...valid, usbPorts: [{ type: 'Usb2', count: 1.5 }] })).toEqual({
      'usbPorts.0.count': 'Use a whole number.',
    })
  })
})

describe('toFormErrors', () => {
  it('maps API fields to form fields', () => {
    expect(
      toFormErrors({
        ramMb: ['Too much RAM.'],
        'usbPorts.0.count': ['At most 50.'],
        usbPorts: ['Each USB port type can only be listed once.'],
        rowVersion: ['RowVersion is required.'],
      }),
    ).toEqual([
      { field: 'ram.value', message: 'Too much RAM.' },
      { field: 'usbPorts.0.count', message: 'At most 50.' },
      { field: 'usbPorts.root', message: 'Each USB port type can only be listed once.' },
      { field: 'root.server', message: 'RowVersion is required.' },
    ])
  })
})
