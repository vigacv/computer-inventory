import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  IconButton,
  Link,
  Paper,
  Skeleton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate, useSearchParams } from 'react-router'
import { getErrorMessage } from '../../api/errors'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { ErrorState } from '../../components/ErrorState'
import { useCompareComputersQuery } from '../computers/computersApi'
import type { ComputerDetails } from '../computers/types'
import { selectWeightUnit } from '../preferences/preferencesSlice'
import { WeightUnitToggle } from '../preferences/WeightUnitToggle'
import { bestIndexes, compareRows, rowDiffers } from './compareRows'
import { MIN_COMPARED, parseComparedIds, selectionReplaced } from './compareSelectionSlice'

function ComparisonTable({ computers, onlyDifferences, onRemove }: {
  computers: ComputerDetails[]
  onlyDifferences: boolean
  onRemove: (id: number) => void
}) {
  const weightUnit = useAppSelector(selectWeightUnit)
  const rows = onlyDifferences ? compareRows.filter((r) => rowDiffers(r, computers, weightUnit)) : compareRows

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table aria-label="Computer comparison" sx={{ tableLayout: 'fixed', minWidth: 180 + computers.length * 200 }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 180 }}>
              <Typography variant="body2" color="text.secondary">
                Spec
              </Typography>
            </TableCell>
            {computers.map((c) => (
              <TableCell key={c.id} sx={{ verticalAlign: 'top' }}>
                <Stack direction="row" sx={{ alignItems: 'flex-start', gap: 0.5 }}>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Link component={RouterLink} to={`/computers/${c.id}`} variant="subtitle2" underline="hover">
                      Computer #{c.id}
                    </Link>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                      {c.processor.model} · {c.graphicsCard.model}
                    </Typography>
                  </Box>
                  <IconButton size="small" aria-label={`Remove computer #${c.id} from comparison`} onClick={() => onRemove(c.id)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={computers.length + 1}>
                <Typography variant="body2" color="text.secondary">
                  These computers have identical specs.
                </Typography>
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => {
            const best = bestIndexes(row, computers)
            return (
              <TableRow key={row.key} hover>
                <TableCell component="th" scope="row">
                  <Typography variant="body2" color="text.secondary">
                    {row.label}
                  </Typography>
                </TableCell>
                {computers.map((c, i) => (
                  <TableCell
                    key={c.id}
                    sx={best.has(i) ? { bgcolor: (t) => alpha(t.palette.success.main, 0.14), fontWeight: 600 } : undefined}
                  >
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                      <span>{row.display(c, weightUnit)}</span>
                      {/* Marked with an icon and text for screen readers, not just colour. */}
                      {best.has(i) && <EmojiEventsIcon fontSize="small" color="success" titleAccess="Best" />}
                    </Stack>
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

/** Side-by-side comparison of 2–4 computers from /compare?ids=1,5,7 (shareable). */
export function ComparePage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const ids = parseComparedIds(searchParams.get('ids'))
  const idsKey = ids.join(',')
  const [onlyDifferences, setOnlyDifferences] = useState(false)

  const enough = ids.length >= MIN_COMPARED
  const { data, isLoading, isError, error, refetch } = useCompareComputersQuery(ids, { skip: !enough })

  // Keep the list's checkboxes in step with what's being compared (e.g. when opening a shared link).
  useEffect(() => {
    dispatch(selectionReplaced(idsKey ? idsKey.split(',').map(Number) : []))
  }, [dispatch, idsKey])

  const remove = (id: number) => {
    const remaining = ids.filter((x) => x !== id)
    setSearchParams(remaining.length ? { ids: remaining.join(',') } : {}, { replace: true })
  }

  // Back to wherever the user came from (keeping that list's filters), or the list if opened directly.
  const back = () => (location.key === 'default' ? navigate('/') : navigate(-1))

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={back}>
          Back to list
        </Button>
        <Typography variant="h5" component="h2" sx={{ flexGrow: 1 }}>
          Compare computers
        </Typography>
        <FormControlLabel
          control={<Switch checked={onlyDifferences} onChange={(e) => setOnlyDifferences(e.target.checked)} />}
          label="Show only differences"
        />
        <WeightUnitToggle />
      </Stack>

      {!enough ? (
        <Alert severity="info">
          Pick at least {MIN_COMPARED} computers to compare: tick them in the{' '}
          <Link component={RouterLink} to="/">
            list
          </Link>
          .
        </Alert>
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
      ) : isLoading || !data ? (
        <Skeleton variant="rounded" height={420} aria-label="Loading comparison" />
      ) : (
        <>
          {data.notFound.length > 0 && (
            <Alert severity="warning">
              {data.notFound.map((id) => `#${id}`).join(', ')}{' '}
              {data.notFound.length === 1 ? "doesn't exist anymore and was" : "don't exist anymore and were"} left out.
            </Alert>
          )}
          {data.computers.length >= MIN_COMPARED ? (
            <ComparisonTable computers={data.computers} onlyDifferences={onlyDifferences} onRemove={remove} />
          ) : (
            <Alert severity="info">Not enough computers left to compare.</Alert>
          )}
        </>
      )}
    </Stack>
  )
}
