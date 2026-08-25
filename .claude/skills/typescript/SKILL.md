---
name: typescript
description: >
  THE single source of truth for TypeScript rules in this repo: TS-only source files, `tsconfig`
  highlights and the project-references split, inference-first typing (no hand-written hook
  return-type interfaces), React 19 `ref`-as-prop, comment judgment, flattened control flow, and
  the type-level bans — no `any`, no escape-hatch `as`, no `@ts-ignore`/`@ts-nocheck`, no
  suppressions. Deterministic conventions are enforced by the linter, not restated here.
  Trigger: When writing or editing ANY .ts/.tsx file, creating a new file, typing a hook or
  component, or reaching for `any`/`as`/a type suppression.
license: Apache-2.0
metadata:
  author: yotepresto
  version: '1.1'
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

## TypeScript

This skill owns every TypeScript rule.

### Scope

It owns typing, the compiler configuration, and the type-level bans. It does not own component
structure, styling, or test conventions.

---

## 1. Source is TypeScript, always

- **New files are ALWAYS `.ts` / `.tsx`.** Never create a `.js` / `.jsx` in `src/`.
- **No PropTypes.** Props are a local `interface`, checked at compile time.
- If a `.js` file ever lands here, rename it as part of the same change rather than leaving a
  typed codebase with an untyped hole in it. Rename **only the file you were already editing** —
  chaining renames into unrelated files turns one reviewable change into an unreviewable one.

**Never merge a half-done conversion.** A file with broken imports, types papered over with `any`,
or suppressions scattered around is worse than one that was left alone. Either it becomes properly
typed in this change, or it stays out of scope.

## 2. Hard bans

- **No `any`.** If a type genuinely can't be expressed, write a proper generic or narrow at the
  boundary. `any` disables checking silently and spreads to everything it touches.
- **No `as` casts to escape a type problem.** Fix the type. A cast that "makes the error go away"
  moves the failure from compile time to runtime. Narrowing with a real type guard is not a cast.
- **No `@ts-ignore` / `@ts-nocheck`.**
- **No `eslint-disable`.** A suppression hides a real violation from every future reader. If a rule
  is wrong for this codebase, change it in the config where the decision is visible and reviewable.

Copying an existing bad pattern is not an excuse. If you cannot express a type, stop and surface it
rather than suppressing it.

## 3. `tsconfig` — the project-references split

`tsconfig.json` is a solution file with no `files` of its own. It references two leaf configs, and
**compiler options must go in the right leaf — editing the root does nothing**:

- `tsconfig.app.json` → `src`, DOM libs, `jsx: "react-jsx"` (no `import React` needed).
- `tsconfig.node.json` → `vite.config.ts`, Node types.

Both enable:

- `strict: true`, plus `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.
- `verbatimModuleSyntax` — a type-only import MUST say `import type`, or the emit keeps a runtime
  import of something that doesn't exist at runtime.
- `erasableSyntaxOnly` — TS-only runtime syntax is rejected. No `enum`, no parameter properties, no
  namespaces. Use a `const` object with a derived union instead of an enum.
- `moduleResolution: "bundler"` and `noEmit: true` — `tsc` type-checks, the bundler builds.

## 4. Imports

No path aliases are configured. Imports are relative, and a module's depth in the tree is a real
cost: if a file needs `../../../` to reach a sibling concern, that is a signal the two belong closer
together, not a signal to add an alias.

## 5. Type conventions

- **Prefer inference — the best type is the one you don't write.** Don't annotate what TS already
  infers: NO explicit hook return-type interfaces (`interface UseFooReturn {…}` + `(): UseFooReturn`),
  no redundant variable or parameter annotations. Let the return type flow from the implementation.
  On the **rare** occasion you need a hook's return type elsewhere, derive it with
  `ReturnType<typeof useFoo>` — never hand-write (and then have to maintain) a parallel interface.
- **Props**: a local `interface Props` next to the component. Not exported unless a consumer needs it.
- **React 19: `ref` is a plain prop.** Declare `ref?: React.Ref<HTMLInputElement>` in `Props`.
  **Never `forwardRef`.**
- **Always `import type`** when importing types only — the compiler config requires it.
- **No dedicated `src/types/` directory.** Domain types co-locate with their owners.
- **Global ambient types** live in a single `.d.ts` (module augmentations, asset modules).

## 6. Comments — nothing enforces this, so it is on you

No lint rule checks comment content. Treat the rules below as the real gate.

**Default to NONE.** Let naming and structure carry the meaning. Comment only genuinely
hard-to-follow logic, or an intentional non-obvious flow-break.

- **The best comment is the one you don't write.** Don't restate what the code or naming already
  says (`// open the modal` above `modal.onOpen()`), don't narrate pattern-following code, and don't
  describe a whole module top-to-bottom — comment the one non-obvious line.
- **Explain the rule, not the ticket.** NEVER reference a PRD, Figma, ticket id or requirement code
  in a permanent comment — they mean nothing to a future reader. State the rule directly, and only
  where the code isn't already explicit (e.g. *why* a value is hardcoded pending a backend field).
- **Don't restate conventions.** If a convention is documented, don't narrate it in code.
- **Cross-task seams get a TODO.** When a change leaves a slot for a later one, mark it
  `// TODO(name): …`. Ticket ids ARE allowed *here* — the TODO is temporary and gets deleted when
  the future change lands. This is the ONLY place a ticket id belongs.

Long function hard to read? Extract cohesive helpers, never section-comments.

## 7. Control flow — flatten it

No nested-if pyramids. Combine conditions, derive a named boolean, or use guard clauses and early
returns:

```ts
// ❌ pyramid
if (user) { if (user.isActive) { if (hasBalance) { … } } }

// ✅ guards
if (!user?.isActive) return null
if (!hasBalance) return <EmptyState />
```

If a function needs several levels of nesting to express itself, it is doing more than one thing —
extract cohesive helpers rather than narrating the nesting with comments.

## 8. Checking your work

Type-check and lint the **whole** project, never scoped to your diff — a scoped run hides failures
elsewhere, and the whole project is what CI checks:

```bash
npm run typecheck
npm run lint
```
