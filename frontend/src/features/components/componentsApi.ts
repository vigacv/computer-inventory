import { baseApi } from '../../api/baseApi'
import type { ComponentInfo } from '../computers/types'

/** Processors and graphics cards to choose from in the computer form. */
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
  }),
})

export const { useListProcessorsQuery, useListGraphicsCardsQuery } = componentsApi
