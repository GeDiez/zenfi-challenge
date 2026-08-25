---
name: typescript
description: >
  THE single source of truth for TypeScript rules in ytp-investor-web: the MANDATORY migration policy
  (new files are always .ts/.tsx, rename JS/JSX on touch, scope the rename tightly, never merge a
  half-done migration), `tsconfig` highlights, the bare-base-name path aliases (`@gql` is the only
  `@`-prefixed one), inference-first typing (no hand-written hook return-type interfaces), React 19
  `ref`-as-prop, and the type-level bans: no `any`, no escape-hatch `as`, no `@ts-ignore`/
  `@ts-nocheck`, no PropTypes in new code. Deterministic conventions are enforced by
  `eslint.config.js`, not restated here.
  Trigger: When writing or editing ANY .ts/.tsx/.js/.jsx file, creating a new file (must be TS),
  renaming a JS file you're touching, typing a hook or component, reaching for `any`/`as`/a type
  suppression, or deciding whether a rename has grown into a refactor.
license: Apache-2.0
metadata:
  author: yotepresto
  version: "1.0"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

## TypeScript

This skill owns every TypeScript rule. `component-anatomy`, `form-anatomy`, `view-anatomy`,
`navigator-anatomy`, `modal-anatomy`, `graphql`, `testing`, `redux` and `migrate-legacy-code` point
here.

- GraphQL operations, codegen and Apollo wrappers → **`graphql`**
- Deterministic bans (imports, `schema.*`, `sx`, complexity, nesting) → **`eslint.config.js`**
- Evolving a shared utility without breaking its other callers → **`shared-hooks`**

---

## 1. The migration is MANDATORY

The codebase is migrating from JS/JSX to TS/TSX. **This is not optional and not "nice to have".**

- **New files**: ALWAYS `.ts` / `.tsx`. Never create a new `.js` / `.jsx`.
- **Touching an existing JS/JSX file**: rename `.js` → `.ts` and `.jsx` → `.tsx` as part of the same
  change. **The rename IS the rule** — doing the edit without the rename is wrong.
- **No PropTypes in new code.** When you rename a `.jsx` that has them, replace them with TS types.

### Scope the rename tightly

Rename **only the file you were already editing**. Do NOT chain renames into unrelated files just
because they're imported by the one you changed. A migration that sprawls from one file to ten loses
its reviewability and is very likely to break something unrelated. One PR = one logical change; the
rename rides along, it does not become the change.

### The only escape hatch

When a single-file rename would genuinely require a meaningfully larger refactor (cascading type
errors across many files, breaking circular dependencies, restructuring exported APIs). **This should
be rare** — if it keeps happening, the boundary between "rename" and "refactor" has slipped. When you
hit it:

1. Stop the rename; leave the file as `.js`/`.jsx`.
2. Note in the PR description why it was deferred (1–2 sentences) so the reviewer can validate it.
3. File a follow-up so the migration gets sized and reviewed on its own.

**Do NOT merge a half-done migration.** A partial rename — broken imports, types loosely papered over
with `any`, suppressions scattered around — is worse than not migrating at all. Either the file
becomes properly typed in this PR, or it stays JS and migrates in a dedicated one.

## 2. Hard bans

- **No `any`.** The existing **31** (13 files) are legacy debt; don't add to the pile. For a JS
  component you need to type at a call site, write a proper generic declaration — don't reach for
  `any`. Every one of the 31 only passes CI because an `eslint-disable` hides it — see below.
- **No `as` casts** to escape a type problem. Fix the type.
- **No `@ts-ignore` / `@ts-nocheck`.** ESLint enforces `@typescript-eslint/ban-ts-comment` as `error`.

Copying an existing bad pattern is not an excuse. If a type genuinely can't be expressed, stop and
surface it instead of suppressing it.

**Never `eslint-disable`** either. 120 directives across 86 files hide 137 real violations today —
91 `exhaustive-deps`, 31 `no-explicit-any`, 13 `no-unused-vars`, 2 `no-useless-escape`. Count them
with `npx eslint ./src --no-inline-config`, never by grepping for the comment: one file-level
disable hides many violations, so the directive count and the violation count are different numbers
for different jobs. That gap is exactly why the ban belongs in the linter's own config rather than
a doc. See the ratchet comment in `eslint.config.js`.

## 3. `tsconfig.json` highlights

- `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`,
  `noFallthroughCasesInSwitch: true`
- `jsx: "react-jsx"` (automatic JSX transform — no need to `import React`)
- `allowJs: true` (will tighten once the migration completes)
- `moduleResolution: "bundler"` (Vite-friendly)
- `noEmit: true` (tsc type-checks only; Vite builds)

## 4. Path aliases — bare base names

Aliases are **bare base names**, NOT `@/`-prefixed:

The ALIASES below are real and are the point of the example. The imported names marked
`Example*` are deliberate placeholders — stand-ins for "some component" / "some hook", so this
snippet can never drift out of sync with the codebase. The rest (`Button`, `FULL_PATHS`,
`mockAxios`, `gql`) are the actual API you import by that name.

```ts
import { Button } from 'ui';
import { ExampleCard } from 'components'; // placeholder: any component/index.js export
import { useExampleThing } from 'hooks'; // placeholder: any src/hooks export
import { FULL_PATHS } from 'config/navigation';
import { mockAxios } from 'tests/utils';

// GraphQL is the ONLY `@`-prefixed alias:
import { gql, useQuery } from '@gql';
```

> Note what the placeholders are NOT hiding: `components` resolves to
> `src/components/index.js`, so only what that barrel re-exports is reachable through it. A
> view-local component (`src/views/**`) is not — reach it by its own path, and see
> `component-anatomy` for which of the two it should be in the first place.

## 5. Type conventions

- **Prefer inference — the best type is the one you don't write.** Don't annotate what TS already
  infers: NO explicit hook return-type interfaces (`interface UseFooReturn {…}` + `(): UseFooReturn`),
  no redundant variable or parameter annotations. Let the return type flow from the implementation.
  On the **rare** occasion you need a hook's return type elsewhere, derive it with
  `ReturnType<typeof useFoo>` — never hand-write (and then have to maintain) a parallel interface.
- **Props**: a local `interface Props` next to the component. Not exported unless a consumer needs it.
- **React 19: `ref` is a plain prop.** Declare `ref?: React.Ref<HTMLInputElement>` in `Props`.
  **Never `forwardRef`.**
- **Always `import type`** when importing types only.
- **No dedicated `src/types/` directory.** Domain types co-locate with their owners.
- **Global ambient types**: `types/global.d.ts` (module augmentations, SVG/asset modules, the
  `TestUtils` global).
- **GraphQL types are always the generated ones** — import from `@gql/generated/graphql`, never
  hand-roll an input/result shape. See `graphql`.

## 6. Comments — nothing enforces this, so it is on you

No lint rule checks comment content. CI runs a Gemini no-comments review, and that is the only
backstop — so treat the rules below as the real gate.

**Default to NONE.** Let naming and structure carry the meaning. Comment only genuinely
hard-to-follow logic, or an intentional non-obvious flow-break.

- **The best comment is the one you don't write.** Don't restate what the code or naming already
  says (`// open the modal` above `modal.onOpen()`), don't narrate pattern-following code, and don't
  describe a whole controller or module top-to-bottom — comment the one non-obvious line.
- **Explain the rule, not the ticket.** NEVER reference a PRD, Figma, Jira id or requirement code
  (`RD-117`, `RN-08`, `caso 12`, `TD §…`) in a permanent comment — they mean nothing to a future
  reader. State the business rule directly, and only where the code isn't already explicit (e.g.
  *why* a value is hardcoded pending a backend field).
- **Don't restate conventions.** If a skill documents it (arrow + `useController`, tokens, i18n
  keys…), don't narrate it in code.
- **Cross-task seams get a TODO.** When a task leaves a slot for a later one, mark it
  `// TODO(gibran): …`. Ticket ids ARE allowed *here* — the TODO is temporary and gets deleted when
  the future change lands. This is the ONLY place a ticket id belongs.

Long function hard to read? Extract cohesive helpers, never section-comments.

## 7. Control flow — flatten it

No nested-if pyramids. Combine conditions, derive a named boolean, or use guard clauses and early
returns:

```ts
// ❌ pyramid
if (user) { if (user.isActive) { if (hasBalance) { … } } }

// ✅ guards
if (!user?.isActive) return null;
if (!hasBalance) return <EmptyState />;
```

If a function needs several levels of nesting to express itself, it is doing more than one thing —
extract cohesive helpers rather than narrating the nesting with comments. `eslint.config.js` enforces
the ceiling (`max-depth: 2`, 8 violations today) but not the fix; the fix is above.

## 8. Checking your work

Run `pnpm typecheck` and `pnpm lint` over the **whole** `./src`, never scoped to your diff — that is
what CI does, and a scoped run hides failures elsewhere. Exact invocations in **`toolchain`**.
