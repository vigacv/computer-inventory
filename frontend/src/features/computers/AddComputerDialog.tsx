import { useSnackbar } from 'notistack'
import { useMemo } from 'react'
import { getErrorMessage, getValidationErrors } from '../../api/errors'
import { useAppSelector } from '../../app/hooks'
import { selectWeightUnit } from '../preferences/preferencesSlice'
import { useCreateComputerMutation } from './computersApi'
import { emptyFormValues, toSpec, type ComputerFormValues } from './form/computerForm'
import { ComputerFormDialog, type SubmitOutcome } from './form/ComputerFormDialog'

interface AddComputerDialogProps {
  onClose: () => void
  /** Called with the new computer's id once it's saved. */
  onAdded: (id: number) => void
}

export function AddComputerDialog({ onClose, onAdded }: AddComputerDialogProps) {
  const weightUnit = useAppSelector(selectWeightUnit)
  const [createComputer] = useCreateComputerMutation()
  const { enqueueSnackbar } = useSnackbar()
  // Memoized: the form resets whenever its default values change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const defaults = useMemo(() => emptyFormValues(weightUnit), [])

  const handleSubmit = async (values: ComputerFormValues): Promise<SubmitOutcome> => {
    const result = await createComputer(toSpec(values))
    if ('data' in result && result.data) {
      enqueueSnackbar(`Computer #${result.data.id} added.`, { variant: 'success' })
      onAdded(result.data.id)
      return { ok: true }
    }
    const fieldErrors = getValidationErrors(result.error)
    return Object.keys(fieldErrors).length > 0
      ? { ok: false, fieldErrors }
      : { ok: false, message: getErrorMessage(result.error) }
  }

  return (
    <ComputerFormDialog
      title="Add computer"
      submitLabel="Add computer"
      defaultValues={defaults}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  )
}
