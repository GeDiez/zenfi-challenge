# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`zenfi-challenge` — an MVP web app. Vite 8 + React 19 + TypeScript 6 + Tailwind 4, tested with Vitest 4, linted with ESLint 9 + neostandard, formatted with Prettier.

## Commands

**This project uses pnpm. Never run `npm` here** — it would write a `package-lock.json` beside the
committed `pnpm-lock.yaml` and give CI and the working tree two different dependency graphs.

```bash
pnpm dev                 # dev server, http://localhost:3005
pnpm build               # tsc -b && vite build
pnpm preview             # serve dist/ on :3005
pnpm typecheck           # tsc -b --noEmit

pnpm lint                # eslint .
pnpm lint:fix
pnpm format              # prettier --write .
pnpm format:check

pnpm test                # vitest run (single pass)
pnpm test:watch
pnpm test:coverage       # v8 provider, text + html reporters
```

Run a single test file or a single test case:

```bash
pnpm test src/App.test.tsx
pnpm vitest run -t "persists the theme choice"
```

## Architecture and configuration

The interesting part of this repo is not the source tree — it is how the four tools are wired to not fight each other. Read `vite.config.ts` and `eslint.config.js` together before changing any of it.

### Single Vite config owns dev server, build, and tests

`vite.config.ts` imports `defineConfig` from `vitest/config` (not `vite`), so the Vitest `test` block lives in the same file as the build config. Consequences:

- There is no `vitest.config.ts`. Add test config to `vite.config.ts`.
- `test.globals: true` is on, which is why `tsconfig.app.json` lists `"vitest/globals"` in `compilerOptions.types`. Removing one without the other breaks typechecking of test files.
- `src/test/setup.ts` runs before every suite: it registers `@testing-library/jest-dom/vitest` matchers and calls Testing Library `cleanup()` in `afterEach`. Tests do not need to clean up the DOM themselves.

### Port 3005 is enforced, not preferred

Both `server` and `preview` set `port: 3005` with `strictPort: true`. If 3005 is taken, Vite fails loudly instead of silently moving to the next free port. Do not relax `strictPort` — a silently reassigned port breaks anything pointing at 3005.

### ESLint is pinned to 9 by a peer dependency, deliberately

`neostandard@0.13.0` declares `peerDependencies: { eslint: "^9.0.0" }`, while the published `latest` of ESLint is 10.x. ESLint is therefore pinned to `9.39.5` (the `maintenance` dist-tag). **Do not upgrade ESLint to 10 and do not paper over the conflict with `--legacy-peer-deps`.** Upgrade only once neostandard widens that range.

### `eslint.config.js` carries two required overrides

1. **React version.** neostandard hardcodes `settings.react.version = '17'` (see `node_modules/neostandard/lib/configs/jsx.js`). The config overrides it to `'19'`; without that, `react/no-deprecated` evaluates against the wrong React API. Keep this in sync if React is upgraded.
2. **React Hooks rules.** neostandard does not bundle them. `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh` are registered manually in the same config block.

### Formatting boundary: Prettier owns it, ESLint does not

neostandard is invoked as `neostandard({ ts: true, noStyle: true })` and `eslint-config-prettier` is applied last. Together these leave every stylistic rule off (`quotes`, `@stylistic/quotes`, etc. resolve to `off`). Never re-enable formatting rules in ESLint — fix formatting through Prettier instead.

Note that Standard's `eqeqeq` is `['error', 'always', { null: 'ignore' }]`, so `x == null` is intentionally allowed; and `no-undef` is off for TS files because `tsc` already covers it.

Ignore patterns come from `.gitignore` via `resolveIgnoresFromGitignore()`, plus `coverage/**`. Adding a build output to `.gitignore` also removes it from linting.

### Tailwind 4 has no config file — the theme lives in CSS

Tailwind runs through the `@tailwindcss/vite` plugin. There is no `tailwind.config.js` and no PostCSS pipeline. The whole design system is CSS-first in `src/index.css`: `@theme` declares the tokens, and utilities like `bg-surface` or `text-ink-muted` fall out of them. Add tokens there, never by creating a JS config.

**The block is `@theme static`, and it must stay that way.** A plain `@theme` only emits the CSS variables Tailwind sees used as utility classes, and silently drops the rest — a token read through `var(--color-x)` from CSS or an inline style resolves to nothing, with no error anywhere. That is how `--color-serious` and the whole `seq-*` ramp went missing from a green build. `static` forces every token out; it cost 366 bytes of CSS here.

### Colors are addressed by role, and dark mode is selected

Every color token names the job it does (`page`, `surface`, `ink`, `ink-muted`, `hairline`, `series-1..3`, status) rather than a hue. Dark mode then only has to restate values, so components carry no `dark:` variants and cannot drift between modes.

Two rules hold this together:

- **`data-theme` on `<html>` wins in both directions.** Dark values are declared twice — under `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme='light'])` for the OS preference, and under `:root[data-theme='dark']` for the explicit toggle. Removing the attribute returns control to the OS. `ThemeToggle` is the only writer of that attribute.
- **Tailwind's built-in `dark:` variant is replaced.** The stock variant reads `prefers-color-scheme` only, so it would ignore the toggle. `@custom-variant dark` in `src/index.css` covers both scopes. Never reintroduce the default.

Series and status tokens come from a palette validated for colorblind separation and surface contrast. Two consequences worth knowing before reusing them: status colors are never themed and never stand in for a series, and `series-3` sits below 3:1 on the light surface by design — anything encoded with it needs a visible label or a table equivalent, not colour alone.

### TypeScript project references

`tsconfig.json` is a solution file with no `files`; it references `tsconfig.app.json` (covers `src`, DOM libs, `jsx: react-jsx`) and `tsconfig.node.json` (covers `vite.config.ts`, Node types). Compiler options must go in the right leaf config — editing the root does nothing. Both enable `strict`, `verbatimModuleSyntax` and `erasableSyntaxOnly`, so type-only imports need the `type` keyword and TS-only runtime syntax (enums, parameter properties) is rejected. `strict` was not in the Vite template and was turned on afterwards; do not let it drift back off.

## CI

`.github/workflows/ci.yml` runs two jobs on push to `main` and on pull requests: **Lint** (ESLint → Prettier → `tsc`) and **Test** (Vitest). Three things about it are deliberate:

- **Neither tool version is written in the workflow.** Node comes from `.nvmrc`, pnpm from `packageManager` in `package.json`. One file per version means CI and a local shell cannot silently diverge; `engines.node` declares the matching floor.
- **`pnpm/action-setup` runs BEFORE `actions/setup-node`.** `cache: pnpm` resolves the store path by invoking pnpm, so pnpm has to already be on PATH. Reversing the two breaks the cache step.
- **The Prettier and TypeScript steps carry `if: ${{ !cancelled() }}`.** They run even when ESLint failed, so a single run reports every problem. `!cancelled()` rather than `always()` — a cancelled run should stop, not keep burning minutes.
- **The Test job runs `pnpm test:coverage`, not `pnpm test`.** The coverage thresholds in `vite.config.ts` (statements 90, branches 75, functions 88, lines 90) are floors CI enforces — the README's coverage badge reports that floor rather than a snapshot, precisely so it cannot go stale and start lying. Raise a floor when the real figure moves up; never lower one to turn a red build green. Verified by setting an impossible floor and watching the build fail.
- **`pnpm install --frozen-lockfile`.** CI installs exactly the committed lockfile and fails rather than silently updating it. That lockfile must keep its `linux-x64` entries for `@rolldown/binding`, `lightningcss` and `@tailwindcss/oxide`; regenerating it in a way that drops other platforms' optional binaries breaks CI while working locally.

Two more jobs handle the site:

- **Build** runs `pnpm build` on every event, pull requests included, with `VITE_BASE_PATH` set from the repository name. Building PRs the same way CI deploys them is the point: a base-path mistake fails in review rather than on the live site.
- **Deploy** publishes `dist/` to GitHub Pages, gated on `needs: [lint, test, build]` and on being a push to `main`. It carries job-scoped `pages: write` + `id-token: write`, which **replace** the workflow-level `contents: read` rather than adding to it. Its concurrency group is `pages` with `cancel-in-progress: false` — cancelling a deploy midway can leave the site half-published, so this one queues instead.

### GitHub Pages serves from a subpath

The site lives at `https://gediez.github.io/zenfi-challenge/`, not at a domain root, so an asset URL emitted as `/assets/…` is a 404. `vite.config.ts` sets `base` from `VITE_BASE_PATH`, defaulting to `/` so local dev and preview are unaffected. Keep the repository name out of that file — CI supplies it.

Reproduce a Pages build locally with `VITE_BASE_PATH=/zenfi-challenge/ pnpm build`.

**Pages has no SPA fallback.** The moment a client-side router lands, a deep link returns a real 404 unless `dist/404.html` is a copy of `index.html`. Nothing does this today because there is no router.

## Project skills

`.claude/skills/` holds three repo-scoped skills — `component-anatomy`, `testing`, `typescript` — adapted from another repo and rewritten against this stack. They are self-contained: none of them points at a skill that does not exist here. Two consequences when editing them:

- **Do not reintroduce cross-skill pointers.** Each skill states its own scope and what it does not own. A pointer to a skill this repo lacks is a dead end for whoever reads it next.
- **`testing/references/mocking.md` is deliberately unpopulated.** There is no HTTP or query client yet, so it describes what belongs there rather than inventing recipes for an API that does not exist.

They are excluded from Prettier in `.prettierignore`.

## Current state

The app is a personal-expenses landing: a header, a hero with the month's total and four category cards, a month-stats row, a daily-spend line chart, and a transactions table. One filter row (category + card, composing with AND) sits above the chart and scopes everything below it; the hero and the stats sit above it and report the month. `recharts` is installed and verified against React 19 but nothing imports it yet, so it is tree-shaken out of the bundle.

### Transactions are the only data input

`src/data/expenses.ts` exports `TRANSACTIONS`, and **every other figure is derived from it** — the category totals, the monthly total, each card's share. Replacing that module with a real source is the whole migration. Never hand-maintain a second list of totals beside it: two lists agree the day they are written and drift the first time either is touched.

### One mapping from a category to how it looks

`src/lib/categoryPresentation.tsx` is the single place that binds a category to its colour slot and icon. A second copy in a component would leave the same category two different colours on the same page. The slot each category gets is FIXED — assigning colour by current rank repaints everything whenever one category overtakes another, and a reader who learned "comidas is yellow" is then misled.

### Every component has a `useController`, and its JSX has none

Logic lives in a co-located `hooks/useController.ts`; the component calls it once and destructures. The JSX reads as a list of elements consuming already-computed values — no `reduce`, no `filter` chains, no conditional assembly inline. `src/lib/` follows the same one-folder-per-utility shape with a barrel.

**Everything under `src/components/` and `src/lib/` carries its own `__tests__/`.** They are behaviour tests: they assert what a user or a screen reader gets, never `className` or tag names.

### A fixed overlay must escape the header

The header carries `backdrop-blur`, and `backdrop-filter` establishes a containing block: a `position: fixed` overlay rendered inside it resolves against the HEADER, not the viewport. That collapsed the about dialog into a strip across the top. `AboutModal` portals to `document.body` for exactly this reason, and a test asserts the overlay's parent is `body`.

The dialog is hand-rolled rather than a native `<dialog>` because jsdom does not implement `showModal()` — a native one could only be tested through a mock, which exercises the mock. Owning it means owning Escape, focus-into-panel, a Tab trap that wraps at both ends, focus restore to the trigger, and the body scroll lock. All five have tests.

### Accessible names are computed by TRIMMING and concatenating nodes

Text split across sibling elements comes out glued: a label span plus a count span produced `"Alfa3movimientos"`, and no amount of whitespace between them fixes it — the algorithm trims each node. Where a control's name spans several visual pieces, put the readable phrase in ONE `sr-only` text node and mark the visual pieces `aria-hidden`. There is a test pinning this.

### Colour never carries meaning alone, and every pairing was measured

Three fixed results drive the code, and each has a comment where it applies:

- **`--color-good` fails as text** (3.18:1 on the light page). Success/failure _text_ uses `--color-delta-up` / `--color-delta-down`; the status tokens are fills.
- **No single text colour clears 4.5:1 across the categorical hues** — white fails on three, ink on two. Category and CTA cards are a 12% tint with ink copy, never a saturated slab. Icons on a saturated chip use `--color-on-accent` (ink), measured at ≥3.98:1 everywhere.
- **`--color-brand` is the Zenfi purple and is NOT a categorical slot** — it identifies the product, never a data series. Its dark value is the same hue lifted (`#8b53f5`), because `#5b0be1` measures 2.39:1 against the dark page and is effectively invisible there. White on the brand fill clears 8.14:1 light and 4.51:1 dark.

Sign, arrow and wording always carry direction too, so a negative balance reads as negative without colour.

### Components live one per folder

`src/components/<Name>/<Name>.tsx` with an `index.ts` barrel, and tests in a co-located `__tests__/`. Import from the folder (`./components/Header`), never the inner file. Moving a component **requires restarting the dev server** — Vite keeps the old module graph and serves a blank page while `tsc` and `build` stay green, which reads like a code bug and is not one.

### The Zenfi logo is vendored, with one deliberate edit

`ZenfiLogo.tsx` inlines the official asset. Its wordmark shipped as `fill="white"` — the file is the `-light` variant for dark backgrounds — so those paths now use `currentColor` and one file serves both themes. The isotype keeps its exact brand hex values. The raw `.svg` is intentionally not kept in `src/assets`: an unused copy invites an import that silently restores the invisible-on-light wordmark.
