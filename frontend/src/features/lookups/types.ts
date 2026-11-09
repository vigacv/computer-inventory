import type { StorageType, UsbPortType } from '../computers/types'

export interface Manufacturer {
  id: number
  name: string
  makesProcessors: boolean
  makesGraphicsCards: boolean
}

/** Mirrors the API's GetLookups.Response. */
export interface Lookups {
  manufacturers: Manufacturer[]
  storageTypes: StorageType[]
  usbPortTypes: UsbPortType[]
}
