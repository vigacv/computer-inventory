import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { useState, type ReactNode } from 'react'
import { useSnackbar } from 'notistack'
import { useParams } from 'react-router'
import { getErrorMessage } from '../../api/errors'
import { useAppSelector } from '../../app/hooks'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { ErrorState } from '../../components/ErrorState'
import { formatDateTime, formatRam, formatWatts, formatWeight } from '../../utils/format'
import { selectWeightUnit } from '../preferences/preferencesSlice'
import { WeightUnitToggle } from '../preferences/WeightUnitToggle'
import { useDeleteComputerMutation, useGetComputerQuery } from './computersApi'
import { EditComputerDialog } from './EditComputerDialog'
import { formatStorage, usbPortTypeLabels } from './labels'
import type { ComputerDetails } from './types'
import { useComputerNavigation } from './useComputerNavigation'

const DRAWER_WIDTH = 440

function Spec({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 2, py: 1.25, alignItems: 'center' }}>
      <Typography component="dt" variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography component="dd" variant="body2" sx={{ m: 0 }}>
        {children}
      </Typography>
    </Box>
  )
}

function Details({ computer }: { computer: ComputerDetails }) {
  const weightUnit = useAppSelector(selectWeightUnit)
  const totalPorts = computer.usbPorts.reduce((sum, p) => sum + p.count, 0)

  return (
    <>
      <Box component="dl" sx={{ m: 0 }}>
        <Spec label="Processor">
          {computer.processor.model}
          <Typography component="span" variant="body2" color="text.secondary">
            {' '}
            · {computer.processor.manufacturer}
          </Typography>
        </Spec>
        <Divider />
        <Spec label="Graphics card">
          {computer.graphicsCard.model}
          <Typography component="span" variant="body2" color="text.secondary">
            {' '}
            · {computer.graphicsCard.manufacturer}
          </Typography>
        </Spec>
        <Divider />
        <Spec label="RAM">{formatRam(computer.ramMb)}</Spec>
        <Divider />
        <Spec label="Storage">{formatStorage(computer.storageCapacityGb, computer.storageType)}</Spec>
        <Divider />
        <Spec label="Power supply">{formatWatts(computer.psuWatts)}</Spec>
        <Divider />
        <Spec label="Weight">
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <span>{formatWeight(computer.weightGrams, weightUnit)}</span>
            <WeightUnitToggle />
          </Stack>
        </Spec>
        <Divider />
        <Spec label={`USB ports (${totalPorts})`}>
          {computer.usbPorts.length === 0 ? (
            'None'
          ) : (
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {computer.usbPorts.map((p) => (
                <Chip key={p.type} size="small" label={`${p.count}× ${usbPortTypeLabels[p.type]}`} />
              ))}
            </Stack>
          )}
        </Spec>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
        Added {formatDateTime(computer.createdAt)}
        {computer.updatedAt !== computer.createdAt && <> · Last updated {formatDateTime(computer.updatedAt)}</>}
      </Typography>
    </>
  )
}

function LoadingDetails() {
  return (
    <Stack spacing={2} aria-label="Loading details">
      {Array.from({ length: 7 }, (_, i) => (
        <Skeleton key={i} variant="text" height={28} />
      ))}
    </Stack>
  )
}

/** Side panel for the computer in the URL (/computers/:id), shown over the list. */
export function ComputerDetailsDrawer() {
  const id = Number(useParams().id)
  const validId = Number.isInteger(id) && id > 0
  const { openDetails, closeDetails } = useComputerNavigation()
  const { data, isLoading, isError, error, refetch } = useGetComputerQuery(id, { skip: !validId })
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleteComputer] = useDeleteComputerMutation()
  const { enqueueSnackbar } = useSnackbar()

  const handleDelete = async () => {
    // Close the details before deleting. Deleting invalidates this computer's cached details:
    // while the drawer still shows them, RTK Query would refetch them (a needless 404); once
    // nothing shows them, it just drops them from the cache.
    setConfirmingDelete(false)
    closeDetails({ replace: true }) // replace: Back shouldn't lead to the deleted computer

    const result = await deleteComputer(id)
    if ('error' in result) {
      openDetails(id, { replace: true }) // bring the details back; the error snackbar comes from the API middleware
      return
    }
    enqueueSnackbar(`Computer #${id} deleted.`, { variant: 'success' })
  }

  const notFound = !validId || (isError && 'status' in error && error.status === 404)
  const titleId = 'computer-details-title'

  return (
    <Drawer
      anchor="right"
      open
      onClose={() => closeDetails()}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: DRAWER_WIDTH } }, 'aria-labelledby': titleId } }}
    >
      <Stack direction="row" sx={{ alignItems: 'flex-start', px: 3, pt: 2.5, pb: 2, gap: 1 }}>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography id={titleId} variant="h6" component="h2">
            {validId ? `Computer #${id}` : 'Computer'}
          </Typography>
          {data && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {data.processor.manufacturer} {data.processor.model} · {data.graphicsCard.model}
            </Typography>
          )}
        </Box>
        {data && (
          <>
            <Button startIcon={<EditOutlinedIcon />} onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button color="error" startIcon={<DeleteOutlinedIcon />} onClick={() => setConfirmingDelete(true)}>
              Delete
            </Button>
          </>
        )}
        <IconButton aria-label="Close details" onClick={() => closeDetails()} edge="end">
          <CloseIcon />
        </IconButton>
      </Stack>
      <Divider />

      <Box sx={{ px: 3, py: 2, overflowY: 'auto' }}>
        {notFound ? (
          <Alert severity="info">This computer doesn&apos;t exist. It may have been deleted.</Alert>
        ) : isError ? (
          <ErrorState message={getErrorMessage(error)} onRetry={refetch} />
        ) : isLoading || !data ? (
          <LoadingDetails />
        ) : (
          <Details computer={data} />
        )}
      </Box>

      {confirmingDelete && (
        <ConfirmDialog
          title={`Delete computer #${id}?`}
          message="This permanently removes the computer and its specs. It can't be undone."
          confirmLabel="Delete"
          destructive
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}

      {editing && data && (
        <EditComputerDialog computer={data} onClose={() => setEditing(false)} onReload={refetch} />
      )}
    </Drawer>
  )
}
