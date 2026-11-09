import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { makeStore, type RootState } from '../app/store'
import { AppProviders } from '../components/AppProviders'

interface Options extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>
  route?: string
}

/** Renders with a fresh store (no cache shared between tests), theme, snackbars and router. */
export function renderWithProviders(ui: ReactElement, { preloadedState, route = '/', ...options }: Options = {}) {
  const store = makeStore(preloadedState)
  const result = render(ui, {
    wrapper: ({ children }) => (
      <AppProviders store={store}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </AppProviders>
    ),
    ...options,
  })
  return { store, ...result }
}
