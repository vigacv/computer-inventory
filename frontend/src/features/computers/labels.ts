import { formatCapacity } from '../../utils/format'
import type { ComponentInfo, StorageType, UsbPortInfo, UsbPortType } from './types'

export const storageTypeLabels: Record<StorageType, string> = { Hdd: 'HDD', Ssd: 'SSD' }

export const usbPortTypeLabels: Record<UsbPortType, string> = { Usb2: 'USB 2.0', Usb3: 'USB 3.0', UsbC: 'USB-C' }

/** "1 TB SSD" */
export const formatStorage = (gb: number, type: StorageType) => `${formatCapacity(gb)} ${storageTypeLabels[type]}`

/** "Intel Core i5-6400" */
export const formatComponent = (c: ComponentInfo) => `${c.manufacturer} ${c.model}`

/** "4× USB 2.0 · 2× USB 3.0" */
export const formatUsbPorts = (ports: UsbPortInfo[]) =>
  ports.length === 0 ? 'None' : ports.map((p) => `${p.count}× ${usbPortTypeLabels[p.type]}`).join(' · ')
