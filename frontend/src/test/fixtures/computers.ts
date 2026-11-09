import type { PagedResult } from '../../api/types'
import type { ComputerDetails, ComputerSummary } from '../../features/computers/types'

export const computerFixture = (overrides: Partial<ComputerSummary> = {}): ComputerSummary => ({
  id: 1,
  ramMb: 8192,
  storageCapacityGb: 1000,
  storageType: 'Ssd',
  weightGrams: 8100,
  psuWatts: 500,
  processor: { id: 1, manufacturer: 'Intel', model: 'Celeron N3050' },
  graphicsCard: { id: 1, manufacturer: 'NVIDIA', model: 'GeForce GTX 770' },
  usbPorts: [
    { type: 'Usb2', count: 4 },
    { type: 'Usb3', count: 2 },
  ],
  ...overrides,
})

export const pageOf = (items: ComputerSummary[], page = 1, pageSize = 25, totalCount = items.length): PagedResult<ComputerSummary> => ({
  items,
  page,
  pageSize,
  totalCount,
  totalPages: Math.ceil(totalCount / pageSize),
})

/** Computer #5 with full details, as GET /api/computers/5 returns it. */
export const detailsFixture = (overrides: Partial<ComputerDetails> = {}): ComputerDetails => ({
  ...computerFixture({
    id: 5,
    ramMb: 32768,
    storageCapacityGb: 750,
    weightGrams: 7000,
    psuWatts: 1000,
    processor: { id: 5, manufacturer: 'AMD', model: 'FX-8370' },
    graphicsCard: { id: 5, manufacturer: 'AMD', model: 'Radeon RX 480' },
    usbPorts: [
      { type: 'Usb2', count: 2 },
      { type: 'Usb3', count: 2 },
      { type: 'UsbC', count: 1 },
    ],
  }),
  createdAt: '2026-11-09T01:13:52+00:00',
  updatedAt: '2026-11-10T09:30:00+00:00',
  rowVersion: 'AAAAAAAAB9E=',
  ...overrides,
})
