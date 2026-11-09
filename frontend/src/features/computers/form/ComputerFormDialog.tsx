import { zodResolver } from '@hookform/resolvers/zod'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useEffect, type ReactNode } from 'react'
import {
  Controller,
  useFieldArray,
  useForm,
  type FieldPath,
  type UseFormReturn,
} from 'react-hook-form'
import { useListGraphicsCardsQuery, useListProcessorsQuery } from '../../components/componentsApi'
import { storageTypeLabels, usbPortTypeLabels } from '../labels'
import type { ComponentInfo } from '../types'
import {
  computerFormSchema,
  convertUnit,
  ramUnits,
  storageUnits,
  toFormErrors,
  usbPortTypes,
  weightUnits,
  type ComputerFormValues,
} from './computerForm'

export type SubmitOutcome =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string[]>; message?: string }

interface ComputerFormDialogProps {
  title: string
  submitLabel: string
  /** Initial values. When this changes (pass a memoized object), the form is reset to it. */
  defaultValues: ComputerFormValues
  /** Saves the values. Field errors from the server are shown under the matching inputs. */
  onSubmit: (values: ComputerFormValues) => Promise<SubmitOutcome>
  onClose: () => void
  /** Shown above the form, e.g. an edit conflict. */
  notice?: ReactNode
}

type Form = UseFormReturn<ComputerFormValues>

/** Number input wired to react-hook-form (MUI needs the ref on the <input>, not the wrapper). */
function NumberField({
  form,
  name,
  label,
  endAdornment,
  step = 'any',
}: {
  form: Form
  name: FieldPath<ComputerFormValues>
  label: string
  endAdornment?: ReactNode
  step?: string
}) {
  const { ref, ...field } = form.register(name, { valueAsNumber: true })
  const error = name.split('.').reduce<unknown>((e, key) => (e as Record<string, unknown> | undefined)?.[key], form.formState.errors) as
    | { message?: string }
    | undefined
  return (
    <TextField
      {...field}
      inputRef={ref}
      type="number"
      label={label}
      size="small"
      fullWidth
      error={!!error}
      helperText={error?.message}
      slotProps={{
        htmlInput: { step, min: 0 },
        input: endAdornment ? { endAdornment: <InputAdornment position="end">{endAdornment}</InputAdornment> } : undefined,
      }}
    />
  )
}

/**
 * Unit picker that converts the amount when the unit changes (16 GB → 16384 MB),
 * so switching units never changes what the user meant.
 */
function UnitSelect<U extends string>({
  form,
  valueName,
  unitName,
  units,
  label,
}: {
  form: Form
  valueName: FieldPath<ComputerFormValues>
  unitName: FieldPath<ComputerFormValues>
  units: Record<U, number>
  label: string
}) {
  return (
    <Controller
      control={form.control}
      name={unitName}
      render={({ field }) => (
        <TextField
          select
          size="small"
          label={label}
          value={field.value}
          onChange={(e) => {
            const from = units[field.value as U]
            const to = units[e.target.value as U]
            const amount = form.getValues(valueName) as number
            if (Number.isFinite(amount)) {
              form.setValue(valueName, convertUnit(amount, from, to), { shouldDirty: true, shouldValidate: true })
            }
            field.onChange(e.target.value)
          }}
          fullWidth
        >
          {Object.keys(units).map((u) => (
            <MenuItem key={u} value={u}>
              {u}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  )
}

/** An amount input with its unit picker beside it: the amount takes the space, the unit a fixed width. */
function AmountWithUnit({ children }: { children: ReactNode }) {
  return <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 96px', gap: 1, alignItems: 'start' }}>{children}</Box>
}

function ComponentPicker({
  form,
  name,
  label,
  options,
  loading,
}: {
  form: Form
  name: 'processorId' | 'graphicsCardId'
  label: string
  options: ComponentInfo[]
  loading: boolean
}) {
  return (
    <Controller
      control={form.control}
      name={name}
      render={({ field, fieldState }) => (
        <Autocomplete
          options={options}
          loading={loading}
          groupBy={(o) => o.manufacturer}
          getOptionLabel={(o) => o.model}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          value={options.find((o) => o.id === field.value) ?? null}
          onChange={(_, option) => field.onChange(option?.id)}
          onBlur={field.onBlur}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={field.ref}
              label={label}
              size="small"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
      )}
    />
  )
}

function UsbPortsField({ form }: { form: Form }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'usbPorts' })
  const used = form.watch('usbPorts').map((p) => p.type)
  const nextFree = usbPortTypes.find((t) => !used.includes(t))
  const errors = form.formState.errors.usbPorts

  return (
    <Box component="fieldset" sx={{ border: 0, p: 0, m: 0 }}>
      <Typography component="legend" variant="subtitle2" sx={{ mb: 1 }}>
        USB ports
      </Typography>
      <Stack spacing={1.5}>
        {fields.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No USB ports.
          </Typography>
        )}
        {fields.map((port, index) => (
          <Stack key={port.id} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
            <Controller
              control={form.control}
              name={`usbPorts.${index}.type`}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  select
                  size="small"
                  label="Type"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ flex: 1 }}
                >
                  {usbPortTypes.map((t) => (
                    <MenuItem key={t} value={t}>
                      {usbPortTypeLabels[t]}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Box sx={{ width: 120 }}>
              <NumberField form={form} name={`usbPorts.${index}.count`} label="Count" step="1" />
            </Box>
            <IconButton aria-label={`Remove ${usbPortTypeLabels[form.getValues(`usbPorts.${index}.type`)]} ports`} onClick={() => remove(index)} sx={{ mt: 0.25 }}>
              <DeleteOutlineIcon />
            </IconButton>
          </Stack>
        ))}
        {(errors?.root?.message ?? errors?.message) && (
          <Typography variant="caption" color="error">
            {errors?.root?.message ?? errors?.message}
          </Typography>
        )}
        <Box>
          <Button
            size="small"
            startIcon={<AddIcon />}
            disabled={!nextFree}
            onClick={() => nextFree && append({ type: nextFree, count: 1 })}
          >
            Add USB port type
          </Button>
        </Box>
      </Stack>
    </Box>
  )
}

/** Create/edit form for a computer, in friendly units, validated before and after submitting. */
export function ComputerFormDialog({ title, submitLabel, defaultValues, onSubmit, onClose, notice }: ComputerFormDialogProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const processors = useListProcessorsQuery()
  const graphicsCards = useListGraphicsCardsQuery()

  const form = useForm<ComputerFormValues>({ resolver: zodResolver(computerFormSchema), defaultValues, mode: 'onTouched' })
  const { isSubmitting, errors } = form.formState

  // e.g. after loading the latest version following an edit conflict
  useEffect(() => form.reset(defaultValues), [form, defaultValues])

  const submit = form.handleSubmit(async (values) => {
    const outcome = await onSubmit(values)
    if (outcome.ok) return
    for (const { field, message } of toFormErrors(outcome.fieldErrors ?? {})) {
      form.setError(field as FieldPath<ComputerFormValues>, { message })
    }
    if (outcome.message) form.setError('root.server', { message: outcome.message })
  })

  const close = () => !isSubmitting && onClose()
  const titleId = 'computer-form-title'

  return (
    <Dialog open onClose={close} fullScreen={fullScreen} fullWidth maxWidth="sm" aria-labelledby={titleId}>
      <form onSubmit={submit} noValidate>
        <DialogTitle id={titleId}>{title}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            {notice}
            {errors.root?.server && <Alert severity="error">{errors.root.server.message}</Alert>}

            <ComponentPicker
              form={form}
              name="processorId"
              label="Processor"
              options={processors.data ?? []}
              loading={processors.isLoading}
            />
            <ComponentPicker
              form={form}
              name="graphicsCardId"
              label="Graphics card"
              options={graphicsCards.data ?? []}
              loading={graphicsCards.isLoading}
            />

            {/* Two equal columns; each amount sits next to its unit with a fixed-width unit picker. */}
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, alignItems: 'start' }}>
              <AmountWithUnit>
                <NumberField form={form} name="ram.value" label="RAM" />
                <UnitSelect form={form} valueName="ram.value" unitName="ram.unit" units={ramUnits} label="Unit" />
              </AmountWithUnit>
              <NumberField form={form} name="psuWatts" label="Power supply" step="1" endAdornment="W" />

              <AmountWithUnit>
                <NumberField form={form} name="storage.value" label="Storage" />
                <UnitSelect form={form} valueName="storage.value" unitName="storage.unit" units={storageUnits} label="Unit" />
              </AmountWithUnit>
              <Controller
                control={form.control}
                name="storage.type"
                render={({ field }) => (
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    size="small"
                    aria-label="Storage type"
                    value={field.value}
                    onChange={(_, value) => value && field.onChange(value)}
                    sx={{ height: 40 }}
                  >
                    {Object.entries(storageTypeLabels).map(([value, label]) => (
                      <ToggleButton key={value} value={value}>
                        {label}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                )}
              />

              <AmountWithUnit>
                <NumberField form={form} name="weight.value" label="Weight" />
                <UnitSelect form={form} valueName="weight.value" unitName="weight.unit" units={weightUnits} label="Unit" />
              </AmountWithUnit>
            </Box>

            <UsbPortsField form={form} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            {submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
