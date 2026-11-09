import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

/**
 * Resolved to an absolute URL so it works with both relative and absolute settings,
 * and outside the browser (tests run on Node, where relative URLs can't be fetched).
 */
export const apiBaseUrl = new URL(import.meta.env.VITE_API_BASE_URL ?? '/api', window.location.origin).href

/**
 * Single RTK Query API slice. Feature folders extend it with
 * `baseApi.injectEndpoints(...)` so each feature owns its own endpoints.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: apiBaseUrl }),
  tagTypes: ['Computer', 'Processor', 'GraphicsCard', 'Lookups'],
  endpoints: () => ({}),
})
