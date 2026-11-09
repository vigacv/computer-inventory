import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'

/**
 * Opens and closes the details view. The current query string (search, filters, sort, page)
 * travels with it, so closing the details returns to exactly the same list.
 */
export function useComputerNavigation() {
  const navigate = useNavigate()
  const { search } = useLocation()

  /** `replace` swaps the current history entry, e.g. so Back doesn't return to a deleted computer. */
  type Options = { replace?: boolean }

  const openDetails = useCallback(
    (id: number, options?: Options) => navigate({ pathname: `/computers/${id}`, search }, options),
    [navigate, search],
  )
  const closeDetails = useCallback((options?: Options) => navigate({ pathname: '/', search }, options), [navigate, search])

  return { openDetails, closeDetails }
}
