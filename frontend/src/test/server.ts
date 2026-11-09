import { setupServer } from 'msw/node'

/** Mock API for component tests. Tests register handlers with `server.use(...)`. */
export const server = setupServer()
