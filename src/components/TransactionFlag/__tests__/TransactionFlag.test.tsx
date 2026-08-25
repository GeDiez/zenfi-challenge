import { render, screen } from '@testing-library/react'
import { TransactionFlag } from '../TransactionFlag'

describe('TransactionFlag', () => {
  it('states the flag in words, so colour is never the only cue', () => {
    render(<TransactionFlag flag="uncategorised" />)

    // The warning step sits below 3:1 on the light surface by design; the
    // label is the mitigation, not decoration.
    expect(screen.getByText('Sin categoría')).toBeInTheDocument()
  })

  it('pairs the label with an icon', () => {
    const { container } = render(<TransactionFlag flag="uncategorised" />)

    expect(container.querySelector('svg')).not.toBeNull()
  })
})
