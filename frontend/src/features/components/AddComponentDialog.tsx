import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import { useId } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { getErrorMessage, getValidationErrors } from '../../api/errors'
import type { ComponentInfo } from '../computers/types'
import { useGetLookupsQuery } from '../lookups/lookupsApi'
import { componentKinds, type ComponentKind } from './componentKinds'

const schema = z.object({
  manufacturer: z.string().trim().min(1, 'Enter the manufacturer.').max(100, 'At most 100 characters.'),
  model: z.string().trim().min(1, 'Enter the model.').max(150, 'At most 150 characters.'),
})
type Values = z.input<typeof schema>

interface AddComponentDialogProps {
  kind: ComponentKind
  /** Prefills the model, e.g. with what the user typed in the picker. */
  initialModel?: string
  onCreated: (component: ComponentInfo) => void
  onClose: () => void
}

/** Adds a processor or graphics card. The manufacturer can be an existing one or a new name. */
export function AddComponentDialog({ kind, initialModel = '', onCreated, onClose }: AddComponentDialogProps) {
  const { noun, useCreate } = componentKinds[kind]
  const [create] = useCreate()
  const { data: lookups } = useGetLookupsQuery()
  const titleId = useId()

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { manufacturer: '', model: initialModel },
    // Errors appear after the first submit attempt (then update as you type): the dialog opens
    // with focus in a field, so "on leaving a field" would flag fields the user hasn't reached.
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  })
  const { isSubmitting, errors } = form.formState

  const submit = form.handleSubmit(async (values) => {
    const result = await create({ manufacturer: values.manufacturer.trim(), model: values.model.trim() })
    if ('data' in result && result.data) {
      onCreated(result.data)
      return
    }
    const fieldErrors = getValidationErrors(result.error)
    if (Object.keys(fieldErrors).length === 0) {
      form.setError('root.server', { message: getErrorMessage(result.error) })
    }
    for (const [field, messages] of Object.entries(fieldErrors)) {
      const target = field === 'manufacturer' || field === 'model' ? field : 'root.server'
      form.setError(target, { message: messages.join(' ') })
    }
  })

  return (
    <Dialog
      open
      onClose={() => !isSubmitting && onClose()}
      aria-labelledby={titleId}
      maxWidth="xs"
      fullWidth
      // Focus the first empty field once the dialog has opened (autoFocus loses to the dialog's own
      // focus handling while it animates in).
      slotProps={{ transition: { onEntered: () => form.setFocus(initialModel ? 'manufacturer' : 'model') } }}
    >
      {/* stopPropagation: this form sits inside the computer form's dialog in the React tree. */}
      <form
        noValidate
        onSubmit={(e) => {
          e.stopPropagation()
          void submit(e)
        }}
      >
        <DialogTitle id={titleId}>Add a {noun}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {errors.root?.server && <Alert severity="error">{errors.root.server.message}</Alert>}
            <Controller
              control={form.control}
              name="manufacturer"
              render={({ field, fieldState }) => (
                <Autocomplete
                  freeSolo
                  options={lookups?.manufacturers.map((m) => m.name) ?? []}
                  inputValue={field.value}
                  onInputChange={(_, value) => field.onChange(value)}
                  onBlur={field.onBlur}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      inputRef={field.ref}
                      label="Manufacturer"
                      size="small"
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message ?? 'Pick one, or type a new manufacturer.'}
                    />
                  )}
                />
              )}
            />
            <Controller
              control={form.control}
              name="model"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  inputRef={field.ref}
                  label="Model"
                  size="small"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            Add {noun}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
