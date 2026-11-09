import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import { Button, Paper, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { comparePath, comparisonCleared, MAX_COMPARED, MIN_COMPARED, selectComparedIds } from './compareSelectionSlice'

/** Shown while computers are picked for comparison: how many, and the way to the comparison. */
export function CompareBar() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const ids = useAppSelector(selectComparedIds)

  if (ids.length === 0) return null

  const hint =
    ids.length < MIN_COMPARED ? `pick at least ${MIN_COMPARED}` : ids.length === MAX_COMPARED ? 'maximum reached' : `up to ${MAX_COMPARED}`

  return (
    <Paper
      variant="outlined"
      role="region"
      aria-label="Comparison selection"
      sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 2, borderColor: 'primary.main' }}
    >
      <Typography variant="body2" sx={{ flexGrow: 1 }}>
        <strong>{ids.length}</strong> selected for comparison ({hint})
      </Typography>
      <Stack direction="row" spacing={1}>
        <Button size="small" onClick={() => dispatch(comparisonCleared())}>
          Clear
        </Button>
        <Button
          size="small"
          variant="contained"
          startIcon={<CompareArrowsIcon />}
          disabled={ids.length < MIN_COMPARED}
          onClick={() => navigate(comparePath(ids))}
        >
          Compare
        </Button>
      </Stack>
    </Paper>
  )
}
