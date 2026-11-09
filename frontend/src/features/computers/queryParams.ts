import { filterKeys, initialComputersQuery, type ComputersQueryState } from './computersQuerySlice'
import type { ComputerSortField, StorageType, UsbPortType } from './types'

const sortFields: readonly ComputerSortField[] = [
  'processor',
  'graphicsCard',
  'ramMb',
  'storageCapacityGb',
  'weightGrams',
  'psuWatts',
]
const storageTypes: readonly StorageType[] = ['Hdd', 'Ssd']
const usbPortTypes: readonly UsbPortType[] = ['Usb2', 'Usb3', 'UsbC']
const pageSizes = [10, 25, 50]

const positiveInt = (value: string | null) => {
  const n = Number(value)
  return value !== null && Number.isInteger(n) && n > 0 ? n : undefined
}

const oneOf = <T extends string>(allowed: readonly T[], value: string | null) =>
  allowed.includes(value as T) ? (value as T) : undefined

/**
 * Reads the list state from the URL. Anything missing or invalid falls back to the default,
 * so a hand-edited or outdated link never breaks the page.
 */
export function parseQueryParams(params: URLSearchParams): ComputersQueryState {
  const pageSize = positiveInt(params.get('pageSize'))
  const sortBy = oneOf(sortFields, params.get('sortBy'))

  const query: ComputersQueryState = {
    page: positiveInt(params.get('page')) ?? initialComputersQuery.page,
    pageSize: pageSize && pageSizes.includes(pageSize) ? pageSize : initialComputersQuery.pageSize,
    sortBy,
    sortDir: sortBy ? (oneOf(['asc', 'desc'], params.get('sortDir')) ?? 'asc') : undefined,
    search: params.get('search')?.trim() || undefined,
    minRamMb: positiveInt(params.get('minRamMb')),
    maxRamMb: positiveInt(params.get('maxRamMb')),
    minStorageGb: positiveInt(params.get('minStorageGb')),
    maxStorageGb: positiveInt(params.get('maxStorageGb')),
    storageType: oneOf(storageTypes, params.get('storageType')),
    processorManufacturerId: positiveInt(params.get('processorManufacturerId')),
    graphicsCardManufacturerId: positiveInt(params.get('graphicsCardManufacturerId')),
    usbPortType: oneOf(usbPortTypes, params.get('usbPortType')),
    minPsuWatts: positiveInt(params.get('minPsuWatts')),
  }

  // Drop empty keys so the state matches what the reducers produce.
  return Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined)) as ComputersQueryState
}

/** Writes the list state to the URL, leaving out defaults to keep links short. */
export function toQueryParams(query: ComputersQueryState): URLSearchParams {
  const params = new URLSearchParams()
  for (const key of filterKeys) {
    const value = query[key]
    if (value !== undefined) params.set(key, String(value))
  }
  if (query.sortBy) {
    params.set('sortBy', query.sortBy)
    params.set('sortDir', query.sortDir ?? 'asc')
  }
  if (query.page !== initialComputersQuery.page) params.set('page', String(query.page))
  if (query.pageSize !== initialComputersQuery.pageSize) params.set('pageSize', String(query.pageSize))
  return params
}
