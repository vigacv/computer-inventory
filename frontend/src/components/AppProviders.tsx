import { CssBaseline, ThemeProvider } from '@mui/material'
import { SnackbarProvider } from 'notistack'
import type { ReactNode } from 'react'
import { Provider } from 'react-redux'
import type { AppStore } from '../app/store'
import { theme } from '../theme'

/** Every provider the app needs. Shared by main.tsx and the test render helper. */
export function AppProviders({ store, children }: { store: AppStore; children: ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          {children}
        </SnackbarProvider>
      </ThemeProvider>
    </Provider>
  )
}
