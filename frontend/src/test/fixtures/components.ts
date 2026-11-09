import type { ComponentInfo } from '../../features/computers/types'

export const processorsFixture: ComponentInfo[] = [
  { id: 5, manufacturer: 'AMD', model: 'FX-8370' },
  { id: 3, manufacturer: 'AMD', model: 'Athlon 5150' },
  { id: 1, manufacturer: 'Intel', model: 'Celeron N3050' },
  { id: 7, manufacturer: 'Intel', model: 'Core i5-6400' },
]

export const graphicsCardsFixture: ComponentInfo[] = [
  { id: 5, manufacturer: 'AMD', model: 'Radeon RX 480' },
  { id: 1, manufacturer: 'NVIDIA', model: 'GeForce GTX 770' },
  { id: 3, manufacturer: 'NVIDIA', model: 'GeForce GTX 1080' },
]
