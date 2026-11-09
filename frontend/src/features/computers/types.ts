export type StorageType = 'Hdd' | 'Ssd'
export type UsbPortType = 'Usb2' | 'Usb3' | 'UsbC'

export interface ComponentInfo {
  id: number
  manufacturer: string
  model: string
}

export interface UsbPortInfo {
  type: UsbPortType
  count: number
}

/** Mirrors the API's ComputerSummary. Measurements are in canonical units. */
export interface ComputerSummary {
  id: number
  ramMb: number
  storageCapacityGb: number
  storageType: StorageType
  weightGrams: number
  psuWatts: number
  processor: ComponentInfo
  graphicsCard: ComponentInfo
  usbPorts: UsbPortInfo[]
}

/** Sort keys the API accepts. */
export type ComputerSortField =
  | 'processor'
  | 'graphicsCard'
  | 'ramMb'
  | 'storageCapacityGb'
  | 'weightGrams'
  | 'psuWatts'

export type SortDirection = 'asc' | 'desc'

export interface SearchComputersArgs {
  page: number
  pageSize: number
  sortBy?: ComputerSortField
  sortDir?: SortDirection
}
