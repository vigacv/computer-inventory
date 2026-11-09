import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import App from '../../App'
import { computerFixture, pageOf } from '../../test/fixtures/computers'
import { renderWithProviders } from '../../test/render'
import { server } from '../../test/server'

let processorPosts: unknown[]
let computerPosts: number

function mockApi(processorResponse?: () => Response) {
  processorPosts = []
  computerPosts = 0
  server.use(
    http.get('*/api/computers', () => HttpResponse.json(pageOf([computerFixture()]))),
    http.post('*/api/computers', () => {
      computerPosts++
      return HttpResponse.json({}, { status: 500 })
    }),
    http.post('*/api/processors', async ({ request }) => {
      const body = (await request.json()) as { manufacturer: string; model: string }
      processorPosts.push(body)
      if (processorResponse) return processorResponse()
      return HttpResponse.json({ id: 99, manufacturer: body.manufacturer, model: body.model }, { status: 201 })
    }),
  )
}

async function openComputerForm() {
  renderWithProviders(<App />)
  await userEvent.click(await screen.findByRole('button', { name: 'Add computer' }))
  return within(await screen.findByRole('dialog', { name: 'Add computer' }))
}

describe('Adding a processor or graphics card from the computer form', () => {
  it('adds what was typed as a new processor and selects it', async () => {
    mockApi()
    const form = await openComputerForm()

    await userEvent.type(form.getByRole('combobox', { name: 'Processor' }), 'M3 Max')
    await userEvent.click(await screen.findByRole('option', { name: 'Add “M3 Max” as a new processor…' }))

    const dialog = within(await screen.findByRole('dialog', { name: 'Add a processor' }))
    expect(dialog.getByRole('textbox', { name: 'Model' })).toHaveValue('M3 Max')
    // Opening the dialog isn't "leaving" the processor field, so no premature error behind it.
    expect(form.queryByText('Choose a processor.')).not.toBeInTheDocument()
    await userEvent.type(dialog.getByRole('combobox', { name: 'Manufacturer' }), 'Apple')
    await userEvent.click(dialog.getByRole('button', { name: 'Add processor' }))

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Add a processor' })).not.toBeInTheDocument())
    expect(processorPosts).toEqual([{ manufacturer: 'Apple', model: 'M3 Max' }])
    expect(form.getByRole('combobox', { name: 'Processor' })).toHaveValue('M3 Max')
    // The inner form's submit must not submit the computer form around it
    // (which would validate it: the empty form would show its errors).
    expect(form.queryByText('Choose a graphics card.')).not.toBeInTheDocument()
    expect(computerPosts).toBe(0)
    expect(screen.getByRole('dialog', { name: 'Add computer' })).toBeInTheDocument()
  })

  it('offers existing manufacturers and searches by manufacturer too', async () => {
    mockApi()
    const form = await openComputerForm()

    await userEvent.type(form.getByRole('combobox', { name: 'Graphics card' }), 'nvidia')
    const options = (await screen.findAllByRole('option')).map((o) => o.textContent)
    expect(options).toEqual(['GeForce GTX 770', 'GeForce GTX 1080', 'Add “nvidia” as a new graphics card…'])
  })

  it('checks both names before sending', async () => {
    mockApi()
    const form = await openComputerForm()

    await userEvent.click(form.getByRole('combobox', { name: 'Processor' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Add a new processor…' }))
    const dialog = within(await screen.findByRole('dialog', { name: 'Add a processor' }))
    await userEvent.click(dialog.getByRole('button', { name: 'Add processor' }))

    expect(await dialog.findByText('Enter the manufacturer.')).toBeInTheDocument()
    expect(dialog.getByText('Enter the model.')).toBeInTheDocument()
    expect(processorPosts).toHaveLength(0)
  })

  it('shows a duplicate reported by the API under the model', async () => {
    mockApi(() =>
      HttpResponse.json({ errors: { Model: ['This processor already exists for that manufacturer.'] } }, { status: 400 }),
    )
    const form = await openComputerForm()

    await userEvent.type(form.getByRole('combobox', { name: 'Processor' }), 'Core i5-6400')
    await userEvent.click(await screen.findByRole('option', { name: /Add “Core i5-6400”/ }))
    const dialog = within(await screen.findByRole('dialog', { name: 'Add a processor' }))
    await userEvent.type(dialog.getByRole('combobox', { name: 'Manufacturer' }), 'Intel')
    await userEvent.click(dialog.getByRole('button', { name: 'Add processor' }))

    expect(await dialog.findByText('This processor already exists for that manufacturer.')).toBeInTheDocument()
    expect(dialog.getByRole('textbox', { name: 'Model' })).toHaveAttribute('aria-invalid', 'true')
  })
})
