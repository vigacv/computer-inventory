import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { baseApi } from '../api/baseApi'
import { errorNotifier } from '../api/errorNotifier'
import { computersQuerySlice } from '../features/computers/computersQuerySlice'
import { preferencesPersistence, preferencesSlice } from '../features/preferences/preferencesSlice'

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  [computersQuerySlice.reducerPath]: computersQuerySlice.reducer,
  [preferencesSlice.reducerPath]: preferencesSlice.reducer,
})

export type RootState = ReturnType<typeof rootReducer>

export const makeStore = (preloadedState?: Partial<RootState>) =>
  configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefault) =>
      getDefault().prepend(preferencesPersistence.middleware).concat(baseApi.middleware, errorNotifier),
  })

export const store = makeStore()
setupListeners(store.dispatch)

export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']
