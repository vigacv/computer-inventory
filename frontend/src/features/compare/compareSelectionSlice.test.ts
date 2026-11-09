import {
  compareSelectionSlice,
  comparisonCleared,
  parseComparedIds,
  removedFromComparison,
  selectionReplaced,
} from './compareSelectionSlice'

const reduce = compareSelectionSlice.reducer
const empty = { ids: [] as number[] }

describe('compareSelectionSlice', () => {
  it('keeps at most four distinct computers', () => {
    expect(reduce(empty, selectionReplaced([3, 1, 3, 7, 9, 12])).ids).toEqual([3, 1, 7, 9])
  })

  it('removes one and clears all', () => {
    const state = reduce(empty, selectionReplaced([1, 2, 3]))
    expect(reduce(state, removedFromComparison(2)).ids).toEqual([1, 3])
    expect(reduce(state, comparisonCleared()).ids).toEqual([])
  })
})

describe('parseComparedIds', () => {
  it.each([
    ['1,5,7', [1, 5, 7]],
    [' 5 , 5, 2', [5, 2]],
    ['1,x,0,-3,2.5,4', [1, 4]],
    ['1,2,3,4,5', [1, 2, 3, 4]],
    [null, []],
  ])('%s -> %o', (value, expected) => expect(parseComparedIds(value)).toEqual(expected))
})
