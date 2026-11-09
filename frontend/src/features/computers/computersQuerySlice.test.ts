import { computersQuerySlice, initialComputersQuery, pageChanged, sortChanged } from './computersQuerySlice'

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
})
