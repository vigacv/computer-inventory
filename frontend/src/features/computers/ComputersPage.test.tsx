import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { computerFixture, pageOf } from '../../test/fixtures/computers'
import { renderWithProviders } from '../../test/render'
import { server } from '../../test/server'
import { ComputersPage } from './ComputersPage'

const computers = [
  computerFixture(),
  computerFixture({
    id: 2,
    ramMb: 32768,
    storageCapacityGb: 750,
    storageType: 'Hdd',
    weightGrams: 7000,
    psuWatts: 1000,
    processor: { id: 2, manufacturer: 'AMD', model: 'FX-8370' },
    graphicsCard: { id: 2, manufacturer: 'AMD', model: 'Radeon RX 480' },
    usbPorts: [{ type: 'UsbC', count: 1 }],
  }),
]

describe('ComputersPage', () => {
  it('lists computers with formatted specs', async () => {
    server.use(http.get('*/api/computers', () => HttpResponse.json(pageOf(computers))))

    renderWithProviders(<ComputersPage />)

    expect(await screen.findByText('Intel Celeron N3050')).toBeInTheDocument()
    expect(screen.getByText('2 computers')).toBeInTheDocument()

    const amdRow = screen.getByText('AMD FX-8370').closest('[role="row"]') as HTMLElement
    const row = within(amdRow)
    expect(row.getByText('AMD Radeon RX 480')).toBeInTheDocument()
    expect(row.getByText('32 GB')).toBeInTheDocument()
    expect(row.getByText('750 GB HDD')).toBeInTheDocument()
    expect(row.getByText('1× USB-C')).toBeInTheDocument()
    expect(row.getByText('7 kg')).toBeInTheDocument()
    expect(row.getByText('1000 W')).toBeInTheDocument()
  })

  it('asks the API for the sorted column', async () => {
    const requests: URLSearchParams[] = []
    server.use(
      http.get('*/api/computers', ({ request }) => {
        requests.push(new URL(request.url).searchParams)
        return HttpResponse.json(pageOf(computers))
      }),
    )

    const { store } = renderWithProviders(<ComputersPage />)
    await screen.findByText('Intel Celeron N3050')

    await userEvent.click(screen.getByRole('columnheader', { name: /ram/i }))

    await vi.waitFor(() => expect(requests.at(-1)?.get('sortBy')).toBe('ramMb'))
    expect(requests.at(-1)?.get('sortDir')).toBe('asc')
    expect(store.getState().computersQuery).toMatchObject({ sortBy: 'ramMb', sortDir: 'asc', page: 1 })
  })

  it('shows an error with a retry when the API fails', async () => {
    let calls = 0
    server.use(
      http.get('*/api/computers', () => {
        calls++
        return calls === 1
          ? HttpResponse.json({ title: 'Server error', detail: 'Database unavailable' }, { status: 500 })
          : HttpResponse.json(pageOf(computers))
      }),
    )

    renderWithProviders(<ComputersPage />)

    expect(await screen.findByText('Database unavailable')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /retry/i }))

    expect(await screen.findByText('Intel Celeron N3050')).toBeInTheDocument()
    expect(screen.queryByText('Database unavailable')).not.toBeInTheDocument()
  })
})
