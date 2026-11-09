import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { lookupsFixture } from './fixtures/lookups'

/** Handlers every test gets unless it overrides them with `server.use(...)`. */
export const defaultHandlers = [http.get('*/api/lookups', () => HttpResponse.json(lookupsFixture))]

export const server = setupServer(...defaultHandlers)
