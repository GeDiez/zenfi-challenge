# zenfi-challenge

Web MVP scaffold: Vite + React + TypeScript + Tailwind, tested with Vitest and
linted with ESLint under the Standard ruleset.

The app currently has no product content. `src/App.tsx` is a setup-verification
page that renders the stack and the theme tokens to prove both resolve, and is
meant to be replaced once the app has a subject.

## Requirements

Node 22.12 or newer, and **pnpm** — this project does not use npm. The exact Node version CI uses
is in `.nvmrc`; the pnpm version is pinned by `packageManager` in `package.json`, so
`corepack enable` is enough to get the right one.

## Getting started

```bash
pnpm install
pnpm dev           # http://localhost:3005
```

The dev server is pinned to port 3005 with `strictPort`, so it fails loudly if
the port is taken rather than silently moving to another one.

## Scripts

| Script               | What it does                                            |
| -------------------- | ------------------------------------------------------- |
| `pnpm dev`           | Dev server on port 3005                                 |
| `pnpm build`         | Typecheck the project references, then build to `dist/` |
| `pnpm preview`       | Serve the production build on port 3005                 |
| `pnpm typecheck`     | `tsc -b --noEmit`                                       |
| `pnpm lint`          | ESLint over the repo                                    |
| `pnpm lint:fix`      | ESLint with `--fix`                                     |
| `pnpm format`        | Prettier over the repo                                  |
| `pnpm format:check`  | Prettier in check mode                                  |
| `pnpm test`          | Vitest, single pass                                     |
| `pnpm test:watch`    | Vitest in watch mode                                    |
| `pnpm test:coverage` | Vitest with v8 coverage                                 |

Run a single test file or a single case:

```bash
pnpm test src/App.test.tsx
pnpm vitest run -t "persists the theme choice"
```

## CI

`.github/workflows/ci.yml` runs on every push to `main` and on every pull request, in two jobs:

- **Lint** — ESLint, then Prettier in check mode, then `tsc`. The last two run even when an earlier
  check fails, so one run reports every problem instead of one per push.
- **Test** — the Vitest suite, single pass.

Both install with `pnpm install --frozen-lockfile` against the committed lockfile, and take pnpm
from `packageManager` and Node from `.nvmrc`, so a green local run means the same versions ran in
CI. Reproduce a failure with `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, or `pnpm test`.

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
