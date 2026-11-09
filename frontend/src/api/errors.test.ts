import { getErrorMessage } from './errors'

describe('getErrorMessage', () => {
  it('prefers the first validation error', () => {
    expect(
      getErrorMessage({ status: 400, data: { title: 'Validation failed', errors: { PageSize: ['Too big'] } } }),
    ).toBe('Too big')
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
})
