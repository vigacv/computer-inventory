import { useLocation } from 'react-router'

/** Renders the router's current query string so tests can assert on URL changes. */
export function LocationProbe() {
  return <output data-testid="location">{useLocation().search}</output>
}
