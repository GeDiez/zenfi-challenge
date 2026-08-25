import { render, screen } from '@testing-library/react'
import { ExpenseCategoryCard } from '../ExpenseCategoryCard'

const renderCard = () =>
  render(
    <ExpenseCategoryCard
      label="Vivienda"
      amount="$48,500"
      share="61%"
      colorVar="--color-series-1"
      icon={<svg data-icon />}
    />,
  )

describe('ExpenseCategoryCard', () => {
  it('names the category as a heading, so the page has real structure', () => {
    renderCard()

    expect(
      screen.getByRole('heading', { name: 'Vivienda', level: 3 }),
    ).toBeInTheDocument()
  })

  it('shows the amount AND what it weighs against the total', () => {
    renderCard()

    // The amount alone does not say whether $48,500 is a lot.
    expect(screen.getByText('$48,500')).toBeInTheDocument()
    expect(screen.getByText(/61%/)).toBeInTheDocument()
  })

  it('renders the icon it is handed', () => {
    const { container } = renderCard()

    expect(container.querySelector('svg')).not.toBeNull()
  })
})
