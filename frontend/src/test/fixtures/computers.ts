import type { PagedResult } from '../../api/types'
import type { ComputerSummary } from '../../features/computers/types'

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
