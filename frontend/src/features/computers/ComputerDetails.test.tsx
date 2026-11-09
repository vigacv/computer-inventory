import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import App from '../../App'
import { computerFixture, pageOf } from '../../test/fixtures/computers'
import { LocationProbe } from '../../test/LocationProbe'
import { renderWithProviders } from '../../test/render'
import { server } from '../../test/server'
import type { ComputerDetails } from './types'

const details: ComputerDetails = {
  ...computerFixture({
    id: 5,
    ramMb: 32768,
    storageCapacityGb: 750,
    weightGrams: 7000,
    psuWatts: 1000,
    processor: { id: 5, manufacturer: 'AMD', model: 'FX-8370' },
    graphicsCard: { id: 5, manufacturer: 'AMD', model: 'Radeon RX 480' },
    usbPorts: [
      { type: 'Usb2', count: 2 },
      { type: 'Usb3', count: 2 },
      { type: 'UsbC', count: 1 },
    ],
  }),
  createdAt: '2026-11-09T01:13:52+00:00',
  updatedAt: '2026-11-10T09:30:00+00:00',
}

function mockApi() {
  server.use(
    http.get('*/api/computers', () => HttpResponse.json(pageOf([computerFixture(), details]))),
    http.get('*/api/computers/:id', ({ params }) =>
      Number(params.id) === details.id
        ? HttpResponse.json(details)
        : HttpResponse.json({ title: 'Computer not found' }, { status: 404 }),
    ),
  )
}

const renderApp = (route: string) =>
  renderWithProviders(
    <>
      <App />
      <LocationProbe />
    </>,
    { route },
  )

const drawer = () => within(screen.getByRole('dialog'))

describe('Computer details', () => {
  beforeEach(() => {
    localStorage.clear()
    mockApi()
  })

  it('opens from a direct link with every spec', async () => {
    renderApp('/computers/5')

    expect(await screen.findByRole('dialog', { name: 'Computer #5' })).toBeInTheDocument()
    expect(await drawer().findByText('FX-8370')).toBeInTheDocument()
    expect(drawer().getByText('Radeon RX 480')).toBeInTheDocument()
    expect(drawer().getByText('32 GB')).toBeInTheDocument()
    expect(drawer().getByText('750 GB SSD')).toBeInTheDocument()
    expect(drawer().getByText('1000 W')).toBeInTheDocument()
    expect(drawer().getByText('7 kg')).toBeInTheDocument()
    expect(drawer().getByText('USB ports (5)')).toBeInTheDocument()
    expect(drawer().getByText('1× USB-C')).toBeInTheDocument()
    expect(drawer().getByText(/Last updated/)).toBeInTheDocument()
  })

  it('opens when a row is clicked and keeps the list query in the URL', async () => {
    renderApp('/?search=amd&sortBy=ramMb')
    await userEvent.click(await screen.findByText('AMD FX-8370'))

    expect(await screen.findByRole('dialog', { name: 'Computer #5' })).toBeInTheDocument()
    expect(screen.getByTestId('pathname')).toHaveTextContent('/computers/5')
    expect(screen.getByTestId('location').textContent).toBe('?search=amd&sortBy=ramMb&sortDir=asc')
  })

  it('closes back to the same list', async () => {
    renderApp('/computers/5?search=amd')
    await drawer().findByText('FX-8370')

    await userEvent.click(drawer().getByRole('button', { name: 'Close details' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByTestId('pathname')).toHaveTextContent(/^\/$/)
    expect(screen.getByTestId('location').textContent).toBe('?search=amd')
  })

  it('switches weight units everywhere and remembers the choice', async () => {
    renderApp('/computers/5')
    await drawer().findByText('7 kg')

    await userEvent.click(drawer().getByRole('button', { name: 'lb' }))

    expect(drawer().getByText('15.4 lb')).toBeInTheDocument()
    expect(within(screen.getByRole('grid', { hidden: true })).getByText('15.4 lb')).toBeInTheDocument()
    expect(localStorage.getItem('computer-inventory:preferences')).toContain('"lb"')
  })

  it('explains when the computer does not exist', async () => {
    renderApp('/computers/404')

    expect(await drawer().findByText(/doesn.t exist/i)).toBeInTheDocument()
  })

  it('treats a malformed id as not found without calling the API', async () => {
    renderApp('/computers/abc')

    expect(await drawer().findByText(/doesn.t exist/i)).toBeInTheDocument()
  })
})
