import { createPortal } from 'react-dom'
import {
  ACCOUNT_TOTALS,
  CATEGORY_TOTALS,
  DISCARDED,
  FEATURED_CATEGORIES,
  TRANSACTIONS,
} from '../../data'
import { useController } from './hooks/useController'

export const AboutModal = () => {
  const { isOpen, titleId, panelRef, triggerRef, handleOpen, handleClose } =
    useController()

  const points = [
    'Cuánto gastaste este mes, con lo que ingresó al lado.',
    `Las ${String(FEATURED_CATEGORIES.length)} categorías que más pesan, cada una con su porcentaje del total.`,
    'Tu cargo más repetido y el más fuerte del mes.',
    'El día que más gastaste y el que menos.',
    `Los ${String(TRANSACTIONS.length)} movimientos, filtrables por categoría (${String(CATEGORY_TOTALS.length)}) y por tarjeta (${String(ACCOUNT_TOTALS.length)}).`,
  ]

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        aria-haspopup="dialog"
        className="rounded-lg border border-hairline px-3 py-2 text-sm font-medium text-ink-secondary transition-colors hover:bg-wash hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        ¿Qué es esto?
      </button>

      {/*
        Portalled to <body> on purpose. The header carries `backdrop-blur`, and
        `backdrop-filter` establishes a containing block — a `position: fixed`
        overlay rendered inside it resolves against the HEADER instead of the
        viewport, which collapsed this dialog into a strip across the top.
      */}
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
            // Clicking the backdrop dismisses; the check keeps a click that
            // started inside the panel from closing it.
            onClick={(event) => {
              if (event.target === event.currentTarget) handleClose()
            }}
          >
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-hairline bg-surface p-6 shadow-2xl"
            >
              <h2
                id={titleId}
                className="text-xl font-semibold tracking-tight text-ink"
              >
                ¿Qué es esto?
              </h2>

              <p className="mt-2 text-sm text-ink-secondary">
                El desglose de un mes de tus gastos, armado desde un export
                bancario real.
              </p>

              <ul className="mt-5 flex flex-col gap-3">
                {points.map((point) => (
                  <li key={point} className="flex gap-3 text-sm text-ink">
                    <span
                      aria-hidden="true"
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                    />
                    {point}
                  </li>
                ))}
              </ul>

              <p className="mt-5 border-t border-hairline pt-4 text-xs text-ink-muted">
                Los datos se limpian antes de mostrarse: {DISCARDED.length}{' '}
                movimientos quedaron fuera por estar fuera del periodo, sin
                liquidar, duplicados o en otra moneda. Ningún total esconde
                filas.
              </p>

              <button
                type="button"
                onClick={handleClose}
                className="mt-6 w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-on-brand transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto"
              >
                Entendido
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
