import { Alert, Button } from '@mui/material'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { useSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { getErrorMessage, getValidationErrors } from '../../api/errors'
import { useAppSelector } from '../../app/hooks'
import { selectWeightUnit } from '../preferences/preferencesSlice'
import { useUpdateComputerMutation } from './computersApi'
import { toFormValues, toSpec } from './form/computerForm'
import { ComputerFormDialog, type SubmitOutcome } from './form/ComputerFormDialog'
import type { ComputerDetails } from './types'

interface EditComputerDialogProps {
  computer: ComputerDetails
  onClose: () => void
  /** Fetches the latest version of the computer (after an edit conflict). */
  onReload: () => Promise<unknown>
}

export function EditComputerDialog({ computer, onClose, onReload }: EditComputerDialogProps) {
  const weightUnit = useAppSelector(selectWeightUnit)
  const [updateComputer] = useUpdateComputerMutation()
  const { enqueueSnackbar } = useSnackbar()
  const [conflict, setConflict] = useState(false)
  const [reloading, setReloading] = useState(false)

  // Recomputed when a reload brings a newer version, which resets the form to it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialValues = useMemo(() => toFormValues(computer, weightUnit), [computer.rowVersion])

  const handleSubmit = async (values: typeof initialValues): Promise<SubmitOutcome> => {
    const result = await updateComputer({
      id: computer.id,
      spec: toSpec(values, { form: initialValues, weightGrams: computer.weightGrams }),
      rowVersion: computer.rowVersion,
    })

    if ('data' in result) {
      enqueueSnackbar(`Computer #${computer.id} saved.`, { variant: 'success' })
      onClose()
      return { ok: true }
    }

    if ((result.error as FetchBaseQueryError).status === 409) {
      setConflict(true)
      return { ok: false }
    }
    const fieldErrors = getValidationErrors(result.error)
    return Object.keys(fieldErrors).length > 0
      ? { ok: false, fieldErrors }
      : { ok: false, message: getErrorMessage(result.error) }
  }

  const reload = async () => {
    setReloading(true)
    await onReload()
    setReloading(false)
    setConflict(false)
  }

  return (
    <ComputerFormDialog
      title={`Edit computer #${computer.id}`}
      submitLabel="Save changes"
      defaultValues={initialValues}
      onSubmit={handleSubmit}
      onClose={onClose}
      notice={
        conflict && (
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={reload} loading={reloading}>
                Load latest
              </Button>
            }
          >
            Someone else changed this computer while you were editing. Load the latest version to continue
            (your unsaved changes will be lost).
          </Alert>
        )
      }
    />
  )
}
