import { isRejectedWithValue, type Middleware } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { enqueueSnackbar } from 'notistack'
import { getErrorMessage } from './errors'

/** Errors that forms show inline: field errors (400) and edit conflicts (409). */
const handledByForms = new Set<unknown>([400, 409])

/**
 * Shows a snackbar when a mutation (create/update/delete) fails unexpectedly.
 * Failed queries are shown inline where the data would be, and so are form errors.
 */
export const errorNotifier: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const meta = action.meta as { arg?: { type?: string } }
    const status = (action.payload as FetchBaseQueryError | undefined)?.status
    if (meta.arg?.type === 'mutation' && !handledByForms.has(status)) {
      enqueueSnackbar(getErrorMessage(action.payload as FetchBaseQueryError), { variant: 'error' })
    }
  }
  return next(action)
}
