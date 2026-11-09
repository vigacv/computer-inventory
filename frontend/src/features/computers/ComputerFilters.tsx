import FilterListOffIcon from '@mui/icons-material/FilterListOff'
import { Badge, Box, Button, MenuItem, Paper, Stack, TextField } from '@mui/material'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { RangeFilter } from '../../components/RangeFilter'
import { formatCapacity, formatRam, formatWatts } from '../../utils/format'
import { useGetLookupsQuery } from '../lookups/lookupsApi'
import {
  filtersChanged,
  filtersCleared,
  selectActiveFilterCount,
  selectComputersQuery,
} from './computersQuerySlice'
import { storageTypeLabels, usbPortTypeLabels } from './labels'
import { SearchField } from './SearchField'
import type { ComputerFilters as Filters } from './types'

const RAM_STEPS_MB = [512, 1024, 2048, 4096, 8192, 16384, 32768, 65536]
const STORAGE_STEPS_GB = [64, 128, 256, 512, 1000, 2000, 4000, 8000]
const PSU_MINIMUMS_W = [450, 500, 650, 750, 1000]

const ANY = ''

interface SelectFilterProps {
  label: string
  value: string | number | undefined
  options: { value: string | number; label: string }[]
  disabled?: boolean
  onChange: (value: string | undefined) => void
}

function SelectFilter({ label, value, options, disabled, onChange }: SelectFilterProps) {
  return (
    <TextField
      select
      fullWidth
      size="small"
      label={label}
      value={value ?? ANY}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value === ANY ? undefined : e.target.value)}
    >
      <MenuItem value={ANY}>
        <em>Any</em>
      </MenuItem>
      {options.map((o) => (
        <MenuItem key={o.value} value={o.value}>
          {o.label}
        </MenuItem>
      ))}
    </TextField>
  )
}

const toNumber = (value: string | undefined) => (value === undefined ? undefined : Number(value))

export function ComputerFilters() {
  const dispatch = useAppDispatch()
  const query = useAppSelector(selectComputersQuery)
  const activeCount = useAppSelector(selectActiveFilterCount)
  const { data: lookups, isLoading: lookupsLoading, isError: lookupsFailed } = useGetLookupsQuery()

  const set = (filters: Filters) => dispatch(filtersChanged(filters))

  const manufacturers = lookups?.manufacturers ?? []
  const toOptions = (list: typeof manufacturers) => list.map((m) => ({ value: m.id, label: m.name }))
  const lookupsUnavailable = lookupsLoading || lookupsFailed

  return (
    <Paper variant="outlined" component="section" aria-label="Search and filters" sx={{ p: 2 }}>
      <Stack spacing={2.5}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' } }}>
          <SearchField value={query.search} onSearch={(search) => set({ search })} />
          <Badge badgeContent={activeCount} color="primary">
            <Button
              variant="outlined"
              startIcon={<FilterListOffIcon />}
              disabled={activeCount === 0}
              onClick={() => dispatch(filtersCleared())}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Clear filters
            </Button>
          </Badge>
        </Stack>

        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <RangeFilter
            label="RAM"
            steps={RAM_STEPS_MB}
            value={{ min: query.minRamMb, max: query.maxRamMb }}
            format={formatRam}
            onChange={({ min, max }) => set({ minRamMb: min, maxRamMb: max })}
          />
          <RangeFilter
            label="Storage"
            steps={STORAGE_STEPS_GB}
            value={{ min: query.minStorageGb, max: query.maxStorageGb }}
            format={formatCapacity}
            onChange={({ min, max }) => set({ minStorageGb: min, maxStorageGb: max })}
          />
        </Box>

        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' },
          }}
        >
          <SelectFilter
            label="Storage type"
            value={query.storageType}
            options={Object.entries(storageTypeLabels).map(([value, label]) => ({ value, label }))}
            onChange={(v) => set({ storageType: v as Filters['storageType'] })}
          />
          <SelectFilter
            label="Has USB port"
            value={query.usbPortType}
            options={Object.entries(usbPortTypeLabels).map(([value, label]) => ({ value, label }))}
            onChange={(v) => set({ usbPortType: v as Filters['usbPortType'] })}
          />
          <SelectFilter
            label="CPU manufacturer"
            value={query.processorManufacturerId}
            options={toOptions(manufacturers.filter((m) => m.makesProcessors))}
            disabled={lookupsUnavailable}
            onChange={(v) => set({ processorManufacturerId: toNumber(v) })}
          />
          <SelectFilter
            label="GPU manufacturer"
            value={query.graphicsCardManufacturerId}
            options={toOptions(manufacturers.filter((m) => m.makesGraphicsCards))}
            disabled={lookupsUnavailable}
            onChange={(v) => set({ graphicsCardManufacturerId: toNumber(v) })}
          />
          <SelectFilter
            label="Minimum PSU"
            value={query.minPsuWatts}
            options={PSU_MINIMUMS_W.map((w) => ({ value: w, label: `≥ ${formatWatts(w)}` }))}
            onChange={(v) => set({ minPsuWatts: toNumber(v) })}
          />
        </Box>
      </Stack>
    </Paper>
  )
}
