import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MultiSelectFilter, type FilterOption } from '../MultiSelectFilter'

const OPTIONS: FilterOption[] = [
  { id: 'a', label: 'Alfa', count: 3, colorVar: '--color-series-1' },
  { id: 'b', label: 'Beta', count: 5 },
  { id: 'c', label: 'Gamma', count: 1 },
]

/** A host that owns the selection, the way the real callers do. */
const Harness = () => {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())

  const handleToggle = (id: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  return (
    <MultiSelectFilter
      name="Dimensión"
      legend="Filtrar por dimensión"
      options={OPTIONS}
      selected={selected}
      onToggle={handleToggle}
      onClear={() => setSelected(new Set())}
      allLabel="Todas"
      manyNoun="dimensiones"
      clearLabel="Mostrar todas"
    />
  )
}

const trigger = () => screen.getByRole('button', { name: /^Dimensión/ })
const box = (label: string) =>
  screen.getByRole('checkbox', { name: new RegExp('^' + label) })

describe('MultiSelectFilter', () => {
  it('keeps its options out of the accessibility tree until opened', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()

    await user.click(trigger())

    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('checkbox')).toHaveLength(OPTIONS.length)
  })

  it('summarises the selection on the trigger', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(trigger()).toHaveTextContent('Todas')

    await user.click(trigger())
    await user.click(box('Alfa'))
    expect(trigger()).toHaveTextContent('Alfa')

    await user.click(box('Beta'))
    expect(trigger()).toHaveTextContent('2 dimensiones')
  })

  it('announces each count with its unit', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(trigger())

    // Built from separate spans the name comes out "Alfa3movimientos", which
    // is what a screen reader would say out loud.
    expect(box('Alfa')).toHaveAccessibleName('Alfa, 3 movimientos')
  })

  it('stays open while several options are picked', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(trigger())
    await user.click(box('Alfa'))
    // Closing after the first pick would defeat a multi-select filter.
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    await user.click(box('Gamma'))
    expect(trigger()).toHaveTextContent('2 dimensiones')
  })

  it('closes on Escape and hands focus back to the trigger', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(trigger())
    await user.keyboard('{Escape}')

    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    // Without this the keyboard user is stranded on an element that no longer
    // exists.
    expect(trigger()).toHaveFocus()
  })

  it('closes on an outside pointer without discarding the selection', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Harness />
        <button type="button">fuera</button>
      </>,
    )

    await user.click(trigger())
    await user.click(box('Beta'))
    await user.click(screen.getByRole('button', { name: 'fuera' }))

    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    // Dismissing the panel is not the same as discarding the filter.
    expect(trigger()).toHaveTextContent('Beta')
  })

  it('offers reset only when there is something to reset', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.click(trigger())
    expect(screen.getByRole('button', { name: 'Mostrar todas' })).toBeDisabled()

    await user.click(box('Alfa'))
    const clear = screen.getByRole('button', { name: 'Mostrar todas' })
    expect(clear).toBeEnabled()

    await user.click(clear)
    expect(trigger()).toHaveTextContent('Todas')
  })

  it('shows a swatch only for options that carry one', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(trigger())

    // Categories have a colour; accounts do not, and inventing one would imply
    // a categorical meaning a card does not have.
    const swatch = (label: string) =>
      box(label)
        .closest('label')
        ?.querySelector('span[aria-hidden][style*="background-color"]')
    expect(swatch('Alfa')).not.toBeNull()
    expect(swatch('Beta')).toBeNull()
  })
})
