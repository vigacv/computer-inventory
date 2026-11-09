import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import {
  DataGrid,
  GridActionsCellItem,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
} from '@mui/x-data-grid'
import { useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { formatRam, formatWatts, formatWeight, type WeightUnit } from '../../utils/format'
import { selectWeightUnit } from '../preferences/preferencesSlice'
import { pageChanged, selectComputersQuery, sortChanged } from './computersQuerySlice'
import { formatComponent, formatStorage, formatUsbPorts } from './labels'
import type { ComputerSortField, ComputerSummary } from './types'
import { useComputerNavigation } from './useComputerNavigation'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

// Column fields match the API's sort keys, so the sort model maps straight onto the query.
const buildColumns = (weightUnit: WeightUnit, openDetails: (id: number) => void): GridColDef<ComputerSummary>[] => [
  {
    field: 'processor',
    headerName: 'Processor',
    flex: 1.4,
    minWidth: 200,
    valueGetter: (_, row) => formatComponent(row.processor),
  },
  {
    field: 'graphicsCard',
    headerName: 'Graphics card',
    flex: 1.4,
    minWidth: 200,
    valueGetter: (_, row) => formatComponent(row.graphicsCard),
  },
  { field: 'ramMb', headerName: 'RAM', width: 100, valueFormatter: (value: number) => formatRam(value) },
  {
    field: 'storageCapacityGb',
    headerName: 'Storage',
    width: 120,
    valueGetter: (_, row) => formatStorage(row.storageCapacityGb, row.storageType),
  },
  {
    field: 'usbPorts',
    headerName: 'USB ports',
    flex: 1.2,
    minWidth: 200,
    sortable: false,
    valueGetter: (_, row) => formatUsbPorts(row.usbPorts),
  },
  {
    field: 'weightGrams',
    headerName: 'Weight',
    width: 100,
    valueFormatter: (value: number) => formatWeight(value, weightUnit),
  },
  { field: 'psuWatts', headerName: 'PSU', width: 90, valueFormatter: (value: number) => formatWatts(value) },
  {
    field: 'actions',
    type: 'actions',
    width: 60,
    getActions: ({ row }) => [
      <GridActionsCellItem
        key="details"
        icon={<VisibilityOutlinedIcon />}
        label={`View details of computer ${row.id}`}
        onClick={() => openDetails(row.id)}
      />,
    ],
  },
]

interface ComputerGridProps {
  rows: ComputerSummary[]
  rowCount: number
  loading: boolean
  noRowsLabel: string
}

/** Server-side paged and sorted grid. Paging/sort state lives in Redux, not in the grid. */
export function ComputerGrid({ rows, rowCount, loading, noRowsLabel }: ComputerGridProps) {
  const dispatch = useAppDispatch()
  const query = useAppSelector(selectComputersQuery)
  const weightUnit = useAppSelector(selectWeightUnit)
  const { openDetails } = useComputerNavigation()

  const columns = useMemo(() => buildColumns(weightUnit, openDetails), [weightUnit, openDetails])

  // Memoized: the grid treats a new model object as a new model and syncs its internal state,
  // echoing its stale page back through onPaginationModelChange (which reset paging to page 1).
  const paginationModel = useMemo<GridPaginationModel>(
    () => ({ page: query.page - 1, pageSize: query.pageSize }),
    [query.page, query.pageSize],
  )
  const sortModel = useMemo<GridSortModel>(
    () => (query.sortBy ? [{ field: query.sortBy, sort: query.sortDir ?? 'asc' }] : []),
    [query.sortBy, query.sortDir],
  )

  const handlePaginationChange = (model: GridPaginationModel) =>
    dispatch(pageChanged({ page: model.page + 1, pageSize: model.pageSize }))

  const handleSortChange = (model: GridSortModel) => {
    const [first] = model
    dispatch(
      sortChanged(first?.sort ? { sortBy: first.field as ComputerSortField, sortDir: first.sort } : null),
    )
  }

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      rowCount={rowCount}
      loading={loading}
      paginationMode="server"
      sortingMode="server"
      paginationModel={paginationModel}
      onPaginationModelChange={handlePaginationChange}
      sortModel={sortModel}
      onSortModelChange={handleSortChange}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      disableColumnFilter
      disableRowSelectionOnClick
      localeText={{ noRowsLabel }}
      onRowClick={({ row }) => openDetails(row.id)}
      sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
      aria-label="Computers"
    />
  )
}
