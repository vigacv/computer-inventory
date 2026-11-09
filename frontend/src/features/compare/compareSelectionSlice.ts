import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export const MAX_COMPARED = 4
export const MIN_COMPARED = 2

/**
 * Computers picked for comparison. Kept in Redux (not the grid) so the selection survives
 * paging, filtering and a visit to the comparison page and back.
 */
export const compareSelectionSlice = createSlice({
  name: 'compareSelection',
  initialState: { ids: [] as number[] },
  reducers: {
    /** Replaces the selection; extra ids beyond the maximum are dropped (oldest picks are kept). */
    selectionReplaced(state, action: PayloadAction<number[]>) {
      state.ids = [...new Set(action.payload)].slice(0, MAX_COMPARED)
    },
    removedFromComparison(state, action: PayloadAction<number>) {
      state.ids = state.ids.filter((id) => id !== action.payload)
    },
    comparisonCleared(state) {
      state.ids = []
    },
  },
  selectors: {
    selectComparedIds: (state) => state.ids,
  },
})

export const { selectionReplaced, removedFromComparison, comparisonCleared } = compareSelectionSlice.actions
export const { selectComparedIds } = compareSelectionSlice.selectors

/** Ids from the comparison page's URL (?ids=1,5,7): valid, distinct, at most the maximum. */
export function parseComparedIds(value: string | null): number[] {
  const ids = (value ?? '')
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((id) => Number.isInteger(id) && id > 0)
  return [...new Set(ids)].slice(0, MAX_COMPARED)
}

export const comparePath = (ids: number[]) => `/compare?ids=${ids.join(',')}`
