import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
} from '@mui/x-data-grid'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { formatRam, formatWatts, formatWeight } from '../../utils/format'
import { pageChanged, selectComputersQuery, sortChanged } from './computersQuerySlice'
import { formatComponent, formatStorage, formatUsbPorts } from './labels'
import type { ComputerSortField, ComputerSummary } from './types'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

// Column fields match the API's sort keys, so the sort model maps straight onto the query.
const columns: GridColDef<ComputerSummary>[] = [
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
  { field: 'weightGrams', headerName: 'Weight', width: 100, valueFormatter: (value: number) => formatWeight(value) },
  { field: 'psuWatts', headerName: 'PSU', width: 90, valueFormatter: (value: number) => formatWatts(value) },
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

  const paginationModel: GridPaginationModel = { page: query.page - 1, pageSize: query.pageSize }
  const sortModel: GridSortModel = query.sortBy ? [{ field: query.sortBy, sort: query.sortDir ?? 'asc' }] : []

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
      aria-label="Computers"
    />
  )
}
