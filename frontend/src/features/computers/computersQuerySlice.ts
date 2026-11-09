import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { ComputerFilters, ComputerSortField, SearchComputersArgs, SortDirection } from './types'

/**
 * What the user is currently looking at in the computers list: search, filters, sort and page.
 * Kept in Redux so the filter bar, the grid and the URL all share one source of truth.
 */
export type ComputersQueryState = SearchComputersArgs

export const initialComputersQuery: ComputersQueryState = { page: 1, pageSize: 25 }

export const filterKeys = [
  'search',
  'minRamMb',
  'maxRamMb',
  'minStorageGb',
  'maxStorageGb',
  'storageType',
  'processorManufacturerId',
  'graphicsCardManufacturerId',
  'usbPortType',
  'minPsuWatts',
] as const satisfies readonly (keyof ComputerFilters)[]

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
    /** Sets the given filters; `undefined` (or an empty search) clears one. Results start again from page 1. */
    filtersChanged(state, action: PayloadAction<ComputerFilters>) {
      for (const [key, value] of Object.entries(action.payload)) {
        const empty = value === undefined || (typeof value === 'string' && value.trim() === '')
        if (empty) delete state[key as keyof ComputerFilters]
        else Object.assign(state, { [key]: typeof value === 'string' ? value.trim() : value })
      }
      state.page = 1
    },
    /** Clears search and filters but keeps sort and page size. */
    filtersCleared(state) {
      for (const key of filterKeys) delete state[key]
      state.page = 1
    },
    /** Replaces the whole query, e.g. when restoring it from the URL. */
    queryReplaced(_state, action: PayloadAction<ComputersQueryState>) {
      return action.payload
    },
  },
  selectors: {
    selectComputersQuery: (state) => state,
    selectActiveFilterCount: (state) => filterKeys.filter((key) => state[key] !== undefined).length,
  },
})

export const { pageChanged, sortChanged, filtersChanged, filtersCleared, queryReplaced } = computersQuerySlice.actions
export const { selectComputersQuery, selectActiveFilterCount } = computersQuerySlice.selectors
