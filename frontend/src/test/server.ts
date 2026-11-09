import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { graphicsCardsFixture, processorsFixture } from './fixtures/components'
import { lookupsFixture } from './fixtures/lookups'

/** Handlers every test gets unless it overrides them with `server.use(...)`. */
export const defaultHandlers = [
  http.get('*/api/lookups', () => HttpResponse.json(lookupsFixture)),
  http.get('*/api/processors', () => HttpResponse.json(processorsFixture)),
  http.get('*/api/graphics-cards', () => HttpResponse.json(graphicsCardsFixture)),
]

export const server = setupServer(...defaultHandlers)
