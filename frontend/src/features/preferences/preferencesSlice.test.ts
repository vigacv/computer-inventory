import { makeStore } from '../../app/store'
import { loadPreferences, preferencesSlice, weightUnitChanged } from './preferencesSlice'

const KEY = 'computer-inventory:preferences'

describe('preferences', () => {
  beforeEach(() => localStorage.clear())

  it('defaults to kilograms', () => {
    expect(loadPreferences()).toEqual({ weightUnit: 'kg' })
  })

  it('restores the saved unit', () => {
    localStorage.setItem(KEY, JSON.stringify({ weightUnit: 'lb' }))
    expect(loadPreferences()).toEqual({ weightUnit: 'lb' })
  })

  it('ignores corrupt or unknown saved values', () => {
    localStorage.setItem(KEY, '{not json')
    expect(loadPreferences()).toEqual({ weightUnit: 'kg' })
    localStorage.setItem(KEY, JSON.stringify({ weightUnit: 'stone' }))
    expect(loadPreferences()).toEqual({ weightUnit: 'kg' })
  })

  it('saves the unit when it changes', () => {
    const store = makeStore()

    store.dispatch(weightUnitChanged('lb'))

    expect(preferencesSlice.selectors.selectWeightUnit(store.getState())).toBe('lb')
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ weightUnit: 'lb' })
  })
})
