import { Paper, Stack, Typography } from '@mui/material'
import { getErrorMessage } from '../../api/errors'
import { useAppSelector } from '../../app/hooks'
import { ErrorState } from '../../components/ErrorState'
import { useSearchComputersQuery } from './computersApi'
import { selectComputersQuery } from './computersQuerySlice'
import { ComputerGrid } from './ComputerGrid'

export function ComputersPage() {
  const query = useAppSelector(selectComputersQuery)
  const { data, isFetching, isError, error, refetch } = useSearchComputersQuery(query)

  return (
    <Stack spacing={2}>
      <Stack direction="row" sx={{ alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Typography variant="h5" component="h2">
          Computers
        </Typography>
        {data && (
          <Typography variant="body2" color="text.secondary">
            {data.totalCount} {data.totalCount === 1 ? 'computer' : 'computers'}
          </Typography>
        )}
      </Stack>

      {isError && <ErrorState message={getErrorMessage(error)} onRetry={refetch} />}

      <Paper variant="outlined" sx={{ height: 640 }}>
        <ComputerGrid rows={data?.items ?? []} rowCount={data?.totalCount ?? 0} loading={isFetching} />
      </Paper>
    </Stack>
  )
}
