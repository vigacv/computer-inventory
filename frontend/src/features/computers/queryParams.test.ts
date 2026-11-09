import { parseQueryParams, toQueryParams } from './queryParams'

const parse = (qs: string) => parseQueryParams(new URLSearchParams(qs))

describe('parseQueryParams', () => {
  it('uses defaults for an empty URL', () => {
    expect(parse('')).toEqual({ page: 1, pageSize: 25 })
  })

  it('reads every supported parameter', () => {
    expect(
      parse(
        'search=gtx&minRamMb=8192&maxRamMb=32768&minStorageGb=500&maxStorageGb=2000&storageType=Ssd' +
          '&processorManufacturerId=1&graphicsCardManufacturerId=3&usbPortType=UsbC&minPsuWatts=500' +
          '&sortBy=ramMb&sortDir=desc&page=2&pageSize=50',
      ),
    ).toEqual({
      search: 'gtx',
      minRamMb: 8192,
      maxRamMb: 32768,
      minStorageGb: 500,
      maxStorageGb: 2000,
      storageType: 'Ssd',
      processorManufacturerId: 1,
      graphicsCardManufacturerId: 3,
      usbPortType: 'UsbC',
      minPsuWatts: 500,
      sortBy: 'ramMb',
      sortDir: 'desc',
      page: 2,
      pageSize: 50,
    })
  })

  it('ignores invalid values instead of breaking the page', () => {
    expect(
      parse('minRamMb=lots&storageType=Floppy&usbPortType=&page=-2&pageSize=1000&sortBy=price&search=%20%20'),
    ).toEqual({ page: 1, pageSize: 25 })
  })

  it('defaults the sort direction and drops it without a sort field', () => {
    expect(parse('sortBy=psuWatts')).toMatchObject({ sortBy: 'psuWatts', sortDir: 'asc' })
    expect(parse('sortDir=desc')).not.toHaveProperty('sortDir')
  })
})

describe('toQueryParams', () => {
  it('leaves out defaults', () => {
    expect(toQueryParams({ page: 1, pageSize: 25 }).toString()).toBe('')
  })

  it('round-trips through the URL', () => {
    const query = {
      page: 3,
      pageSize: 10,
      sortBy: 'processor' as const,
      sortDir: 'desc' as const,
      search: 'intel radeon',
      minRamMb: 8192,
      storageType: 'Hdd' as const,
      usbPortType: 'Usb3' as const,
    }
    expect(parseQueryParams(toQueryParams(query))).toEqual(query)
  })
})
