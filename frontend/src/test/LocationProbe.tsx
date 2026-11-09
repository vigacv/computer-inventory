import { useLocation } from 'react-router'

/** Renders the router's current location so tests can assert on navigation and URL changes. */
export function LocationProbe() {
  const { pathname, search } = useLocation()
  return (
    <>
      <output data-testid="location">{search}</output>
      <output data-testid="pathname">{pathname}</output>
    </>
  )
}
