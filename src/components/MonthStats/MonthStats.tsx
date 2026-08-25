import { useController } from './hooks/useController'

const ZENFI_URL = 'https://zenfi.mx'

const TONE_CLASS: Record<string, string> = {
  neutral: 'text-ink',
  // `delta-*` are the palette's TEXT steps. The `good`/`critical` status fills
  // measure under 4.5:1 on the light page and fail as body-size strings.
  positive: 'text-delta-up',
  negative: 'text-delta-down',
}

export const MonthStats = () => {
  const { tiles } = useController()

  return (
    <section
      className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-16"
      aria-label="Resumen del mes"
    >
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <li
            key={tile.id}
            className="flex flex-col rounded-2xl border border-hairline bg-surface p-5"
          >
            <p className="text-sm text-ink-secondary">{tile.label}</p>
            {/*
              Proportional figures: tabular-nums equalises digit widths and
              makes a standalone value look loose. These do not align in a
              column, so they do not need it.
            */}
            <p
              className={`mt-2 text-2xl font-semibold tracking-tight text-balance ${TONE_CLASS[tile.tone]}`}
            >
              {tile.value}
            </p>
            <p className="mt-2 text-xs text-ink-muted">{tile.detail}</p>
          </li>
        ))}

        {/*
          A tinted surface, not a saturated slab. White on `series-1` measures
          4.42:1 in light and 3.64:1 in dark — both under the 4.5:1 a body-size
          string needs — so the accent is spent on the button and the copy stays
          in ink.
        */}
        <li
          className="flex flex-col justify-between gap-4 rounded-2xl border p-5"
          style={{
            backgroundColor:
              'color-mix(in oklab, var(--color-series-1) 12%, var(--color-surface))',
            borderColor:
              'color-mix(in oklab, var(--color-series-1) 28%, transparent)',
          }}
        >
          <div>
            <p className="text-sm text-ink-secondary">
              ¿Quieres mejorar tus finanzas personales?
            </p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-balance text-ink">
              Descarga Zenfi
            </p>
          </div>

          <a
            href={ZENFI_URL}
            target="_blank"
            // `noopener` is the security half and is not optional on a
            // target="_blank" link: without it the opened page can reach back
            // through `window.opener`.
            rel="noopener noreferrer"
            aria-label="Descarga Zenfi (abre en una pestaña nueva)"
            className="inline-flex w-fit items-center rounded-lg bg-seq-600 px-4 py-2 text-sm font-medium text-on-cta transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-series-1"
          >
            Descargar
          </a>
        </li>
      </ul>
    </section>
  )
}
