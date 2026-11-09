import { Paper, Stack, Typography } from '@mui/material'
import { getErrorMessage } from '../../api/errors'
import { useAppSelector } from '../../app/hooks'
import { ErrorState } from '../../components/ErrorState'
import { ComputerFilters } from './ComputerFilters'
import { useSearchComputersQuery } from './computersApi'
import { selectActiveFilterCount, selectComputersQuery } from './computersQuerySlice'
import { ComputerGrid } from './ComputerGrid'
import { useQueryUrlSync } from './useQueryUrlSync'

export function ComputersPage() {
  const urlLoaded = useQueryUrlSync()
  const query = useAppSelector(selectComputersQuery)
  const filtering = useAppSelector(selectActiveFilterCount) > 0
  // Wait for the URL's search/filters before the first fetch, so a shared link doesn't fetch twice.
  const { data, isFetching, isError, error, refetch } = useSearchComputersQuery(query, { skip: !urlLoaded })

  const total = data?.totalCount ?? 0
  const countLabel = `${total} ${filtering ? 'matching ' : ''}${total === 1 ? 'computer' : 'computers'}`

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Typography variant="h5" component="h2">
          Computers
        </Typography>
        {data && (
          <Typography variant="body2" color="text.secondary" role="status">
            {countLabel}
          </Typography>
        )}
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
    </Stack>
  )
}
