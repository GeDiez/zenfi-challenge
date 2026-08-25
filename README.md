# zenfi-challenge

Web MVP scaffold: Vite + React + TypeScript + Tailwind, tested with Vitest and
linted with ESLint under the Standard ruleset.

The app currently has no product content. `src/App.tsx` is a setup-verification
page that renders the stack and the theme tokens to prove both resolve, and is
meant to be replaced once the app has a subject.

## Requirements

Node 22 or newer.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3005
```

The dev server is pinned to port 3005 with `strictPort`, so it fails loudly if
the port is taken rather than silently moving to another one.

## Scripts

| Script                  | What it does                                            |
| ----------------------- | ------------------------------------------------------- |
| `npm run dev`           | Dev server on port 3005                                 |
| `npm run build`         | Typecheck the project references, then build to `dist/` |
| `npm run preview`       | Serve the production build on port 3005                 |
| `npm run typecheck`     | `tsc -b --noEmit`                                       |
| `npm run lint`          | ESLint over the repo                                    |
| `npm run lint:fix`      | ESLint with `--fix`                                     |
| `npm run format`        | Prettier over the repo                                  |
| `npm run format:check`  | Prettier in check mode                                  |
| `npm test`              | Vitest, single pass                                     |
| `npm run test:watch`    | Vitest in watch mode                                    |
| `npm run test:coverage` | Vitest with v8 coverage                                 |

Run a single test file or a single case:

```bash
npm test -- src/App.test.tsx
npx vitest run -t "persists the theme choice"
```

## Conventions

**Prettier owns formatting; ESLint owns correctness.** neostandard runs with
`noStyle`, and `eslint-config-prettier` is applied last, so no stylistic rule
survives in ESLint. Fix formatting with Prettier, never by adding lint rules.

**ESLint is pinned to 9.** `neostandard` declares `eslint: ^9.0.0` as a peer
dependency. Do not upgrade to ESLint 10 or install with `--legacy-peer-deps`;
wait until neostandard widens the range.

**The theme is CSS-first.** There is no `tailwind.config.js`. Tokens live in
`@theme` inside `src/index.css` and are named by role (`surface`, `ink`,
`hairline`, `series-1`) rather than by hue, so dark mode only restates values.
Dark mode is selected via a `data-theme` attribute on `<html>` and falls back to
the OS preference when unset.

See `CLAUDE.md` for the details behind these choices.
