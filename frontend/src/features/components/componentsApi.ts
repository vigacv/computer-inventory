import { baseApi } from '../../api/baseApi'
import type { ComponentInfo, NewComponent } from '../computers/types'

/** Same order as the API: by manufacturer, then model (case-insensitive). */
const byManufacturerThenModel = (a: ComponentInfo, b: ComponentInfo) =>
  a.manufacturer.localeCompare(b.manufacturer, undefined, { sensitivity: 'base' }) ||
  a.model.localeCompare(b.model, undefined, { sensitivity: 'base' })

/** Processors and graphics cards to choose from in the computer form, and adding new ones. */
export const componentsApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    listProcessors: build.query<ComponentInfo[], void>({
      query: () => '/processors',
      providesTags: ['Processor'],
    }),
    listGraphicsCards: build.query<ComponentInfo[], void>({
      query: () => '/graphics-cards',
      providesTags: ['GraphicsCard'],
    }),
    createProcessor: build.mutation<ComponentInfo, NewComponent>({
      query: (component) => ({ url: '/processors', method: 'POST', body: component }),
      // Add it to the cached list right away, so the picker can show it as selected without a refetch.
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: undefined }))
        if (data) {
          dispatch(componentsApi.util.updateQueryData('listProcessors', undefined, (list) => {
            list.push(data)
            list.sort(byManufacturerThenModel)
          }))
        }
      },
      // A new manufacturer, or one that now makes processors, changes the filter dropdowns.
      invalidatesTags: (result) => (result ? ['Lookups'] : []),
    }),
    createGraphicsCard: build.mutation<ComponentInfo, NewComponent>({
      query: (component) => ({ url: '/graphics-cards', method: 'POST', body: component }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled.catch(() => ({ data: undefined }))
        if (data) {
          dispatch(componentsApi.util.updateQueryData('listGraphicsCards', undefined, (list) => {
            list.push(data)
            list.sort(byManufacturerThenModel)
          }))
        }
      },
      invalidatesTags: (result) => (result ? ['Lookups'] : []),
    }),
  }),
})

export const {
  useListProcessorsQuery,
  useListGraphicsCardsQuery,
  useCreateProcessorMutation,
  useCreateGraphicsCardMutation,
} = componentsApi
