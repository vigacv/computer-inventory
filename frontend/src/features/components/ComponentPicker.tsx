import { Autocomplete, createFilterOptions, TextField } from '@mui/material'
import { useRef, useState, type Ref } from 'react'
import type { ComponentInfo } from '../computers/types'
import { AddComponentDialog } from './AddComponentDialog'
import { componentKinds, type ComponentKind } from './componentKinds'

/** The last entry in the list: adds a new component, prefilled with what was typed. */
interface AddOption {
  add: true
  input: string
}
type Option = ComponentInfo | AddOption

const isAdd = (option: Option): option is AddOption => 'add' in option

const filterComponents = createFilterOptions<ComponentInfo>({ stringify: (c) => `${c.manufacturer} ${c.model}` })

interface ComponentPickerProps {
  kind: ComponentKind
  value: number | undefined
  onChange: (id: number | undefined) => void
  onBlur?: () => void
  inputRef?: Ref<HTMLInputElement>
  error?: string
}

/**
 * Searchable processor / graphics card picker, grouped by manufacturer. If what you need isn't
 * listed, "Add …" (always last, reachable by keyboard) adds it and selects it.
 */
export function ComponentPicker({ kind, value, onChange, onBlur, inputRef, error }: ComponentPickerProps) {
  const { label, noun, useList } = componentKinds[kind]
  const { data: components = [], isLoading } = useList()
  const [adding, setAdding] = useState<{ model: string } | null>(null)
  // Focus moving into the "add" dialog isn't the user leaving the field: don't report it as
  // touched, or the form would show "Choose a processor." while they're adding one.
  const choosingAdd = useRef(false)

  return (
    <>
      <Autocomplete<Option>
        options={components}
        loading={isLoading}
        value={components.find((c) => c.id === value) ?? null}
        onChange={(_, option) => {
          if (option && isAdd(option)) {
            choosingAdd.current = true
            // Open on the next tick: the picker is still handling the click/Enter and would pull
            // focus back from the dialog's first field.
            const model = option.input
            setTimeout(() => setAdding({ model }))
          } else {
            onChange(option?.id)
          }
        }}
        onBlur={() => {
          if (!choosingAdd.current) onBlur?.()
        }}
        filterOptions={(options, state) => [
          ...filterComponents(options.filter((o): o is ComponentInfo => !isAdd(o)), state),
          { add: true, input: state.inputValue.trim() },
        ]}
        groupBy={(o) => (isAdd(o) ? 'Not listed?' : o.manufacturer)}
        getOptionLabel={(o) => (isAdd(o) ? '' : o.model)}
        renderOption={({ key, ...props }, o) => (
          <li key={key} {...props}>
            {isAdd(o) ? (o.input ? `Add “${o.input}” as a new ${noun}…` : `Add a new ${noun}…`) : o.model}
          </li>
        )}
        isOptionEqualToValue={(a, b) => !isAdd(a) && !isAdd(b) && a.id === b.id}
        renderInput={(params) => (
          <TextField
            {...params}
            inputRef={inputRef}
            label={label}
            size="small"
            error={!!error}
            helperText={error}
          />
        )}
      />
      {adding && (
        <AddComponentDialog
          kind={kind}
          initialModel={adding.model}
          onClose={() => {
            choosingAdd.current = false
            setAdding(null)
          }}
          onCreated={(component) => {
            choosingAdd.current = false
            setAdding(null)
            onChange(component.id)
          }}
        />
      )}
    </>
  )
}
