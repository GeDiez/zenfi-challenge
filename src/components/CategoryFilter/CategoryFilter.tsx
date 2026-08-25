import { useEffect, useId, useRef, useState } from 'react'
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type ExpenseCategoryId,
} from '../../data/expenses'
import { CATEGORY_PRESENTATION } from '../../lib/categoryPresentation'
import { ChevronDownIcon } from '../icons'

type Props = {
  /** Empty means no filter — every category is shown. */
  selected: ReadonlySet<ExpenseCategoryId>
  onToggle: (id: ExpenseCategoryId) => void
  onClear: () => void
}

function summarise(selected: ReadonlySet<ExpenseCategoryId>): string {
  if (selected.size === 0) return 'Todas las categorías'
  if (selected.size === 1) {
    const [only] = [...selected]
    return CATEGORY_LABELS[only]
  }
  return `${String(selected.size)} categorías`
}

/**
 * A disclosure button over a list of NATIVE checkboxes, not a hand-rolled
 * listbox.
 *
 * A `<select>` was ruled out by the swatch: an `<option>` cannot contain
 * markup, so the colour square has nowhere to live. The remaining choice was
 * between reimplementing listbox semantics — roving tabindex, typeahead,
 * aria-activedescendant, all of it easy to get subtly wrong — and using real
 * checkboxes, which arrive with keyboard support and screen-reader
 * announcements already correct. Checkboxes also model the truth here: this
 * filter is multi-select.
 */
export const CategoryFilter = ({ selected, onToggle, onClear }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!isOpen) return

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (containerRef.current?.contains(target) === true) return
      setIsOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setIsOpen(false)
      // Escape must return focus to the trigger, or the keyboard user is left
      // stranded on a element that no longer exists.
      buttonRef.current?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen])

  return (
    <div
      ref={containerRef}
      className="relative"
      // Tabbing out of the last checkbox should close the panel rather than
      // leave it hanging open behind the rest of the page.
      onBlur={(event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return
        setIsOpen(false)
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-haspopup="true"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex items-center gap-2 rounded-lg border border-hairline px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-wash hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-series-1"
      >
        <span className="text-xs font-normal text-ink-muted">Categoría</span>
        {summarise(selected)}
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          id={panelId}
          className="absolute right-0 z-20 mt-2 w-60 rounded-xl border border-hairline bg-surface p-1.5 shadow-lg"
        >
          <fieldset>
            <legend className="sr-only">Filtrar por categoría</legend>

            {CATEGORY_ORDER.map((id) => {
              const isSelected = selected.has(id)
              return (
                <label
                  key={id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-ink transition-colors hover:bg-wash has-focus-visible:bg-wash"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(id)}
                    className="h-4 w-4 shrink-0 accent-series-1"
                  />
                  <span
                    aria-hidden="true"
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-xs"
                    style={{
                      backgroundColor: `var(${CATEGORY_PRESENTATION[id].colorVar})`,
                    }}
                  />
                  {CATEGORY_LABELS[id]}
                </label>
              )
            })}
          </fieldset>

          <div className="mt-1.5 border-t border-hairline pt-1.5">
            <button
              type="button"
              onClick={onClear}
              disabled={selected.size === 0}
              className="w-full rounded-lg px-2.5 py-2 text-left text-sm text-ink-secondary transition-colors hover:bg-wash hover:text-ink disabled:cursor-default disabled:text-ink-muted disabled:hover:bg-transparent"
            >
              Mostrar todas
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
