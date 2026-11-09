import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import App from '../../App'
import { detailsFixture, pageOf } from '../../test/fixtures/computers'
import { renderWithProviders } from '../../test/render'
import { server } from '../../test/server'
import type { ComputerDetails } from './types'

let stored: ComputerDetails
const putBodies: Record<string, unknown>[] = []

function mockApi(putResponse?: () => Response) {
  stored = detailsFixture()
  putBodies.length = 0
  server.use(
    http.get('*/api/computers', () => HttpResponse.json(pageOf([stored]))),
    http.get('*/api/computers/5', () => HttpResponse.json(stored)),
    http.put('*/api/computers/5', async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      putBodies.push(body)
      if (putResponse) return putResponse()
      stored = { ...stored, ...(body as Partial<ComputerDetails>), rowVersion: 'AAAAAAAAB9I=' }
      return HttpResponse.json(stored)
    }),
  )
}

async function openEditor() {
  renderWithProviders(<App />, { route: '/computers/5' })
  const drawer = await screen.findByRole('dialog', { name: 'Computer #5' })
  await userEvent.click(await within(drawer).findByRole('button', { name: 'Edit' }))
  const form = await screen.findByRole('dialog', { name: 'Edit computer #5' })
  // Wait for the component lists so the pickers show the current values.
  await waitFor(() => expect(within(form).getByRole('combobox', { name: 'Processor' })).toHaveValue('FX-8370'))
  return within(form)
}

async function replaceNumber(input: HTMLElement, value: string) {
  await userEvent.clear(input)
  await userEvent.type(input, value)
}

describe('Edit computer', () => {
  beforeEach(() => localStorage.clear())

  it('shows the current values in friendly units', async () => {
    mockApi()
    const form = await openEditor()

    expect(form.getByRole('combobox', { name: 'Graphics card' })).toHaveValue('Radeon RX 480')
    expect(form.getByRole('spinbutton', { name: 'RAM' })).toHaveValue(32)
    expect(form.getByRole('spinbutton', { name: 'Storage' })).toHaveValue(750)
    expect(form.getByRole('button', { name: 'SSD' })).toHaveAttribute('aria-pressed', 'true')
    expect(form.getByRole('spinbutton', { name: 'Weight' })).toHaveValue(7)
    expect(form.getByRole('spinbutton', { name: 'Power supply' })).toHaveValue(1000)
    expect(form.getAllByRole('spinbutton', { name: 'Count' })).toHaveLength(3)
  })

  it('saves changes in API units and shows them right away', async () => {
    mockApi()
    const form = await openEditor()

    await replaceNumber(form.getByRole('spinbutton', { name: 'RAM' }), '64')
    await userEvent.click(form.getByRole('button', { name: 'HDD' }))
    await userEvent.click(form.getByRole('button', { name: 'Remove USB-C ports' }))
    await userEvent.click(form.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Edit computer #5' })).not.toBeInTheDocument())
    expect(putBodies).toEqual([
      {
        processorId: 5,
        graphicsCardId: 5,
        ramMb: 65536,
        storageCapacityGb: 750,
        storageType: 'Hdd',
        weightGrams: 7000,
        psuWatts: 1000,
        usbPorts: [
          { type: 'Usb2', count: 2 },
          { type: 'Usb3', count: 2 },
        ],
        rowVersion: 'AAAAAAAAB9E=',
      },
    ])
    expect(await screen.findByText('Computer #5 saved.')).toBeInTheDocument()
    const drawer = within(screen.getByRole('dialog', { name: 'Computer #5' }))
    expect(drawer.getByText('64 GB')).toBeInTheDocument()
    expect(drawer.getByText('750 GB HDD')).toBeInTheDocument()
  })

  it('converts the amount when the unit changes', async () => {
    mockApi()
    const form = await openEditor()

    await userEvent.click(form.getAllByRole('combobox', { name: 'Unit' })[0])
    await userEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name: 'MB' }))

    expect(form.getByRole('spinbutton', { name: 'RAM' })).toHaveValue(32768)
  })

  it('checks the form before sending anything', async () => {
    mockApi()
    const form = await openEditor()

    await userEvent.clear(form.getByRole('spinbutton', { name: 'RAM' }))
    await userEvent.click(form.getByRole('button', { name: 'Save changes' }))

    expect(await form.findByText('Enter the RAM.')).toBeInTheDocument()
    expect(putBodies).toHaveLength(0)
  })

  it('shows server validation errors under the matching fields', async () => {
    mockApi(() =>
      HttpResponse.json(
        { title: 'One or more validation errors occurred.', errors: { PsuWatts: ['PSU is out of range.'] } },
        { status: 400 },
      ),
    )
    const form = await openEditor()

    await userEvent.click(form.getByRole('button', { name: 'Save changes' }))

    expect(await form.findByText('PSU is out of range.')).toBeInTheDocument()
    expect(form.getByRole('spinbutton', { name: 'Power supply' })).toHaveAttribute('aria-invalid', 'true')
  })

  it('explains an edit conflict and loads the latest version', async () => {
    mockApi(() => HttpResponse.json({ title: 'Edit conflict' }, { status: 409 }))
    const form = await openEditor()

    await replaceNumber(form.getByRole('spinbutton', { name: 'RAM' }), '64')
    await userEvent.click(form.getByRole('button', { name: 'Save changes' }))
    expect(await form.findByText(/someone else changed this computer/i)).toBeInTheDocument()

    stored = { ...stored, ramMb: 8192, rowVersion: 'AAAAAAAAB9M=' } // what the other person saved
    await userEvent.click(form.getByRole('button', { name: 'Load latest' }))

    const reloaded = within(await screen.findByRole('dialog', { name: 'Edit computer #5' }))
    await waitFor(() => expect(reloaded.getByRole('spinbutton', { name: 'RAM' })).toHaveValue(8))
    expect(reloaded.queryByText(/someone else changed/i)).not.toBeInTheDocument()
  })

  it('adds a USB port type that is not listed yet', async () => {
    mockApi()
    stored = detailsFixture({ usbPorts: [{ type: 'Usb2', count: 4 }] })
    const form = await openEditor()

    await userEvent.click(form.getByRole('button', { name: 'Add USB port type' }))

    const types = form.getAllByRole('combobox', { name: 'Type' }).map((t) => t.textContent)
    expect(types).toEqual(['USB 2.0', 'USB 3.0'])
  })
})
