import {
  useCreateGraphicsCardMutation,
  useCreateProcessorMutation,
  useListGraphicsCardsQuery,
  useListProcessorsQuery,
} from './componentsApi'

/** What differs between processors and graphics cards; everything else is shared. */
export const componentKinds = {
  processor: {
    label: 'Processor',
    noun: 'processor',
    useList: useListProcessorsQuery,
    useCreate: useCreateProcessorMutation,
  },
  graphicsCard: {
    label: 'Graphics card',
    noun: 'graphics card',
    useList: useListGraphicsCardsQuery,
    useCreate: useCreateGraphicsCardMutation,
  },
} as const

export type ComponentKind = keyof typeof componentKinds
