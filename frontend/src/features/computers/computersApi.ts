import { baseApi } from '../../api/baseApi'
import type { PagedResult } from '../../api/types'
import type { ComputerDetails, ComputerSummary, SearchComputersArgs } from './types'

export const computersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    searchComputers: build.query<PagedResult<ComputerSummary>, SearchComputersArgs>({
      query: (params) => ({ url: '/computers', params }),
      providesTags: (result) => [
        { type: 'Computer', id: 'LIST' },
        ...(result?.items.map((c) => ({ type: 'Computer' as const, id: c.id })) ?? []),
      ],
    }),
    getComputer: build.query<ComputerDetails, number>({
      query: (id) => `/computers/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Computer', id }],
    }),
  }),
})

export const { useSearchComputersQuery, useGetComputerQuery, usePrefetch } = computersApi
