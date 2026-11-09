import { isRejectedWithValue, type Middleware } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { enqueueSnackbar } from 'notistack'
import { getErrorMessage } from './errors'

/**
 * Shows a snackbar when a mutation (create/update/delete) fails.
 * Failed queries are shown inline where the data would be, so they're not notified here.
 */
export const errorNotifier: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const meta = action.meta as { arg?: { type?: string } }
    if (meta.arg?.type === 'mutation') {
      enqueueSnackbar(getErrorMessage(action.payload as FetchBaseQueryError), { variant: 'error' })
    }
  }
  return next(action)
}
