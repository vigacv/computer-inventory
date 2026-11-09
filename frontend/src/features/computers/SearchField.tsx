import ClearIcon from '@mui/icons-material/Clear'
import SearchIcon from '@mui/icons-material/Search'
import { IconButton, InputAdornment, TextField } from '@mui/material'
import { useEffect, useState } from 'react'
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback'

export const SEARCH_DEBOUNCE_MS = 300

interface SearchFieldProps {
  value: string | undefined
  onSearch: (value: string) => void
}

/** Search box that reports changes after the user pauses typing (or immediately on Enter / clear). */
export function SearchField({ value, onSearch }: SearchFieldProps) {
  const [text, setText] = useState(value ?? '')
  const debounced = useDebouncedCallback(onSearch, SEARCH_DEBOUNCE_MS)

  // Follow outside changes (e.g. "Clear filters"), but not our own debounced echo of what's typed:
  // the store holds the trimmed text, which would otherwise eat a trailing space mid-typing.
  useEffect(() => {
    if ((value ?? '') !== text.trim()) setText(value ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const submitNow = (next: string) => {
    debounced.cancel()
    onSearch(next)
  }

  return (
    <TextField
      fullWidth
      size="small"
      label="Search"
      placeholder="Processor or graphics card, e.g. “intel gtx 1080”"
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        debounced.run(e.target.value)
      }}
      onKeyDown={(e) => e.key === 'Enter' && submitNow(text)}
      slotProps={{
        htmlInput: { maxLength: 100 },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
          endAdornment: text && (
            <InputAdornment position="end">
              <IconButton
                size="small"
                aria-label="Clear search"
                onClick={() => {
                  setText('')
                  submitNow('')
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  )
}
