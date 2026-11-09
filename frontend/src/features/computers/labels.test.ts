import { formatComponent, formatStorage, formatUsbPorts } from './labels'

describe('computer labels', () => {
  it('formats storage with capacity and type', () => {
    expect(formatStorage(1000, 'Ssd')).toBe('1 TB SSD')
    expect(formatStorage(750, 'Hdd')).toBe('750 GB HDD')
  })

  it('formats a component with its manufacturer', () => {
    expect(formatComponent({ id: 1, manufacturer: 'AMD', model: 'Radeon RX 480' })).toBe('AMD Radeon RX 480')
  })

  it('summarises USB ports', () => {
    expect(
      formatUsbPorts([
        { type: 'Usb3', count: 2 },
        { type: 'UsbC', count: 1 },
      ]),
    ).toBe('2× USB 3.0 · 1× USB-C')
    expect(formatUsbPorts([])).toBe('None')
  })
})
