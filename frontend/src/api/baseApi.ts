import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL
if (!configuredBaseUrl) {
  throw new Error('VITE_API_BASE_URL is not set. See frontend/.env.')
}

/**
 * Absolute URL of the API. A relative value (e.g. "/api") is resolved against the page's origin,
 * which also makes it usable from tests running on Node, where relative URLs can't be fetched.
 */
export const apiBaseUrl = new URL(configuredBaseUrl, window.location.origin).href

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
