import { baseApi } from '../../api/baseApi'
import type { PagedResult } from '../../api/types'
import type { ComputerDetails, ComputerSpec, ComputerSummary, SearchComputersArgs, UpdateComputerArgs } from './types'

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
    updateComputer: build.mutation<ComputerDetails, UpdateComputerArgs>({
      query: ({ id, spec, rowVersion }) => ({ url: `/computers/${id}`, method: 'PUT', body: { ...spec, rowVersion } }),
      // The response is the saved computer: put it straight into the details cache (no refetch),
      // and refetch lists, since the change may affect filters, sorting and what's on each page.
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: undefined }))
        if (data) dispatch(computersApi.util.upsertQueryData('getComputer', id, data))
      },
      invalidatesTags: (result) => (result ? [{ type: 'Computer', id: 'LIST' }] : []),
    }),
    createComputer: build.mutation<ComputerDetails, ComputerSpec>({
      query: (spec) => ({ url: '/computers', method: 'POST', body: spec }),
      // Like update: cache the new computer's details (so opening it is instant) and refetch lists.
      async onQueryStarted(_spec, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: undefined }))
        if (data) dispatch(computersApi.util.upsertQueryData('getComputer', data.id, data))
      },
      invalidatesTags: (result) => (result ? [{ type: 'Computer', id: 'LIST' }] : []),
    }),
    deleteComputer: build.mutation<void, number>({
      query: (id) => ({ url: `/computers/${id}`, method: 'DELETE' }),
      // Refetch lists, and its own details so a revisit (e.g. browser back) shows it's gone.
      invalidatesTags: (_result, error, id) =>
        error
          ? []
          : [
              { type: 'Computer', id: 'LIST' },
              { type: 'Computer', id },
            ],
    }),
  }),
})

export const {
  useSearchComputersQuery,
  useGetComputerQuery,
  useUpdateComputerMutation,
  useCreateComputerMutation,
  useDeleteComputerMutation,
} = computersApi
