import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import type { WeightUnit } from '../../utils/format'
import { selectWeightUnit, weightUnitChanged } from './preferencesSlice'

export function WeightUnitToggle() {
  const dispatch = useAppDispatch()
  const unit = useAppSelector(selectWeightUnit)

  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={unit}
      aria-label="Weight unit"
      onChange={(_, next: WeightUnit | null) => next && dispatch(weightUnitChanged(next))}
    >
      <ToggleButton value="kg" sx={{ px: 1.5, py: 0.25 }}>
        kg
      </ToggleButton>
      <ToggleButton value="lb" sx={{ px: 1.5, py: 0.25 }}>
        lb
      </ToggleButton>
    </ToggleButtonGroup>
  )
}
