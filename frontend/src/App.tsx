import { LinearProgress, Typography } from '@mui/material'
import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'

// Route-level code splitting: the data grid only loads with the page that uses it.
const ComputersPage = lazy(() =>
  import('./features/computers/ComputersPage').then((m) => ({ default: m.ComputersPage })),
)

export default function App() {
  return (
    <AppShell>
      <Suspense fallback={<LinearProgress aria-label="Loading page" />}>
        <Routes>
          <Route path="/" element={<ComputersPage />} />
          <Route path="*" element={<Typography>Page not found.</Typography>} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}
