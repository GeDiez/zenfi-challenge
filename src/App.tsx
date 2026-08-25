import { ThemeToggle } from './components/ThemeToggle'

/**
 * Setup verification page.
 *
 * Deliberately has no product content: it only proves the stack renders and
 * that the theme tokens resolve in both modes. It is meant to be replaced
 * wholesale once the app has a subject.
 */

const STACK = [
  { name: 'Vite', detail: 'dev server en el puerto 3005, strictPort' },
  {
    name: 'React + TypeScript',
    detail: 'project references, verbatimModuleSyntax',
  },
  {
    name: 'Tailwind',
    detail: 'plugin de Vite, tokens semánticos, sin config JS',
  },
  {
    name: 'ESLint + neostandard',
    detail: 'reglas Standard, ESLint fijado en 9',
  },
  { name: 'Prettier', detail: 'dueño único del formato' },
  { name: 'Vitest', detail: 'jsdom + Testing Library' },
]

const SERIES_TOKENS = ['series-1', 'series-2', 'series-3']
const STATUS_TOKENS = ['good', 'warning', 'serious', 'critical']

function Swatch({ token }: { token: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="inline-block h-6 w-6 rounded-md border border-hairline"
        style={{ backgroundColor: `var(--color-${token})` }}
      />
      <code className="text-xs text-ink-muted">{token}</code>
    </div>
  )
}

function App() {
  return (
    <div className="min-h-screen bg-page">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <span className="text-sm font-semibold tracking-tight text-ink">
            zenfi-challenge
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Setup listo
        </h1>
        <p className="mt-3 text-ink-secondary">
          Sin contenido de producto todavía. Esta página solo confirma que el
          stack levanta y que los tokens del tema resuelven en ambos modos.
        </p>

        <section className="mt-12">
          <h2 className="text-xs font-medium tracking-wide text-ink-muted uppercase">
            Stack
          </h2>
          <dl className="mt-4 divide-y divide-hairline border-y border-hairline">
            {STACK.map((item) => (
              <div
                key={item.name}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3"
              >
                <dt className="font-medium text-ink">{item.name}</dt>
                <dd className="text-sm text-ink-secondary">{item.detail}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12">
          <h2 className="text-xs font-medium tracking-wide text-ink-muted uppercase">
            Tokens del tema
          </h2>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-4">
            {SERIES_TOKENS.map((token) => (
              <Swatch key={token} token={token} />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-4">
            {STATUS_TOKENS.map((token) => (
              <Swatch key={token} token={token} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
