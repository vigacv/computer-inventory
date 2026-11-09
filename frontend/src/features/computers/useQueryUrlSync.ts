import { useEffect, useLayoutEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import { queryReplaced, selectComputersQuery } from './computersQuerySlice'
import { parseQueryParams, toQueryParams } from './queryParams'

/**
 * Two-way sync between the list state in Redux and the URL, so searches can be bookmarked and shared.
 * - On mount, the URL wins: its state is loaded into the store.
 * - After that, the store wins: every change is written back to the URL (replacing the history
 *   entry, so typing in the search box doesn't flood the back button).
 *
 * Returns false until the URL has been read, so callers can hold off fetching with stale defaults.
 */
export function useQueryUrlSync(): boolean {
  const dispatch = useAppDispatch()
  const query = useAppSelector(selectComputersQuery)
  const [searchParams, setSearchParams] = useSearchParams()
  const [hydrated, setHydrated] = useState(false)

  // Layout effect: runs before paint, so the first visible render already has the URL's state.
  useLayoutEffect(() => {
    dispatch(queryReplaced(parseQueryParams(searchParams)))
    setHydrated(true)
    // Only on mount: afterwards the store is the source of truth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hydrated) return
    const next = toQueryParams(query)
    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true })
    }
  }, [hydrated, query, searchParams, setSearchParams])

  return hydrated
}
