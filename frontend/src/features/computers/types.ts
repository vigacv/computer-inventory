export type StorageType = 'Hdd' | 'Ssd'
export type UsbPortType = 'Usb2' | 'Usb3' | 'UsbC'

export interface ComponentInfo {
  id: number
  manufacturer: string
  model: string
}

/** A processor or graphics card to add; an unknown manufacturer name creates the manufacturer. */
export interface NewComponent {
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

/** Mirrors the API's GetComputer.Response. */
export interface ComputerDetails extends ComputerSummary {
  createdAt: string
  updatedAt: string
  /** Opaque concurrency token (base64). Send it back unchanged when updating. */
  rowVersion: string
}

/** The editable part of a computer, as the API expects it (canonical units, ids for components). */
export interface ComputerSpec {
  ramMb: number
  storageCapacityGb: number
  storageType: StorageType
  weightGrams: number
  psuWatts: number
  processorId: number
  graphicsCardId: number
  usbPorts: UsbPortInfo[]
}

export interface UpdateComputerArgs {
  id: number
  spec: ComputerSpec
  rowVersion: string
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

/** Optional filters, combined with AND by the API. Measurements in canonical units. */
export interface ComputerFilters {
  search?: string
  minRamMb?: number
  maxRamMb?: number
  minStorageGb?: number
  maxStorageGb?: number
  storageType?: StorageType
  processorManufacturerId?: number
  graphicsCardManufacturerId?: number
  usbPortType?: UsbPortType
  minPsuWatts?: number
}

export interface SearchComputersArgs extends ComputerFilters {
  page: number
  pageSize: number
  sortBy?: ComputerSortField
  sortDir?: SortDirection
}

/** Mirrors the API's CompareComputers.Response. */
export interface CompareResult {
  /** In the requested order. */
  computers: ComputerDetails[]
  /** Requested ids that don't exist (e.g. deleted since the link was shared). */
  notFound: number[]
}
