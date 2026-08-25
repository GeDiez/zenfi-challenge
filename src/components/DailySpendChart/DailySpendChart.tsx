import {
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PERIOD, type Transaction } from '../../data'
import { currency, currencyCompact, monthName } from '../../lib/format'
import { useController } from './hooks/useController'

type TooltipRow = { value?: number | string | ReadonlyArray<number | string> }

type ChartTooltipProps = {
  active?: boolean
  label?: string | number
  payload?: ReadonlyArray<TooltipRow>
}

/**
 * One series, so the readout is just the day and its amount. The value leads:
 * the reader already knows what is plotted and wants the number.
 */
const ChartTooltip = ({ active, label, payload }: ChartTooltipProps) => {
  if (active !== true || payload === undefined || payload.length === 0) {
    return null
  }
  const value = payload[0].value
  if (typeof value !== 'number') return null

  return (
    <div className="rounded-lg border border-hairline bg-surface px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-ink-muted">
        {String(label)} de {monthName(PERIOD)}
      </p>
      <p className="num-align mt-0.5 text-sm font-semibold text-ink">
        {currency(value)}
      </p>
    </div>
  )
}

/**
 * Daily spending, stripped to the line itself.
 *
 * There is no y-axis and no gridline. Direct labels come before gridlines,
 * which come before a second axis — and here the two labelled extremes plus the
 * hover readout carry every value the plot needs to convey. Chrome that repeats
 * what a label already says is ink competing with the data.
 *
 * There is no table view either, and that does not gate anything: both extremes
 * are stated in words above, and every individual charge is listed in the
 * transactions table below. A tooltip is never the only way to reach a value.
 */
type Props = {
  /** Already filtered upstream — this component never filters. */
  transactions: Transaction[]
  /**
   * Hue for the line. The panel passes a category's own colour only when
   * exactly ONE is selected; a mixed series takes the default, because painting
   * a blend with one category's hue would attribute it to that category.
   */
  colorVar?: string
}

export const DailySpendChart = ({
  transactions,
  colorVar = '--color-series-1',
}: Props) => {
  const { daily, peak, lowest, driver, markers, hasData } =
    useController(transactions)

  return (
    <section
      id="por-dia"
      className="mx-auto max-w-6xl scroll-mt-24 px-6 pb-16"
      aria-labelledby="por-dia-title"
    >
      <h2
        id="por-dia-title"
        className="text-xl font-semibold tracking-tight text-ink"
      >
        Gasto por día
      </h2>

      {/* The extremes are stated in text, not left to be read off the plot: a
          chart that only works visually excludes anyone using a screen reader.
          `role="status"` announces the change when the filter reshapes it. */}
      <p className="mt-1 text-sm text-ink-secondary" role="status">
        {peak === null || lowest === null ? (
          'Sin movimientos en el periodo seleccionado.'
        ) : (
          <>
            El día {String(peak.day)} gastaste más,{' '}
            <span className="font-medium text-ink">
              {currency(peak.amount)}
            </span>
            ; el día {String(lowest.day)} menos,{' '}
            <span className="font-medium text-ink">
              {currency(lowest.amount)}
            </span>
            .
          </>
        )}
      </p>

      {/* The height includes the x-axis band, so its labels can never be
          cropped into a nested scrollbar. */}
      {!hasData ? (
        <p className="mt-6 rounded-xl border border-dashed border-hairline px-4 py-10 text-center text-sm text-ink-muted">
          Ningún movimiento coincide con el filtro.
        </p>
      ) : (
        <div className="mt-6 h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={daily}
              margin={{ top: 26, right: 32, bottom: 0, left: 8 }}
            >
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--color-ink-muted)', fontSize: 11 }}
                dy={2}
                interval="preserveStartEnd"
                minTickGap={20}
              />
              {/* Hidden, but still declared: it owns the scale the line is drawn
                against. Removing it would let Recharts pick its own domain. */}
              <YAxis hide domain={[0, 'dataMax']} />
              <Tooltip
                // The crosshair finds the X, so the reader aims at a day rather
                // than at a 2px line.
                cursor={{ stroke: 'var(--color-baseline)', strokeWidth: 1 }}
                content={(props) => <ChartTooltip {...props} />}
              />
              <Line
                name="Gasto"
                dataKey="amount"
                type="monotone"
                stroke={`var(${colorVar})`}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                // A dot on every point is noise; only the two that carry the
                // story are marked.
                dot={false}
                activeDot={{
                  r: 4,
                  fill: `var(${colorVar})`,
                  // The surface ring keeps the marker legible where it crosses
                  // the line, and is part of its hit target.
                  stroke: 'var(--color-surface)',
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />

              {markers.map((marker) => (
                <ReferenceDot
                  key={marker.key}
                  x={marker.point.day}
                  y={marker.point.amount}
                  r={4}
                  fill={`var(${colorVar})`}
                  stroke="var(--color-page)"
                  strokeWidth={2}
                  label={{
                    value: `${marker.text} · ${currencyCompact(marker.point.amount)}`,
                    position: marker.position,
                    offset: 10,
                    // Labels wear text tokens, never the series colour: a
                    // categorical hue is illegible as text on the surface.
                    fill: 'var(--color-ink-secondary)',
                    fontSize: 11,
                  }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {peak !== null && driver !== null && (
        <p className="mt-3 text-xs text-ink-muted">
          {/* The spike is explained rather than merely pointed at: without this
              the shape reads as a data error. */}
          El pico del día {String(peak.day)} lo explica un solo cargo,{' '}
          {driver.description} por {currency(driver.amount)}. El eje no está
          cortado — esa es la proporción real del mes.
        </p>
      )}
    </section>
  )
}
