import { getErrorMessage, getValidationErrors, toFieldPath } from './errors'

const validationError = {
  status: 400,
  data: {
    title: 'One or more validation errors occurred.',
    errors: {
      PageSize: ['Page size must be between 1 and 100.'],
      SortBy: ['Unknown sort key.'],
      'UsbPorts[0].Count': ['Count must be greater than 0.', 'Unknown sort key.'],
    },
  },
}

describe('getErrorMessage', () => {
  it('includes every distinct validation message', () => {
    expect(getErrorMessage(validationError)).toBe(
      'Page size must be between 1 and 100. Unknown sort key. Count must be greater than 0.',
    )
  })

  it('falls back to detail, then title', () => {
    expect(getErrorMessage({ status: 409, data: { title: 'Conflict', detail: 'Changed by someone else' } })).toBe(
      'Changed by someone else',
    )
    expect(getErrorMessage({ status: 404, data: { title: 'Not Found' } })).toBe('Not Found')
  })

  it('explains network and rate limit errors', () => {
    expect(getErrorMessage({ status: 'FETCH_ERROR', error: 'TypeError' })).toMatch(/could not reach/i)
    expect(getErrorMessage({ status: 429, data: undefined })).toMatch(/too many requests/i)
  })

  it('handles missing and non-HTTP errors', () => {
    expect(getErrorMessage(undefined)).toBe('Something went wrong.')
    expect(getErrorMessage({ message: 'Boom' })).toBe('Boom')
  })
})

describe('getValidationErrors', () => {
  it('keys errors by form field path', () => {
    expect(getValidationErrors(validationError)).toEqual({
      pageSize: ['Page size must be between 1 and 100.'],
      sortBy: ['Unknown sort key.'],
      'usbPorts.0.count': ['Count must be greater than 0.', 'Unknown sort key.'],
    })
  })

  it('is empty for errors that are not validation problems', () => {
    expect(getValidationErrors({ status: 500, data: { title: 'Server error' } })).toEqual({})
    expect(getValidationErrors(undefined)).toEqual({})
  })
})

describe('toFieldPath', () => {
  it.each([
    ['PageSize', 'pageSize'],
    ['UsbPorts[0].Count', 'usbPorts.0.count'],
    ['Processor.Model', 'processor.model'],
  ])('%s -> %s', (api, field) => expect(toFieldPath(api)).toBe(field))
})
