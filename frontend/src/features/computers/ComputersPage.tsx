import AddIcon from '@mui/icons-material/Add'
import { Button, Paper, Stack, Typography } from '@mui/material'
import { Suspense, useState } from 'react'
import { Outlet } from 'react-router'
import { getErrorMessage } from '../../api/errors'
import { useAppSelector } from '../../app/hooks'
import { ErrorState } from '../../components/ErrorState'
import { WeightUnitToggle } from '../preferences/WeightUnitToggle'
import { AddComputerDialog } from './AddComputerDialog'
import { ComputerFilters } from './ComputerFilters'
import { useSearchComputersQuery } from './computersApi'
import { selectActiveFilterCount, selectComputersQuery } from './computersQuerySlice'
import { ComputerGrid } from './ComputerGrid'
import { useComputerNavigation } from './useComputerNavigation'
import { useQueryUrlSync } from './useQueryUrlSync'

export function ComputersPage() {
  const urlLoaded = useQueryUrlSync()
  const query = useAppSelector(selectComputersQuery)
  const filtering = useAppSelector(selectActiveFilterCount) > 0
  // Wait for the URL's search/filters before the first fetch, so a shared link doesn't fetch twice.
  const { data, isFetching, isError, error, refetch } = useSearchComputersQuery(query, { skip: !urlLoaded })
  const { openDetails } = useComputerNavigation()
  const [adding, setAdding] = useState(false)

  const total = data?.totalCount ?? 0
  const countLabel = `${total} ${filtering ? 'matching ' : ''}${total === 1 ? 'computer' : 'computers'}`

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
        <Typography variant="h5" component="h2" sx={{ flexGrow: 1 }}>
          Computers
        </Typography>
        {data && (
          <Typography variant="body2" color="text.secondary" role="status">
            {countLabel}
          </Typography>
        )}
        <WeightUnitToggle />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAdding(true)}>
          Add computer
        </Button>
      </Stack>

      <ComputerFilters />

      {isError && <ErrorState message={getErrorMessage(error)} onRetry={refetch} />}

      <Paper variant="outlined" sx={{ height: 640 }}>
        <ComputerGrid
          rows={data?.items ?? []}
          rowCount={total}
          loading={isFetching}
          noRowsLabel={filtering ? 'No computers match your search and filters.' : 'No computers yet.'}
        />
      </Paper>

      {/* Details drawer for /computers/:id renders here, over the list. Its own Suspense boundary
          keeps the list visible while the drawer's code loads. */}
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>

      {adding && (
        <AddComputerDialog
          onClose={() => setAdding(false)}
          onAdded={(id) => {
            setAdding(false)
            openDetails(id)
          }}
        />
      )}
    </Stack>
  )
}
