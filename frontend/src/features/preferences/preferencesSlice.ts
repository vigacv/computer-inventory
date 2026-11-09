import { createListenerMiddleware, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { WeightUnit } from '../../utils/format'

const STORAGE_KEY = 'computer-inventory:preferences'

export interface PreferencesState {
  weightUnit: WeightUnit
}

const defaults: PreferencesState = { weightUnit: 'kg' }

/** Saved preferences, or the defaults if there are none or they can't be read (private mode, bad JSON). */
export function loadPreferences(): PreferencesState {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<PreferencesState>
    return { weightUnit: saved.weightUnit === 'lb' ? 'lb' : defaults.weightUnit }
  } catch {
    return defaults
  }
}

/** Display preferences shared by the grid and the details view, remembered across visits. */
export const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: loadPreferences,
  reducers: {
    weightUnitChanged(state, action: PayloadAction<WeightUnit>) {
      state.weightUnit = action.payload
    },
  },
  selectors: {
    selectWeightUnit: (state) => state.weightUnit,
  },
})

export const { weightUnitChanged } = preferencesSlice.actions
export const { selectWeightUnit } = preferencesSlice.selectors

/** Saves preferences whenever they change, keeping the reducer free of side effects. */
export const preferencesPersistence = createListenerMiddleware()
preferencesPersistence.startListening({
  actionCreator: weightUnitChanged,
  effect: (_action, api) => {
    const { preferences } = api.getState() as { preferences: PreferencesState }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch {
      // Storage unavailable (e.g. private mode): the preference just won't survive a reload.
    }
  },
})
