import { LinearProgress, Typography } from '@mui/material'
import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'

// Route-level code splitting: the data grid only loads with the page that uses it.
const ComputersPage = lazy(() =>
  import('./features/computers/ComputersPage').then((m) => ({ default: m.ComputersPage })),
)
const ComputerDetailsDrawer = lazy(() =>
  import('./features/computers/ComputerDetailsDrawer').then((m) => ({ default: m.ComputerDetailsDrawer })),
)

export default function App() {
  return (
    <AppShell>
      <Suspense fallback={<LinearProgress aria-label="Loading page" />}>
        <Routes>
          {/* The list stays mounted while details open and close, keeping its state and scroll. */}
          <Route path="/" element={<ComputersPage />}>
            <Route path="computers/:id" element={<ComputerDetailsDrawer />} />
          </Route>
          <Route path="*" element={<Typography>Page not found.</Typography>} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}
