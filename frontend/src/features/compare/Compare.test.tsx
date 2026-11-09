import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import App from '../../App'
import { computerFixture, detailsFixture, pageOf } from '../../test/fixtures/computers'
import { LocationProbe } from '../../test/LocationProbe'
import { renderWithProviders } from '../../test/render'
import { server } from '../../test/server'

const one = detailsFixture({
  id: 1,
  ramMb: 8192,
  storageCapacityGb: 1000,
  weightGrams: 8100,
  psuWatts: 500,
  processor: { id: 1, manufacturer: 'Intel', model: 'Celeron N3050' },
})
const five = detailsFixture({ id: 5, ramMb: 32768, storageCapacityGb: 750, weightGrams: 7000, psuWatts: 500 })

function mockApi() {
  const requested: string[][] = []
  server.use(
    http.get('*/api/computers', () =>
      HttpResponse.json(pageOf([computerFixture({ id: 1 }), computerFixture({ id: 5, processor: five.processor })])),
    ),
    http.get('*/api/computers/compare', ({ request }) => {
      const ids = new URL(request.url).searchParams.getAll('ids')
      requested.push(ids)
      const all = [one, five]
      return HttpResponse.json({
        computers: ids.map(Number).flatMap((id) => all.filter((c) => c.id === id)),
        notFound: ids.map(Number).filter((id) => !all.some((c) => c.id === id)),
      })
    }),
  )
  return requested
}

const renderApp = (route: string) =>
  renderWithProviders(
    <>
      <App />
      <LocationProbe />
    </>,
    { route },
  )

/** The comparison table's cells for a spec row, by row label. */
const cellsOf = (label: string) => within(screen.getByRole('rowheader', { name: label }).closest('tr')!).getAllByRole('cell')

describe('Compare computers', () => {
  beforeEach(() => localStorage.clear())

  it('shows the computers side by side in the order of the link', async () => {
    const requested = mockApi()
    renderApp('/compare?ids=5,1')

    const headers = await screen.findAllByRole('link', { name: /Computer #/ })
    expect(headers.map((h) => h.textContent)).toEqual(['Computer #5', 'Computer #1'])
    expect(requested[0]).toEqual(['5', '1'])
    const [ramOf5, ramOf1] = cellsOf('RAM')
    expect(ramOf5).toHaveTextContent('32 GB')
    expect(ramOf1).toHaveTextContent('8 GB')
  })

  it('highlights the best value of each spec', async () => {
    mockApi()
    renderApp('/compare?ids=1,5')
    await screen.findByRole('table', { name: 'Computer comparison' })

    const [ramOf1, ramOf5] = cellsOf('RAM')
    expect(within(ramOf5).getByTitle('Best')).toBeInTheDocument()
    expect(within(ramOf1).queryByTitle('Best')).not.toBeInTheDocument()

    const [weightOf1, weightOf5] = cellsOf('Weight') // lighter is better
    expect(within(weightOf5).getByTitle('Best')).toBeInTheDocument()
    expect(within(weightOf1).queryByTitle('Best')).not.toBeInTheDocument()

    const [storageOf1] = cellsOf('Storage') // 1 TB beats 750 GB
    expect(within(storageOf1).getByTitle('Best')).toBeInTheDocument()

    // Equal values: nothing stands out.
    expect(cellsOf('Power supply').some((c) => within(c).queryByTitle('Best'))).toBe(false)
  })

  it('can hide specs that are the same for all', async () => {
    mockApi()
    renderApp('/compare?ids=1,5')
    await screen.findByRole('table', { name: 'Computer comparison' })
    expect(screen.getByRole('rowheader', { name: 'Power supply' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('switch', { name: 'Show only differences' }))

    expect(screen.queryByRole('rowheader', { name: 'Power supply' })).not.toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: 'RAM' })).toBeInTheDocument()
  })

  it('removes a computer from the comparison', async () => {
    mockApi()
    renderApp('/compare?ids=1,5')
    await screen.findByRole('table', { name: 'Computer comparison' })

    await userEvent.click(screen.getByRole('button', { name: 'Remove computer #5 from comparison' }))

    await waitFor(() => expect(screen.getByTestId('location').textContent).toBe('?ids=1'))
    expect(await screen.findByText(/Pick at least 2 computers to compare/)).toBeInTheDocument()
  })

  it('reports computers that no longer exist', async () => {
    mockApi()
    renderApp('/compare?ids=1,5,99')

    expect(await screen.findByText(/#99 doesn't exist anymore and was left out/)).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Computer comparison' })).toBeInTheDocument()
  })

  it('is reached by ticking computers in the list', async () => {
    mockApi()
    renderApp('/')
    await screen.findByText('Intel Celeron N3050')

    const checkboxes = screen.getAllByRole('checkbox', { name: /select row/i })
    await userEvent.click(checkboxes[0])
    expect(screen.getByRole('button', { name: 'Compare' })).toBeDisabled() // needs two
    await userEvent.click(checkboxes[1])
    await userEvent.click(screen.getByRole('button', { name: 'Compare' }))

    expect(await screen.findByRole('table', { name: 'Computer comparison' })).toBeInTheDocument()
    expect(screen.getByTestId('pathname')).toHaveTextContent('/compare')
    expect(screen.getByTestId('location').textContent).toBe('?ids=1,5')
  })
})
