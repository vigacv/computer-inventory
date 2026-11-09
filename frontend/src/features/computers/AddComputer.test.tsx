import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import App from '../../App'
import { computerFixture, detailsFixture, pageOf } from '../../test/fixtures/computers'
import { LocationProbe } from '../../test/LocationProbe'
import { renderWithProviders } from '../../test/render'
import { server } from '../../test/server'
import type { ComputerDetails } from './types'

let posted: Record<string, unknown>[]

function mockApi(postResponse?: () => Response) {
  posted = []
  let created: ComputerDetails | undefined
  server.use(
    http.get('*/api/computers', () => HttpResponse.json(pageOf(created ? [computerFixture(), created] : [computerFixture()]))),
    http.post('*/api/computers', async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      posted.push(body)
      if (postResponse) return postResponse()
      created = detailsFixture({ ...(body as Partial<ComputerDetails>), id: 11 })
      return HttpResponse.json(created, { status: 201 })
    }),
  )
}

async function openAddDialog() {
  renderWithProviders(
    <>
      <App />
      <LocationProbe />
    </>,
    { route: '/?search=fx' },
  )
  await userEvent.click(await screen.findByRole('button', { name: 'Add computer' }))
  return within(await screen.findByRole('dialog', { name: 'Add computer' }))
}

async function pick(form: ReturnType<typeof within>, label: string, option: string) {
  await userEvent.click(form.getByRole('combobox', { name: label }))
  await userEvent.click(await screen.findByRole('option', { name: option }))
}

describe('Add computer', () => {
  beforeEach(() => localStorage.clear())

  it('starts empty and checks every required field before sending', async () => {
    mockApi()
    const form = await openAddDialog()

    expect(form.getByRole('spinbutton', { name: 'RAM' })).toHaveValue(null)
    await userEvent.click(form.getByRole('button', { name: 'Add computer' }))

    expect(await form.findByText('Choose a processor.')).toBeInTheDocument()
    expect(form.getByText('Choose a graphics card.')).toBeInTheDocument()
    expect(form.getByText('Enter the RAM.')).toBeInTheDocument()
    expect(form.getByText('Enter the storage capacity.')).toBeInTheDocument()
    expect(form.getByText('Enter the weight.')).toBeInTheDocument()
    expect(form.getByText('Enter the PSU wattage.')).toBeInTheDocument()
    expect(posted).toHaveLength(0)
  })

  it('adds the computer and opens its details, keeping the list query', async () => {
    mockApi()
    const form = await openAddDialog()

    await pick(form, 'Processor', 'Core i5-6400')
    await pick(form, 'Graphics card', 'GeForce GTX 1080')
    await userEvent.type(form.getByRole('spinbutton', { name: 'RAM' }), '16')
    await userEvent.type(form.getByRole('spinbutton', { name: 'Storage' }), '1')
    await userEvent.click(form.getAllByRole('combobox', { name: 'Unit' })[1])
    await userEvent.click(await screen.findByRole('option', { name: 'TB' }))
    await userEvent.click(form.getByRole('button', { name: 'HDD' }))
    await userEvent.type(form.getByRole('spinbutton', { name: 'Weight' }), '6.5')
    await userEvent.type(form.getByRole('spinbutton', { name: 'Power supply' }), '650')
    await userEvent.click(form.getByRole('button', { name: 'Add USB port type' }))
    await userEvent.click(form.getByRole('button', { name: 'Add computer' }))

    await waitFor(() => expect(posted).toHaveLength(1))
    expect(posted[0]).toEqual({
      processorId: 7,
      graphicsCardId: 3,
      ramMb: 16384,
      storageCapacityGb: 1000,
      storageType: 'Hdd',
      weightGrams: 6500,
      psuWatts: 650,
      usbPorts: [{ type: 'Usb2', count: 1 }],
    })
    expect(await screen.findByText('Computer #11 added.')).toBeInTheDocument()
    expect(await screen.findByRole('dialog', { name: 'Computer #11' })).toBeInTheDocument()
    expect(screen.getByTestId('pathname')).toHaveTextContent('/computers/11')
    expect(screen.getByTestId('location').textContent).toBe('?search=fx')
  })

  it('shows server errors on the matching fields', async () => {
    mockApi(() =>
      HttpResponse.json({ errors: { ProcessorId: ['The selected processor does not exist.'] } }, { status: 400 }),
    )
    const form = await openAddDialog()

    await pick(form, 'Processor', 'Core i5-6400')
    await pick(form, 'Graphics card', 'GeForce GTX 1080')
    for (const [name, value] of [['RAM', '8'], ['Storage', '500'], ['Weight', '5'], ['Power supply', '400']]) {
      await userEvent.type(form.getByRole('spinbutton', { name }), value)
    }
    await userEvent.click(form.getByRole('button', { name: 'Add computer' }))

    expect(await form.findByText('The selected processor does not exist.')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Add computer' })).toBeInTheDocument()
  })
})
