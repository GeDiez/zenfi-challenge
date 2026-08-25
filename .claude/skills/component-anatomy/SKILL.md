---
name: component-anatomy
description: >
  Entry point for ALL component work in this repo. Owns the universal anatomy every component
  shares — the `src/ui/` (zero-business-logic primitives) vs `src/components/` (project reusables
  coupled to i18n/GraphQL/routing) boundary, file layout, naming, Chakra-first styling, and the
  arrow + `useController` separation. Routes to the specialized anatomies (`form-anatomy`,
  `view-anatomy`, `navigator-anatomy`, `modal-anatomy`) and to the cross-cutting skills
  (`testing`, `i18n`).
  Trigger: Any time you create, update, or modify a component — anywhere, including `src/ui/`,
  `src/components/`, view-local components, forms, views, navigators, and modals. Load this FIRST,
  then the specialized anatomy that matches what you're building.
license: Apache-2.0
metadata:
  author: yotepresto
  version: '3.0'
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

## Component anatomy

**Load this skill FIRST for any component work.** It holds the rules EVERY component obeys. The
specialized anatomies below add their own layer on top — they never restate what's here.

### Routing table — load the matching skill on top of this one

| What you're building / touching                    | Also load           |
| -------------------------------------------------- | ------------------- |
| A form, or any component containing form fields    | `form-anatomy`      |
| A feature page under `src/views/`                  | `view-anatomy`      |
| Routes, a router, or a per-area layout             | `navigator-anatomy` |
| A modal / dialog                                   | `modal-anatomy`     |
| Any test for any of the above                      | `testing`           |
| Any user-facing text, currency, date, or number    | `i18n`              |
| GraphQL reads/writes                               | `graphql`           |
| REST calls through Redux                           | `redux-query`       |
| A reusable hook, modal disclosure, or feature flag | `shared-hooks`      |
| The component's `useController` itself              | `controller-anatomy` |
| Per-context controller traits (navigator / view / component / modal) | `controller-anatomy` |
| Typing, or a JS→TS rename                          | `typescript`        |
| Legacy code (styled-components, UI outside `ui/`)  | `migrate-legacy-code` |
| Not sure whether a helper already exists            | `libraries`         |
| A loading, empty or error state                     | `async-state-anatomy` |

`testing` is the SINGLE source of truth for every test concern — the specialized anatomies point
there, they never document test setup themselves.

---

### 1. Where it lives: `ui/` vs `components/`

Decision test: _"Could I publish this on npm and use it in an unrelated project?"_

- **Yes → `src/ui/`** — primitive, ZERO business logic. Wraps Chakra, receives all data via
  props (labels as `labelText`/`placeholder`/`children`). NEVER `t()`/`tscope()`, Redux, GraphQL,
  `config/`, or `hooks/`.
- **No** (it knows our copy, routes, or features) **→ `src/components/`** — composes `ui/`
  primitives with project logic (`tscope()`, GraphQL, Redux, routing).

If you reach for `t()` or a query inside `src/ui/`, stop: move the component to `src/components/`,
or lift the business hook to the parent.

View-local vs shared placement is owned by `view-anatomy`.

### 2. Layout & naming

- PascalCase folder; main file matches the folder (`AutoInvestWidget/AutoInvestWidget.tsx`);
  barrel `index.{ts,js}` re-exports it.
- Logic lives in a co-located `hooks/` (usually `useController.ts`); owned sub-components in a
  co-located `components/`; tests in `__tests__/`.
- New files MUST be `.ts`/`.tsx` (TS types, no PropTypes in new code) — see
  `typescript`.
- Feature-scoped utilities inside view folders use feature-prefixed dot-notation
  (`Expedients.context.tsx`), never bare `context.tsx`.
- PNG/JPG assets live under `src/assets/images`, never in a feature subfolder.

```
src/components/AutoInvestWidget/
├── AutoInvestWidget.tsx
├── AutoInvestWidget.styles.ts
├── index.ts
├── components/      # owned sub-components
├── hooks/           # useController.ts, …
├── utils/
└── __tests__/
```

### 3. Shape: arrow + zero-logic JSX + `useController`

- Every component is an **arrow function**, typed with a local `interface Props`.
- **The JSX has zero logic.** No derivations, no `.filter()`/`.map()` chains built inline, no
  conditional assembly. It reads as a list of elements consuming already-computed values.
- **All logic lives in the co-located `hooks/useController.ts`** (or a purpose-named hook like
  `useAuthorizationForm`). The component calls it once at the top and destructures. The controller's
  own rules — return shape, `onX` naming, arguments, when NOT to create one — are owned by
  **`controller-anatomy`**.
- **React 19: `ref` is a plain prop.** Declare `ref?: React.Ref<HTMLElement>` in `Props`. Never
  `forwardRef`.
- **No inline pseudo-components.** Don't extract JSX into a local `const Foo = () => (...)` inside
  a component. Inline simple JSX; promote anything complex to its own component file.

```tsx
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PauseModal = ({ isOpen, onClose }: Props) => {
  const { control, submit, isSubmitting } = usePauseForm();

  return (/* elements only — no logic */);
};
```

### 4. Styling — Chakra-first (source of truth: `src/ui/`, Chakra v2)

- Import everything `from 'ui'` — never `@chakra-ui/react`, never a legacy `components/*`
  equivalent when `ui` has one. If it's in `ui`, use it.
- **Every static visual prop lives in a sibling `ComponentName.styles.ts`**
  (`export const styles = { key: { …chakra props… } } as const`), spread onto the element:
  `<Box {...styles.key}>`. That includes `fontSize`, `colorScheme`, `boxSize`, `variant`, `bg` —
  never inline in JSX. Keep only dynamic/behavioral props inline (`onClick`, `to`, `value`,
  conditional colors, `{...props}`).
  - The single `as const` on the whole object is enough — it already narrows every nested value.
    Do NOT add per-attribute `as const` (`flexDirection: 'column' as const`); it's redundant noise.
- **NO `sx`.** Express responsive/conditional styling as Chakra prop objects:
  `borderRadius={{ base: 'md', md: 'lg' }}`. For print-hiding use `className="no-print"`.
- **Bare theme tokens**: `gray.300`, `green.500`. The legacy `schema.` prefix (`schema.gray.300`)
  is dead — it silently doesn't resolve in the `ui` theme, so colors fall back wrong. Never
  write `schema.*`.
- **The theme scale is SHIFTED — do not assume Chakra's defaults.** The authoritative map is
  `themeConfig` in **`src/config/ui.js`**: `fontSizes` for type, `sizes` for spacing/`boxSize`.
  Read it when converting a value from a design; never guess the stock Chakra mapping and never
  write a literal px.

  ```
  // src/config/ui.js → themeConfig.fontSizes
  xs: 10.5px · sm: 12px · md: 14px · lg: 16px · xl: 18px · 2xl: 21px · 3xl: 24.5px · 4xl: 28px
  ```

  So a 16px design value is `fontSize="lg"` (Chakra's default `lg` is 18px) and body text is
  `md` = 14px. `themeConfig.sizes` is shifted the same way (`4` = 14px, not 16px), so spacing,
  `boxSize` and width/height tokens all need the same lookup. When no token matches exactly, take
  the nearest one — don't reach for a literal.
- **Plain CSS files** (rare, legacy): use `var(--chakra-*)` tokens for colors, sizes and weights —
  never literals.
- Do NOT add `styled-components`, CSS modules, pure CSS, or Tailwind to new code. If you touch a
  legacy `*.style.js` for another change, migrate it in the same PR → `migrate-legacy-code`.

### 5. Icons vs images

- **Icons** = inline SVG in `components/Icons`, drawn with `currentColor` so the CALLER sets the
  color. Naming: `<Name>Icon.tsx` — one flat convention, no variant suffixes. There is no
  `OutlineIcon` or `ColoredIcon` in this repo (`fd -g '*OutlineIcon*' src` and `'*ColoredIcon*'`
  both return 0 files); don't invent a suffix for a second visual variant, raise it instead.
  Don't import a raw `assets/*.svg?react` into a component — wrap it in `components/Icons` first
  **and export it from `components/Icons/index.js`**, or the next person won't find it and will
  wrap the same asset again.
  - Two things to know about the 58 icon components there: 39 are still `.jsx` (`typescript`
    requires the rename when you touch one), and `CircleCheckSubtle.tsx` is the lone file missing
    the `Icon` suffix — follow the convention, not that outlier.
  - A hard-coded multi-color SVG is an **image**, not an icon — it can't respond to
    `currentColor`, which is the whole point of this folder. Decide by inspecting the svg, never
    by the name.
- **Images** = multicolor illustrations under `src/assets/images`, rendered via `<Image>` from
  `ui`. An `*.svg?url` used as an `<img src>` is an image, not an icon.

### 6. Text, numbers and dates

All user-facing copy goes through `tscope()`; all currency/number/date formatting goes through the
`i18n` helpers (`toCurrency`/`toNumber`/`toPercentage`/`lmed`/`strftime`). Never hardcode a string,
never roll your own `Intl`/`toFixed`/`toLocaleString`. **`i18n` owns these rules** — load it.

### 7. Code hygiene

Much of what used to be documented here now lives in `eslint.config.js`. Two tiers, and the
difference matters:

- **Enforced today — it fails at the moment of violation**: direct `@chakra-ui/react` imports
  (outside `src/ui/`), `forwardRef` from react, `js-cookie` (outside `utils/cookies`), runtime
  imports from `vitest`, and `vi.mock('i18n')`. All `error`. `complexity` and `max-depth` are wired
  at `warn`, so they report but do not fail CI.
- **Ratcheted, NOT yet active — nothing stops you, so it is on you**: the `schema.*` prefix, `sx`,
  raw `Intl`/`toLocaleString`, `container.querySelector`, `styled-components`,
  `utils/numberFormatters`, `fireEvent`, `eslint-disable`. These are comment entries in that file's
  RATCHET block with today's violation count — a record of intent, not a gate. Don't add to a count.

Comment judgment and the type-level bans (`any`, `as`, `@ts-ignore`) live in **`typescript`**.

Component-specific: **no inline pseudo-components** — don't extract JSX into a local
`const Foo = () => (...)` inside a component. Inline simple JSX; promote anything complex to its own
component file (see §3).
