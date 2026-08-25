---
name: component-anatomy
description: >
  Entry point for ALL component work in this repo. Owns the anatomy every component shares — the
  `src/ui/` (zero-business-logic primitives) vs `src/components/` (project reusables coupled to
  app concerns) boundary, file layout, naming, Tailwind-first styling against the theme tokens,
  and the arrow + `useController` separation of logic from JSX.
  Trigger: Any time you create, update, or modify a component — anywhere, including `src/ui/`,
  `src/components/` and view-local components.
license: Apache-2.0
metadata:
  author: yotepresto
  version: '3.1'
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

## Component anatomy

This skill holds the rules EVERY component obeys.

### Scope

It owns component placement, file layout, shape, and styling. It does NOT define how components are
tested, how their controllers are written internally, or how data is fetched — those are separate
concerns with their own conventions.

---

### 1. Where it lives: `ui/` vs `components/`

Decision test: _"Could I publish this on npm and use it in an unrelated project?"_

- **Yes → `src/ui/`** — primitive, ZERO business logic. Styled with Tailwind utilities and receives
  all data via props (labels as `labelText`/`placeholder`/`children`). NEVER app copy, app state, app
  config, or app hooks.
- **No** (it knows our copy, routes, or features) **→ `src/components/`** — composes `ui/`
  primitives with project logic.

If you reach for app copy or a query inside `src/ui/`, stop: move the component to
`src/components/`, or lift the business hook to the parent.

### 2. Layout & naming

- PascalCase folder; main file matches the folder (`AutoInvestWidget/AutoInvestWidget.tsx`);
  barrel `index.ts` re-exports it.
- Logic lives in a co-located `hooks/` (usually `useController.ts`); owned sub-components in a
  co-located `components/`; tests in `__tests__/`.
- New files MUST be `.ts`/`.tsx` — TS types, never PropTypes.
- Feature-scoped utilities inside feature folders use feature-prefixed dot-notation
  (`Expedients.context.tsx`), never bare `context.tsx`.
- PNG/JPG assets live under `src/assets/images`, never in a feature subfolder.

```
src/components/AutoInvestWidget/
├── AutoInvestWidget.tsx
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
  `useAuthorizationForm`). The component calls it once at the top and destructures. This skill does
  not define the controller's internal contract — its return shape, handler naming, and when to skip
  creating one are decided elsewhere.
- **React 19: `ref` is a plain prop.** Declare `ref?: React.Ref<HTMLElement>` in `Props`. Never
  `forwardRef`.
- **No inline pseudo-components.** Don't extract JSX into a local `const Foo = () => (...)` inside
  a component. Inline simple JSX; promote anything complex to its own component file.

```tsx
interface Props {
  isOpen: boolean
  onClose: () => void
}

export const PauseModal = ({ isOpen, onClose }: Props) => {
  const { control, submit, isSubmitting } = usePauseForm()

  return (/* elements only — no logic */)
}
```

### 4. Styling — Tailwind-first, against the theme tokens

The design system is CSS-first in `src/index.css`. There is no `tailwind.config.js`.

- **Style with utility classes in the JSX.** No CSS modules, no `styled-components`, no
  `*.styles.ts` object spread, no inline `style` for anything a utility can express.
- **Always use a role token, never a raw hue.** The theme names colors by the job they do, so a
  component never has to know which hex it lands on and never drifts between light and dark:

  | Role | Tokens |
  | --- | --- |
  | Surfaces | `page`, `surface`, `wash` |
  | Text | `ink`, `ink-secondary`, `ink-muted` |
  | Lines | `hairline`, `grid`, `baseline` |
  | Data series | `series-1` … `series-3`, and the `seq-*` ramp |
  | Status | `good`, `warning`, `serious`, `critical` |
  | Direction | `delta-up`, `delta-down` |

  So: `bg-surface`, `text-ink-muted`, `border-hairline`. Never `bg-[#fcfcfb]`, never `text-gray-500`.
- **No arbitrary values when a token exists.** `bg-[#2a78d6]` is always wrong — it is `bg-series-1`.
  Reach for an arbitrary value only for a one-off geometry Tailwind's scale genuinely lacks.
- **Components carry no `dark:` variants.** Dark mode restates token VALUES, not component classes,
  so a component written against roles is already correct in both modes. If you find yourself
  writing `dark:`, the color you need is missing a role — add the token instead.
- **Adding a token means editing `@theme static` in `src/index.css`**, and declaring its dark value
  in both dark scopes. The `static` keyword is load-bearing: a plain `@theme` silently drops any
  token Tailwind does not see used as a utility class, so tokens read through `var()` vanish from
  the build with no error.
- **Prettier owns formatting.** Never fight it with lint rules or hand-wrapping.

### 5. Icons vs images

- **Icons** = inline SVG components, drawn with `currentColor` so the CALLER sets the color via a
  text utility (`text-ink-muted`). Naming: `<Name>Icon.tsx` — one flat convention, no variant
  suffixes. Don't import a raw `assets/*.svg?react` into a component: wrap it as an icon component
  first and export it from the icons barrel, or the next person won't find it and will wrap the
  same asset again.
  - A hard-coded multi-color SVG is an **image**, not an icon — it can't respond to `currentColor`,
    which is the whole point. Decide by inspecting the SVG, never by the name.
- **Images** = multicolor illustrations under `src/assets/images`, rendered with a plain `<img>`
  carrying `max-w-full` so they never force a horizontal scroll. An `*.svg?url` used as an `<img
  src>` is an image, not an icon.

### 6. Text, numbers and dates

- **Never hardcode a user-facing string in a component.** Copy belongs in one place so it can be
  reviewed, reused, and eventually translated.
- **Never roll your own formatting.** No inline `toFixed`, `toLocaleString`, or ad-hoc `Intl`
  instances scattered through components. Currency, number, percentage and date formatting go
  through shared helpers so every screen agrees on how a value looks — and so an `Intl` formatter is
  constructed once rather than per render.
- Assert formatted output in tests through those same helpers, never against a hardcoded
  `'$1,234.50'`.

### 7. Code hygiene

- **The linter enforces correctness; Prettier enforces format.** Never add a formatting rule to
  ESLint, and never fix a format complaint by hand.
- **Never `eslint-disable`.** A suppression hides a real violation from every future reader and from
  any count of remaining work. If a rule is genuinely wrong for the codebase, change the rule in the
  config where the decision is visible — don't bury an exception at the call site.
- **No inline pseudo-components** — see §3.

Type-level bans (`any`, escape-hatch `as`, `@ts-ignore`) and comment judgment are not this skill's
concern; they belong to the TypeScript conventions.
