import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { ProblemDetails } from './types'

const isFetchError = (error: unknown): error is FetchBaseQueryError =>
  typeof error === 'object' && error !== null && 'status' in error

/** Turns an RTK Query error into a message fit for the user. */
export function getErrorMessage(error: FetchBaseQueryError | SerializedError | undefined): string {
  if (!error) return 'Something went wrong.'

  if (isFetchError(error)) {
    if (error.status === 'FETCH_ERROR') return 'Could not reach the server. Check your connection and try again.'
    if (error.status === 429) return 'Too many requests. Please wait a moment and try again.'

    const problem = error.data as ProblemDetails | undefined
    const firstValidationError = problem?.errors && Object.values(problem.errors).flat()[0]
    return firstValidationError ?? problem?.detail ?? problem?.title ?? `Request failed (${String(error.status)}).`
  }

  return error.message ?? 'Something went wrong.'
}
