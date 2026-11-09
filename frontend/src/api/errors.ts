import type { SerializedError } from '@reduxjs/toolkit'
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import type { ProblemDetails } from './types'

type ApiError = FetchBaseQueryError | SerializedError | undefined

const isFetchError = (error: unknown): error is FetchBaseQueryError =>
  typeof error === 'object' && error !== null && 'status' in error

const problemOf = (error: ApiError) =>
  isFetchError(error) ? (error.data as ProblemDetails | undefined) : undefined

/**
 * Converts an API field path to the form path used by react-hook-form:
 * "UsbPorts[0].Count" -> "usbPorts.0.count".
 */
export const toFieldPath = (apiPath: string) =>
  apiPath
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toLowerCase() + segment.slice(1))
    .join('.')

/**
 * Validation errors keyed by form field path, so forms can show each message under its input.
 * Empty when the error isn't a validation problem.
 */
export function getValidationErrors(error: ApiError): Record<string, string[]> {
  const errors = problemOf(error)?.errors ?? {}
  return Object.fromEntries(Object.entries(errors).map(([field, messages]) => [toFieldPath(field), messages]))
}

/** Turns an RTK Query error into a message fit for the user, including every validation error. */
export function getErrorMessage(error: ApiError): string {
  if (!error) return 'Something went wrong.'

  if (isFetchError(error)) {
    if (error.status === 'FETCH_ERROR') return 'Could not reach the server. Check your connection and try again.'
    if (error.status === 429) return 'Too many requests. Please wait a moment and try again.'

    const problem = problemOf(error)
    const validationMessages = [...new Set(Object.values(problem?.errors ?? {}).flat())]
    if (validationMessages.length > 0) return validationMessages.join(' ')

    return problem?.detail ?? problem?.title ?? `Request failed (${String(error.status)}).`
  }

  return error.message ?? 'Something went wrong.'
}
