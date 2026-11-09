import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

/**
 * Single RTK Query API slice. Feature folders extend it with
 * `baseApi.injectEndpoints(...)` so each feature owns its own endpoints.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Computer', 'Processor', 'GraphicsCard', 'Lookups'],
  endpoints: () => ({}),
})
