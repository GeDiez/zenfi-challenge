# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`zenfi-challenge` — an MVP web app. Vite 8 + React 19 + TypeScript 6 + Tailwind 4, tested with Vitest 4, linted with ESLint 9 + neostandard, formatted with Prettier.

## Commands

```bash
npm run dev              # dev server, http://localhost:3005
npm run build            # tsc -b && vite build
npm run preview          # serve dist/ on :3005
npm run typecheck        # tsc -b --noEmit

npm run lint             # eslint .
npm run lint:fix
npm run format           # prettier --write .
npm run format:check

npm test                 # vitest run (single pass)
npm run test:watch
npm run test:coverage    # v8 provider, text + html reporters
```

Run a single test file or a single test case:

```bash
npm test -- src/App.test.tsx
npx vitest run -t "persists the theme choice"
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

## Project skills

`.claude/skills/` holds three repo-scoped skills — `component-anatomy`, `testing`, `typescript` — adapted from another repo and rewritten against this stack. They are self-contained: none of them points at a skill that does not exist here. Two consequences when editing them:

- **Do not reintroduce cross-skill pointers.** Each skill states its own scope and what it does not own. A pointer to a skill this repo lacks is a dead end for whoever reads it next.
- **`testing/references/mocking.md` is deliberately unpopulated.** There is no HTTP or query client yet, so it describes what belongs there rather than inventing recipes for an API that does not exist.

They are excluded from Prettier in `.prettierignore`.

## Current state

`src/App.tsx` is a setup-verification page, not product content: it renders the stack and the theme swatches to prove both resolve. It is meant to be replaced wholesale once the app has a subject. `recharts` is installed and verified against React 19 but nothing imports it yet, so it is tree-shaken out of the bundle.
