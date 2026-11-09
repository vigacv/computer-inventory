import {
  computersQuerySlice,
  filtersChanged,
  filtersCleared,
  initialComputersQuery,
  pageChanged,
  queryReplaced,
  sortChanged,
} from './computersQuerySlice'

const reduce = computersQuerySlice.reducer

describe('computersQuerySlice', () => {
  it('changes page', () => {
    expect(reduce(initialComputersQuery, pageChanged({ page: 3, pageSize: 25 }))).toMatchObject({ page: 3, pageSize: 25 })
  })

  it('goes back to the first page when the page size changes', () => {
    const onPage3 = { ...initialComputersQuery, page: 3 }
    expect(reduce(onPage3, pageChanged({ page: 3, pageSize: 50 }))).toMatchObject({ page: 1, pageSize: 50 })
  })

  it('sets the sort and goes back to the first page', () => {
    const onPage3 = { ...initialComputersQuery, page: 3 }
    expect(reduce(onPage3, sortChanged({ sortBy: 'ramMb', sortDir: 'desc' }))).toMatchObject({
      page: 1,
      sortBy: 'ramMb',
      sortDir: 'desc',
    })
  })

  it('clears the sort', () => {
    const sorted = { ...initialComputersQuery, sortBy: 'ramMb' as const, sortDir: 'asc' as const }
    const state = reduce(sorted, sortChanged(null))
    expect(state.sortBy).toBeUndefined()
    expect(state.sortDir).toBeUndefined()
  })

  describe('filters', () => {
    const onPage3 = { ...initialComputersQuery, page: 3 }

    it('sets filters, trims search and goes back to the first page', () => {
      expect(reduce(onPage3, filtersChanged({ search: '  gtx ', storageType: 'Ssd', minRamMb: 8192 }))).toEqual({
        page: 1,
        pageSize: 25,
        search: 'gtx',
        storageType: 'Ssd',
        minRamMb: 8192,
      })
    })

    it('removes filters set to undefined or an empty search', () => {
      const filtered = { ...initialComputersQuery, search: 'gtx', minRamMb: 8192, storageType: 'Ssd' as const }
      expect(reduce(filtered, filtersChanged({ search: '  ', minRamMb: undefined }))).toEqual({
        page: 1,
        pageSize: 25,
        storageType: 'Ssd',
      })
    })

    it('clears every filter but keeps sort and page size', () => {
      const state = {
        page: 4,
        pageSize: 50,
        sortBy: 'ramMb' as const,
        sortDir: 'desc' as const,
        search: 'amd',
        usbPortType: 'UsbC' as const,
        minPsuWatts: 500,
      }
      expect(reduce(state, filtersCleared())).toEqual({ page: 1, pageSize: 50, sortBy: 'ramMb', sortDir: 'desc' })
    })

    it('counts active filters', () => {
      const state = reduce(initialComputersQuery, filtersChanged({ search: 'gtx', minRamMb: 1024, maxRamMb: 4096 }))
      expect(computersQuerySlice.selectors.selectActiveFilterCount({ computersQuery: state })).toBe(3)
    })

    it('replaces the whole query', () => {
      const restored = { page: 2, pageSize: 10, search: 'intel' }
      expect(reduce(onPage3, queryReplaced(restored))).toEqual(restored)
    })
  })
})
