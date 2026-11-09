import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import App from '../../App'
import { computerFixture, detailsFixture, pageOf } from '../../test/fixtures/computers'
import { LocationProbe } from '../../test/LocationProbe'
import { renderWithProviders } from '../../test/render'
import { server } from '../../test/server'

let deleted: boolean
let deleteCalls: number

function mockApi(deleteResponse?: () => Response) {
  deleted = false
  deleteCalls = 0
  server.use(
    http.get('*/api/computers', () =>
      HttpResponse.json(pageOf(deleted ? [computerFixture()] : [computerFixture(), detailsFixture()])),
    ),
    http.get('*/api/computers/5', () =>
      deleted ? HttpResponse.json({ title: 'Computer not found' }, { status: 404 }) : HttpResponse.json(detailsFixture()),
    ),
    http.delete('*/api/computers/5', () => {
      deleteCalls++
      if (deleteResponse) return deleteResponse()
      deleted = true
      return new HttpResponse(null, { status: 204 })
    }),
  )
}

async function askToDelete() {
  renderWithProviders(
    <>
      <App />
      <LocationProbe />
    </>,
    { route: '/computers/5?search=amd' },
  )
  const drawer = within(await screen.findByRole('dialog', { name: 'Computer #5' }))
  await userEvent.click(await drawer.findByRole('button', { name: 'Delete' }))
  return within(await screen.findByRole('dialog', { name: 'Delete computer #5?' }))
}

describe('Delete computer', () => {
  it('asks for confirmation and does nothing when cancelled', async () => {
    mockApi()
    const confirm = await askToDelete()

    expect(confirm.getByText(/can't be undone/i)).toBeInTheDocument()
    expect(confirm.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await userEvent.click(confirm.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Delete computer #5?' })).not.toBeInTheDocument())
    expect(deleteCalls).toBe(0)
    expect(await screen.findByRole('dialog', { name: 'Computer #5' })).toBeInTheDocument()
  })

  it('deletes, closes the details and refreshes the list', async () => {
    mockApi()
    const confirm = await askToDelete()

    await userEvent.click(confirm.getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('Computer #5 deleted.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Computer #5' })).not.toBeInTheDocument())
    expect(screen.getByTestId('pathname')).toHaveTextContent(/^\/$/)
    expect(screen.getByTestId('location').textContent).toBe('?search=amd')
    await waitFor(() => expect(screen.queryByText('AMD FX-8370')).not.toBeInTheDocument())
    expect(deleteCalls).toBe(1)
  })

  it('reports a failed delete and keeps the details open', async () => {
    mockApi(() => HttpResponse.json({ title: 'Server error', detail: 'Database unavailable' }, { status: 500 }))
    const confirm = await askToDelete()

    await userEvent.click(confirm.getByRole('button', { name: 'Delete' }))

    expect(await screen.findByText('Database unavailable')).toBeInTheDocument()
    expect(await screen.findByRole('dialog', { name: 'Computer #5' })).toBeInTheDocument()
  })
})
