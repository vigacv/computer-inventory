import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { computerFixture, pageOf } from '../../test/fixtures/computers'
import { LocationProbe } from '../../test/LocationProbe'
import { renderWithProviders } from '../../test/render'
import { server } from '../../test/server'
import { ComputersPage } from './ComputersPage'

/** Records the query string of every list request the page makes. */
function captureSearches(response = pageOf([computerFixture()])) {
  const requests: URLSearchParams[] = []
  server.use(
    http.get('*/api/computers', ({ request }) => {
      requests.push(new URL(request.url).searchParams)
      return HttpResponse.json(response)
    }),
  )
  return requests
}

const renderPage = (route = '/') =>
  renderWithProviders(
    <>
      <ComputersPage />
      <LocationProbe />
    </>,
    { route },
  )

const location = () => screen.getByTestId('location').textContent

async function choose(label: string, option: string) {
  await userEvent.click(screen.getByRole('combobox', { name: label }))
  await userEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name: option }))
}

describe('Search and filters', () => {
  it('loads search and filters from the URL before the first request', async () => {
    const requests = captureSearches()

    renderPage('/?search=gtx&storageType=Ssd&minRamMb=8192')

    await screen.findByText('Intel Celeron N3050')
    expect(requests).toHaveLength(1)
    expect(Object.fromEntries(requests[0])).toMatchObject({ search: 'gtx', storageType: 'Ssd', minRamMb: '8192' })
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('gtx')
    expect(screen.getByRole('combobox', { name: 'Storage type' })).toHaveTextContent('SSD')
    expect(screen.getByText('≥ 8 GB')).toBeInTheDocument()
  })

  it('searches after the user stops typing and updates the URL', async () => {
    const requests = captureSearches()
    renderPage()
    await screen.findByText('Intel Celeron N3050')

    await userEvent.type(screen.getByRole('textbox', { name: 'Search' }), 'intel gtx')

    await waitFor(() => expect(requests.at(-1)?.get('search')).toBe('intel gtx'))
    // Debounced: one request for the whole phrase, not one per keystroke.
    expect(requests.filter((r) => r.has('search'))).toHaveLength(1)
    await waitFor(() => expect(location()).toBe('?search=intel+gtx'))
  })

  it('filters by the chosen options', async () => {
    const requests = captureSearches()
    renderPage()
    await screen.findByText('Intel Celeron N3050')

    await choose('Storage type', 'SSD')
    await choose('Has USB port', 'USB-C')
    await choose('GPU manufacturer', 'NVIDIA')

    await waitFor(() =>
      expect(Object.fromEntries(requests.at(-1)!)).toMatchObject({
        storageType: 'Ssd',
        usbPortType: 'UsbC',
        graphicsCardManufacturerId: '3',
      }),
    )
    await waitFor(() => expect(location()).toContain('storageType=Ssd'))
  })

  it('only offers manufacturers that make that kind of part', async () => {
    captureSearches()
    renderPage()

    await userEvent.click(await screen.findByRole('combobox', { name: 'CPU manufacturer' }))
    const cpuMakers = within(await screen.findByRole('listbox')).getAllByRole('option').map((o) => o.textContent)
    expect(cpuMakers).toEqual(['Any', 'AMD', 'Intel'])
  })

  it('clears every filter at once', async () => {
    const requests = captureSearches()
    renderPage('/?search=gtx&storageType=Hdd&sortBy=ramMb')
    await screen.findByText('Intel Celeron N3050')

    await userEvent.click(screen.getByRole('button', { name: /clear filters/i }))

    await waitFor(() => expect(requests.at(-1)?.has('search')).toBe(false))
    expect(requests.at(-1)?.has('storageType')).toBe(false)
    expect(requests.at(-1)?.get('sortBy')).toBe('ramMb') // sort is kept
    expect(screen.getByRole('textbox', { name: 'Search' })).toHaveValue('')
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeDisabled()
  })

  it('says when nothing matches', async () => {
    captureSearches(pageOf([]))
    renderPage('/?search=quantum')

    expect(await screen.findByText('No computers match your search and filters.')).toBeInTheDocument()
    expect(screen.getByText('0 matching computers')).toBeInTheDocument()
  })
})
