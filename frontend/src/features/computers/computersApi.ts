import { baseApi } from '../../api/baseApi'
import type { PagedResult } from '../../api/types'
import type { ComputerSummary, SearchComputersArgs } from './types'

export const computersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    searchComputers: build.query<PagedResult<ComputerSummary>, SearchComputersArgs>({
      query: (params) => ({ url: '/computers', params }),
      providesTags: (result) => [
        { type: 'Computer', id: 'LIST' },
        ...(result?.items.map((c) => ({ type: 'Computer' as const, id: c.id })) ?? []),
      ],
    }),
  }),
})

export const { useSearchComputersQuery } = computersApi
