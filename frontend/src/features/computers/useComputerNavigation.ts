import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router'

/**
 * Opens and closes the details view. The current query string (search, filters, sort, page)
 * travels with it, so closing the details returns to exactly the same list.
 */
export function useComputerNavigation() {
  const navigate = useNavigate()
  const { search } = useLocation()

  const openDetails = useCallback((id: number) => navigate({ pathname: `/computers/${id}`, search }), [navigate, search])
  const closeDetails = useCallback(() => navigate({ pathname: '/', search }), [navigate, search])

  return { openDetails, closeDetails }
}
