import { detailsFixture } from '../../test/fixtures/computers'
import { bestIndexes, compareRows, rowDiffers } from './compareRows'

const row = (key: string) => compareRows.find((r) => r.key === key)!

const light = detailsFixture({ id: 1, ramMb: 8192, weightGrams: 3000, storageType: 'Hdd', psuWatts: 500 })
const heavy = detailsFixture({ id: 2, ramMb: 32768, weightGrams: 9000, storageType: 'Ssd', psuWatts: 500 })
const tied = detailsFixture({ id: 3, ramMb: 32768, weightGrams: 5000, storageType: 'Ssd', psuWatts: 500 })

describe('bestIndexes', () => {
  it('picks the highest when more is better', () => {
    expect(bestIndexes(row('ram'), [light, heavy])).toEqual(new Set([1]))
  })

  it('picks the lowest when less is better', () => {
    expect(bestIndexes(row('weight'), [light, heavy, tied])).toEqual(new Set([0]))
  })

  it('marks every computer sharing the best value', () => {
    expect(bestIndexes(row('ram'), [light, heavy, tied])).toEqual(new Set([1, 2]))
  })

  it('ranks SSD above HDD', () => {
    expect(bestIndexes(row('storageType'), [light, heavy])).toEqual(new Set([1]))
  })

  it('marks nothing when all values are equal', () => {
    expect(bestIndexes(row('psu'), [light, heavy, tied])).toEqual(new Set())
  })

  it('does not rank descriptive rows', () => {
    expect(bestIndexes(row('processor'), [light, heavy])).toEqual(new Set())
  })

  it('counts missing USB port types as zero', () => {
    const noUsbC = detailsFixture({ id: 4, usbPorts: [{ type: 'Usb2', count: 2 }] })
    const oneUsbC = detailsFixture({ id: 5, usbPorts: [{ type: 'UsbC', count: 1 }] })
    expect(row('usb-UsbC').display(noUsbC, 'kg')).toBe('0')
    expect(bestIndexes(row('usb-UsbC'), [noUsbC, oneUsbC])).toEqual(new Set([1]))
  })
})

describe('rowDiffers', () => {
  it('compares what is shown, in the chosen unit', () => {
    expect(rowDiffers(row('psu'), [light, heavy], 'kg')).toBe(false)
    expect(rowDiffers(row('weight'), [light, heavy], 'lb')).toBe(true)
  })
})
