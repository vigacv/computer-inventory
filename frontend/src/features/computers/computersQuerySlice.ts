import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ComputerSortField, SearchComputersArgs, SortDirection } from './types'

/**
 * What the user is currently looking at in the computers list: page and sort for now,
 * search and filters later. Kept in Redux so the grid, the filter bar and the URL can share it.
 */
export type ComputersQueryState = SearchComputersArgs

export const initialComputersQuery: ComputersQueryState = { page: 1, pageSize: 25 }

export const computersQuerySlice = createSlice({
  name: 'computersQuery',
  initialState: initialComputersQuery,
  reducers: {
    pageChanged(state, action: PayloadAction<{ page: number; pageSize: number }>) {
      // A new page size invalidates the current page number.
      state.page = action.payload.pageSize === state.pageSize ? action.payload.page : 1
      state.pageSize = action.payload.pageSize
    },
    sortChanged(state, action: PayloadAction<{ sortBy: ComputerSortField; sortDir: SortDirection } | null>) {
      state.sortBy = action.payload?.sortBy
      state.sortDir = action.payload?.sortDir
      state.page = 1
    },
  },
  selectors: {
    selectComputersQuery: (state) => state,
  },
})

export const { pageChanged, sortChanged } = computersQuerySlice.actions
export const { selectComputersQuery } = computersQuerySlice.selectors
