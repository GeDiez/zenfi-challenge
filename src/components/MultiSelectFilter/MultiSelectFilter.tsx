import { ChevronDownIcon } from '../icons'
import { useController } from './hooks/useController'

export type FilterOption = {
  id: string
  label: string
  count: number
  /** Optional swatch token. Categories carry one; accounts do not. */
  colorVar?: string
}

type Props = {
  /** Small label on the trigger, before the summary. */
  name: string
  /** Accessible name for the option group. */
  legend: string
  options: FilterOption[]
  selected: ReadonlySet<string>
  onToggle: (id: string) => void
  onClear: () => void
  /** Trigger text when nothing is selected. */
  allLabel: string
  /** Plural noun for the "N <noun>" summary. */
  manyNoun: string
  /** Label for the reset action inside the panel. */
  clearLabel: string
}

/**
 * A disclosure button over NATIVE checkboxes, reused by every filter.
 *
 * One implementation on purpose: the parts that are easy to get wrong — Escape
 * returning focus to the trigger, dismissing on an outside pointer, closing
 * when focus leaves — would otherwise be written once per filter and fixed once
 * per filter too.
 *
 * A `<select>` is not an option here: an `<option>` cannot contain markup, so a
 * colour swatch has nowhere to live. Real checkboxes also model the truth —
 * these filters are multi-select — and arrive with keyboard and screen-reader
 * behaviour already correct.
 */
export const MultiSelectFilter = ({
  name,
  legend,
  options,
  selected,
  onToggle,
  onClear,
  allLabel,
  manyNoun,
  clearLabel,
}: Props) => {
  const {
    isOpen,
    summary,
    panelId,
    containerRef,
    buttonRef,
    handleTriggerClick,
    handleBlur,
  } = useController({ options, selected, allLabel, manyNoun })

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-haspopup="true"
        onClick={handleTriggerClick}
        className="inline-flex items-center gap-2 rounded-lg border border-hairline px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-wash hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-series-1"
      >
        <span className="text-xs font-normal text-ink-muted">{name}</span>
        {summary}
        <ChevronDownIcon
          className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          id={panelId}
          className="absolute right-0 z-20 mt-2 max-h-80 w-64 overflow-y-auto rounded-xl border border-hairline bg-surface p-1.5 shadow-lg"
        >
          <fieldset>
            <legend className="sr-only">{legend}</legend>

            {options.map((option) => (
              <label
                key={option.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-ink transition-colors hover:bg-wash has-focus-visible:bg-wash"
              >
                <input
                  type="checkbox"
                  checked={selected.has(option.id)}
                  onChange={() => onToggle(option.id)}
                  className="h-4 w-4 shrink-0 accent-series-1"
                />
                {option.colorVar !== undefined && (
                  <span
                    aria-hidden="true"
                    className="inline-block h-2.5 w-2.5 shrink-0 rounded-xs"
                    style={{ backgroundColor: `var(${option.colorVar})` }}
                  />
                )}
                {/*
                  The accessible name is computed by TRIMMING each node and
                  concatenating them, so separate spans come out glued together
                  as "Alfa3movimientos" — and no amount of whitespace between
                  them fixes it. The readable phrase therefore lives in a single
                  text node, and the visual pieces are hidden from assistive
                  technology so they are not announced twice.
                */}
                <span aria-hidden="true" className="flex-1 whitespace-nowrap">
                  {option.label}
                </span>
                <span
                  aria-hidden="true"
                  className="num-align text-xs text-ink-muted"
                >
                  {option.count}
                </span>
                <span className="sr-only">
                  {`${option.label}, ${String(option.count)} movimientos`}
                </span>
              </label>
            ))}
          </fieldset>

          <div className="mt-1.5 border-t border-hairline pt-1.5">
            <button
              type="button"
              onClick={onClear}
              disabled={selected.size === 0}
              className="w-full rounded-lg px-2.5 py-2 text-left text-sm text-ink-secondary transition-colors hover:bg-wash hover:text-ink disabled:cursor-default disabled:text-ink-muted disabled:hover:bg-transparent"
            >
              {clearLabel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
