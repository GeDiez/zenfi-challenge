import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DISCARDED, TRANSACTIONS } from '../../../data'
import { AboutModal } from '../AboutModal'

const trigger = () => screen.getByRole('button', { name: /qué es esto/i })
const dialog = () => screen.getByRole('dialog')

const open = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(trigger())
}

describe('AboutModal', () => {
  it('stays out of the accessibility tree until opened', async () => {
    const user = userEvent.setup()
    render(<AboutModal />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await open(user)
    expect(dialog()).toBeInTheDocument()
  })

  it('is a modal dialog with a name, not an anonymous box', () => {
    render(<AboutModal />)

    // Without aria-modal a screen reader keeps offering the page behind it;
    // without a name it is announced as just "dialog".
    expect(trigger()).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('names itself through its heading', async () => {
    const user = userEvent.setup()
    render(<AboutModal />)
    await open(user)

    expect(dialog()).toHaveAttribute('aria-modal', 'true')
    expect(dialog()).toHaveAccessibleName(/qué es esto/i)
  })

  it('moves focus into the dialog on open', async () => {
    const user = userEvent.setup()
    render(<AboutModal />)
    await open(user)

    // Otherwise the next Tab lands behind the overlay.
    expect(dialog().contains(document.activeElement)).toBe(true)
  })

  it('keeps Tab inside, wrapping at both ends', async () => {
    const user = userEvent.setup()
    render(<AboutModal />)
    await open(user)

    const focusables = within(dialog()).getAllByRole('button')
    const last = focusables[focusables.length - 1]

    last.focus()
    await user.tab()
    expect(dialog().contains(document.activeElement)).toBe(true)

    focusables[0].focus()
    await user.tab({ shift: true })
    expect(dialog().contains(document.activeElement)).toBe(true)
  })

  it('closes on Escape and hands focus back to the trigger', async () => {
    const user = userEvent.setup()
    render(<AboutModal />)
    await open(user)

    await user.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // Without this the keyboard user is dropped at the top of the document.
    expect(trigger()).toHaveFocus()
  })

  it('closes from its own button', async () => {
    const user = userEvent.setup()
    render(<AboutModal />)
    await open(user)

    await user.click(screen.getByRole('button', { name: 'Entendido' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger()).toHaveFocus()
  })

  it('renders outside the header, not inside it', async () => {
    const user = userEvent.setup()
    render(
      <header style={{ backdropFilter: 'blur(4px)' }}>
        <AboutModal />
      </header>,
    )
    await open(user)

    // `backdrop-filter` establishes a containing block, so a fixed overlay
    // rendered inside the header resolves against the HEADER instead of the
    // viewport — which collapsed this dialog into a strip across the top.
    const overlay = dialog().parentElement
    expect(overlay?.parentElement).toBe(document.body)
    expect(screen.getByRole('banner').contains(dialog())).toBe(false)
  })

  it('stops the page behind from scrolling while open', async () => {
    const user = userEvent.setup()
    render(<AboutModal />)

    expect(document.body.style.overflow).not.toBe('hidden')
    await open(user)
    expect(document.body.style.overflow).toBe('hidden')

    await user.keyboard('{Escape}')
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('describes what the page actually shows, using the real figures', async () => {
    const user = userEvent.setup()
    render(<AboutModal />)
    await open(user)

    // Numbers come from the data, so the copy cannot drift from the page.
    expect(dialog()).toHaveTextContent(
      new RegExp(`${String(TRANSACTIONS.length)} movimientos`),
    )
    expect(dialog()).toHaveTextContent(
      new RegExp(`${String(DISCARDED.length)} movimientos quedaron fuera`),
    )
  })
})
