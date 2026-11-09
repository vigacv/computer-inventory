import { baseApi } from '../../api/baseApi'
import type { Lookups } from './types'

export const lookupsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getLookups: build.query<Lookups, void>({
      query: () => '/lookups',
      providesTags: ['Lookups'],
    }),
  }),
})

export const { useGetLookupsQuery } = lookupsApi
