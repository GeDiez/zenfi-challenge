# zenfi-challenge

[![CI](https://github.com/GeDiez/zenfi-challenge/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/GeDiez/zenfi-challenge/actions/workflows/ci.yml)
[![coverage](https://img.shields.io/badge/coverage-%E2%89%A590%25-2a78d6)](#tests-and-coverage)
[![tests](https://img.shields.io/badge/tests-106-2a78d6)](#tests-and-coverage)

A personal-expenses landing built from a real bank export. It reads a month of
transactions, cleans them, and reports where the money went — the total, the
four heaviest categories, the day you spent most and least, and every charge
behind those numbers.

**Live:** https://gediez.github.io/zenfi-challenge/

## Quick path

```bash
pnpm install
pnpm dev                 # http://localhost:3005
```

Verify the whole thing the way CI does:

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test:coverage && pnpm build
```

The dev server is pinned to port 3005 with `strictPort`, so it fails loudly if
the port is taken rather than silently moving to another one.

> **This project uses pnpm.** Running `npm install` writes a `package-lock.json`
> beside the committed `pnpm-lock.yaml` and gives CI and your working tree two
> different dependency graphs. `.gitignore` refuses that file for exactly that
> reason.

## Scripts

| Script                              | What it does                                            |
| ----------------------------------- | ------------------------------------------------------- |
| `pnpm dev`                          | Dev server on port 3005                                 |
| `pnpm build`                        | Typecheck the project references, then build to `dist/` |
| `pnpm preview`                      | Serve the production build on port 3005                 |
| `pnpm typecheck`                    | `tsc -b --noEmit`                                       |
| `pnpm lint` / `pnpm lint:fix`       | ESLint over the repo                                    |
| `pnpm format` / `pnpm format:check` | Prettier over the repo                                  |
| `pnpm test`                         | Vitest, single pass                                     |
| `pnpm test:watch`                   | Vitest in watch mode                                    |
| `pnpm test:coverage`                | Vitest with v8 coverage **and the enforced thresholds** |

Run one file or one case:

```bash
pnpm test src/App.test.tsx
pnpm vitest run -t "persists the choice"
pnpm vitest run --sequence.shuffle    # prove the suite is order-independent
```

## Tests and coverage

106 tests across 16 files. Every folder under `src/components/` and `src/lib/`
carries its own `__tests__/`, plus the data pipeline.

| Metric     | Actual | Enforced floor |
| ---------- | ------ | -------------- |
| Statements | 91.95% | 90%            |
| Branches   | 77.31% | 75%            |
| Functions  | 90.24% | 88%            |
| Lines      | 93.13% | 90%            |

The floors live in `vite.config.ts` and **CI runs `pnpm test:coverage`**, so a
drop fails the build. That is deliberate: a coverage badge nobody enforces
starts lying the first time coverage slips, which is why the badge above
reports the enforced floor rather than a snapshot.

They are floors, not targets. Raise them when the real figure moves up; never
lower one to turn a red build green.

**Where coverage is thin, and why** — these gaps are known, not accidental:

| Area                     | Reason                                                                                                                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DailySpendChart.tsx`    | Recharts sizes itself from its container and jsdom reports every element as 0×0, so the SVG never renders in tests. Its controller is covered; the plot is verified in a real browser. |
| `icons/`                 | Static SVG components. Only the ones a test renders are executed.                                                                                                                      |
| `MonthStats` controller  | The positive-balance branch never runs: this month's balance is negative.                                                                                                              |
| `ThemeToggle` controller | jsdom does not implement `matchMedia`, so the system-preference path is skipped.                                                                                                       |

Tests are behaviour tests. They assert what a person or a screen reader gets —
never `className`, tag names, or inline styles.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every pull request.

| Job        | Steps                                                          |
| ---------- | -------------------------------------------------------------- |
| **Lint**   | ESLint → Prettier `--check` → `tsc`                            |
| **Test**   | Vitest with coverage thresholds                                |
| **Build**  | `pnpm build` with the Pages base path — pull requests included |
| **Deploy** | Publishes `dist/` to GitHub Pages                              |

Four things about it are deliberate:

- **Deploy needs all three.** `needs: [lint, test, build]` plus a push-to-main
  guard, so nothing reaches the live site until every check is green.
- **The Lint job reports every failure in one run.** Prettier and `tsc` carry
  `if: ${{ !cancelled() }}`, so they still execute when ESLint fails. There is
  no `continue-on-error` anywhere — a failing step fails its job.
- **Neither tool version is written in the workflow.** Node comes from `.nvmrc`,
  pnpm from `packageManager` in `package.json`.
- **`pnpm/action-setup` runs before `actions/setup-node`.** `cache: pnpm`
  resolves the store path by invoking pnpm, so pnpm has to be on PATH first.

## Architecture

### Transactions are the only input

```
transactions.json  ──▶  formatTransactions.ts  ──▶  index.ts  ──▶  every view
   (raw export)          (cleaning + typing)       (derived totals)
```

Nothing imports the raw JSON, so the cleaning rules cannot be bypassed, and
**every figure on the page derives from the same cleaned list** — the hero, the
stats, the chart and the table cannot disagree.

The export carries eleven defects. Each rule exists because a specific record
breaks without it:

| Defect                                                                       | Rule                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Two amounts are strings, **and positive while being charges**                | Direction is decided by what a movement IS (category `Ingresos`, or a description starting `REEMBOLSO` / `SPEI RECIBIDO`), never by the sign. Trusting the sign would have dropped $4,026 from the month. |
| Income and card payments mixed in with spending                              | Classified as `income` / `transfer`, kept but excluded from the total. A card payment repeats purchases already listed individually.                                                                      |
| A foreign-currency row                                                       | Discarded — inventing an exchange rate is worse than omitting the row and saying so.                                                                                                                      |
| Rows outside the period, unsettled states, a zero amount, an exact duplicate | Discarded, and the page states how many.                                                                                                                                                                  |
| Timezone-bearing dates                                                       | The calendar day is taken as written. Parsing to an instant and re-formatting shifts the day west of UTC.                                                                                                 |
| Null and empty categories                                                    | Folded into one bucket, flagged in the table, and left on the neutral colour.                                                                                                                             |

`45` transactions survive, `7` are non-spending flows, `9` are discarded — and
all 61 source rows are accounted for. A total that quietly omits rows is worse
than one that is visibly incomplete.

### One folder per component, one per utility

```
src/components/<Name>/
├── <Name>.tsx          # JSX only — no derivations
├── hooks/useController.ts
├── __tests__/
└── index.ts            # barrel; import the folder, never the inner file
```

`src/lib/` follows the same shape. **All logic lives in the controller**; the
JSX reads as a list of elements consuming already-computed values.

### The filter row scopes what is below it

One row, two dimensions (category and card) composing with **AND**. The chart
and the table re-render against the same slice. The hero and the stats sit
_above_ the row and report the month, not the selection.

Option lists come from the whole month, not from the other filter's result —
cross-filtering them would make choices vanish from under the pointer.

## Design decisions that were measured

Every colour pairing in this project was computed, not chosen by eye. The
numbers are in the code where they apply.

| Decision                                     | Measurement                                                                                                                                                                   |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ten category hues, in a fixed slot **order** | The order is the safety mechanism: this sequence clears every adjacent CVD and normal-vision gate in both themes. Aqua beside teal drops the dark floor to ΔE 11.4 and fails. |
| Cards are a 12% tint, not a saturated block  | No single text colour clears 4.5:1 across the hues — white fails on three, ink on two.                                                                                        |
| Icons on a saturated chip use ink            | White drops to 2.17:1 on yellow, under the 3:1 a graphic needs. Ink clears 3.98:1 everywhere.                                                                                 |
| Success text uses `delta-up`, not `good`     | The `good` status fill measures 3.18:1 on the light page and fails as body text.                                                                                              |
| `--color-brand` has a lifted dark value      | `#5b0be1` measures 2.39:1 against the dark page — effectively invisible. `#8b53f5` measures 4.31:1 and still clears 4.51:1 with white on top.                                 |

Colour never carries meaning alone. Every swatch has a label, every flag has an
icon _and_ a word, and a negative balance shows its sign and says so in text.

## Deployment

Published to GitHub Pages by the `deploy` job, in **workflow mode** — Pages
watches no branch, so no build output is ever committed.

Pages serves a project site from `/<repo>/`, not the domain root, so the build
needs a matching `base`. `vite.config.ts` reads it from `VITE_BASE_PATH`, which
CI supplies from the repository name; local dev and preview stay at `/`.

```bash
VITE_BASE_PATH=/zenfi-challenge/ pnpm build   # reproduce a Pages build locally
```

## Known limits

| Limit                                        | Detail                                                                                                                                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bundle is 173 kB gzip                        | 107 kB of it is Recharts, which also pulls in Redux for its internal state. `d3-shape` alone would cost 1.9 kB; lazy-loading the chart is the no-rewrite alternative.                                         |
| Three hues give a faint line in light mode   | Supermercado 2.05, Compras 2.55, Entretenimiento 2.67 against a 3:1 floor — only when that category is filtered alone.                                                                                        |
| Two categorisations look wrong in the source | `txn_005` DIDI MOBILITY filed under _Salud_, `txn_009` FARMACIAS GUADALAJARA under _Entretenimiento_. Left untouched on purpose: recategorising merchants by heuristic is how dashboards become subtly wrong. |
| No SPA fallback                              | Pages has none. A future client-side router needs `dist/404.html` copied from `index.html`.                                                                                                                   |

## Conventions

**Prettier owns formatting; ESLint owns correctness.** neostandard runs with
`noStyle` and `eslint-config-prettier` is applied last, so no stylistic rule
survives in ESLint. Fix formatting with Prettier, never by adding a lint rule.

**ESLint is pinned to 9.** `neostandard` declares `eslint: ^9.0.0` as a peer
dependency. Do not upgrade to 10 or install with `--legacy-peer-deps`.

**The theme is CSS-first.** There is no `tailwind.config.js`. Tokens live in
`@theme static` inside `src/index.css`, named by role rather than hue. The
`static` keyword is load-bearing: a plain `@theme` silently drops any token
Tailwind does not see used as a utility class.

See `CLAUDE.md` for the reasoning behind each of these.
