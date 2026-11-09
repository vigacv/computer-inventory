import type { Lookups } from '../../features/lookups/types'

export const lookupsFixture: Lookups = {
  manufacturers: [
    { id: 2, name: 'AMD', makesProcessors: true, makesGraphicsCards: true },
    { id: 1, name: 'Intel', makesProcessors: true, makesGraphicsCards: false },
    { id: 3, name: 'NVIDIA', makesProcessors: false, makesGraphicsCards: true },
  ],
  storageTypes: ['Hdd', 'Ssd'],
  usbPortTypes: ['Usb2', 'Usb3', 'UsbC'],
}
