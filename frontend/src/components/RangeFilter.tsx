import { Box, Slider, Typography } from '@mui/material'
import { useId, useState } from 'react'
import { describeRange, fromIndexRange, toIndexRange, type Range } from './rangeSteps'

interface RangeFilterProps {
  label: string
  /** Allowed values, ascending. The slider snaps to these; its ends mean "no limit". */
  steps: readonly number[]
  value: Range
  format: (value: number) => string
  onChange: (value: Range) => void
}

/**
 * Range slider over discrete steps. Moves are local while dragging and only reported on release,
 * so dragging doesn't fire a request per pixel.
 */
export function RangeFilter({ label, steps, value, format, onChange }: RangeFilterProps) {
  const labelId = useId()
  const [dragging, setDragging] = useState<[number, number] | null>(null)
  const indexes = dragging ?? toIndexRange(steps, value)

  return (
    <Box>
      <Typography id={labelId} variant="body2" gutterBottom>
        {label}: <strong>{describeRange(fromIndexRange(steps, indexes), format)}</strong>
      </Typography>
      <Box sx={{ px: 1 }}>
        <Slider
          aria-labelledby={labelId}
          getAriaLabel={(thumb) => (thumb === 0 ? `Minimum ${label}` : `Maximum ${label}`)}
          getAriaValueText={(index) => format(steps[index])}
          value={indexes}
          min={0}
          max={steps.length - 1}
          step={1}
          marks
          disableSwap
          valueLabelDisplay="auto"
          valueLabelFormat={(index) => format(steps[index])}
          onChange={(_, next) => setDragging(next as [number, number])}
          onChangeCommitted={(_, next) => {
            setDragging(null)
            onChange(fromIndexRange(steps, next as [number, number]))
          }}
        />
      </Box>
    </Box>
  )
}
