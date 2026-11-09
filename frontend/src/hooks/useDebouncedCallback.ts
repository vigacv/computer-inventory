import { useEffect, useMemo, useRef } from 'react'

/** Returns a version of `callback` that only runs after `delayMs` without new calls. */
export function useDebouncedCallback<Args extends unknown[]>(callback: (...args: Args) => void, delayMs: number) {
  const callbackRef = useRef(callback)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  return useMemo(
    () => ({
      run: (...args: Args) => {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => callbackRef.current(...args), delayMs)
      },
      cancel: () => clearTimeout(timeoutRef.current),
    }),
    [delayMs],
  )
}
