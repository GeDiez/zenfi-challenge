---
name: testing
description: >
  THE single source of truth for every test concern in this repo. Vitest + Testing Library
  conventions: global test APIs, the shared setup file, `userEvent` over `fireEvent`, what to assert
  and what never to, the two `behavesLike` helpers and when to use each, resetting global state,
  stubbing children with `vi.mock`, characterization tests, plus a section per target — component,
  hook, utility, form, modal.
  Trigger: ALWAYS load when a test is created, touched, modified, or refactored — any
  `*.test.ts(x)` file or anything under `__tests__/` — and when stubbing a child component,
  factoring a `behavesLike` helper, or deciding how to test anything at all.
license: Apache-2.0
metadata:
  author: yotepresto
  version: '2.1'
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

## Testing

This skill owns ALL testing conventions.

### Scope

It owns how tests are written, driven and asserted. It does not own component structure, styling, or
typing rules.

Data-layer test recipes — how to serve fake responses to whatever HTTP or query client the app
adopts — belong in [references/mocking.md](references/mocking.md).

---

## 0. Tests come FIRST

**Write the test before the implementation. No exceptions.** Red → green → refactor: the test states
the expected behaviour, you watch it fail for the right reason, then you make it pass.

This is not only for new code. Refactoring untested code? The safety net goes in first — see §12.
Fixing a bug? The test that reproduces it comes before the fix, otherwise nothing proves the fix
works or stops the regression from returning.

---

## 1. Setup

Test configuration lives in the `test` block of `vite.config.ts` — there is no separate Vitest
config file. `src/test/setup.ts` runs before every suite: it registers the jest-dom matchers and
calls Testing Library's `cleanup()` in `afterEach`, so **tests never clean up the DOM themselves**.

- **Never import Vitest globals.** `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach` are
  globals (`test.globals: true`), typed through `"vitest/globals"` in `tsconfig.app.json`. Writing
  `import { describe, it } from 'vitest'` is redundant — this holds inside mock and fixture files too.
- **`userEvent`, never `fireEvent`.** Set it up once per test: `const user = userEvent.setup()`.
  `fireEvent` dispatches a raw DOM event and skips everything a real interaction does — focus,
  pointer sequence, disabled checks — so it passes on components a user could not actually operate.
- Prefer the queries destructured from `render`; import `screen` from `@testing-library/react` for
  what they can't reach.

**When providers appear, add a custom `render`.** The moment a component needs a router, a store or
a theme provider to mount, wrap Testing Library's `render` once in `src/test/` and have every test
import that instead. Assembling providers inside individual test files duplicates setup and lets
tests drift apart in what they consider "the app".

---

## 2. What to assert (and what never to)

- **Behavior over implementation.** Assert what the user sees, where it navigates, what gets
  dispatched or fired — never internal state shape.
- **No trivial DOM assertions.** Never assert on `tagName`, `className`, or inline styles. Those are
  implementation details that break on any refactor and prove nothing about behaviour. This applies
  with full force to utility-class styling: asserting an element has `bg-surface` tests the class
  string, not that anything is visible or usable.
- **Query by role and accessible name first.** `getByRole('button', { name: … })` fails when the
  element stops being reachable the way a user reaches it — which is exactly the regression worth
  catching. **Never** `container.querySelector`.
- **Never add a `data-testid` to production code just to make a test easier.** If nothing
  identifies an element accessibly, that is a finding about the component, not about the test.
- **Await async work before asserting.** Prefer `findBy*` queries, which retry, over asserting
  immediately after an interaction.

---

## 3. Reset global state a test touches

Testing Library's `cleanup()` unmounts components. It does **not** undo anything a test wrote
outside the tree — attributes on `document.documentElement`, `localStorage`, timers, or module
state. Anything a test stamps there must be reset in `beforeEach`, or the suite silently depends on
the order its own tests happen to run in and breaks the day one is added.

```ts
beforeEach(() => {
  document.documentElement.removeAttribute('data-theme')
  window.localStorage.clear()
})
```

Prove the isolation rather than assuming it: `pnpm vitest run --sequence.shuffle`. A suite that only
passes in declaration order is already broken; it just hasn't reported it yet.

---

## 4. The two `behavesLike` helpers — pick by shape

They are NOT interchangeable.

**A. A factory that DECLARES the tests.** Returns an `it`-like function. Reach for it when you have
many small parametrized cases sharing one assertion body.

```ts
const itDrops = createItBehavesLike<{ event: Partial<Event> | null }>((options) => {
  expect(isTransientNetworkError(options!.event as Event)).toBe(true)
})

itDrops('drops an unhandled network error', { event: { /* … */ } })
itDrops('drops a user-aborted request', { event: { /* … */ } })
```

**B. A file-local `behavesLike*` async function you call INSIDE your own `it()`.** Reach for it when
each case needs its own name, extra setup, or extra assertions after the shared shape.

```ts
const behavesLikeMountView = async ({ path, expectedHeading }) => {
  render(<App />, { initialEntries: [path] })
  expect(await screen.findByRole('heading', { name: expectedHeading })).toBeInTheDocument()
}

it('mounts the dashboard', () =>
  behavesLikeMountView({ path: '/dashboard', expectedHeading: 'Resumen' }))
```

Rules for both: factor one only once **≥2 tests share the shape**, and keep it **file-local**,
inside the `describe`. Never extract a `behavesLike` helper to a shared module — a shared one drifts
into a second, undocumented test framework.

---

## 5. Test a component

The default case. Render it, drive it with `userEvent`, assert visible output and outgoing calls.

```tsx
// the test lives in `__tests__/` next to the component
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../Button'

describe('Button', () => {
  it('renders the label and forwards onClick', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={onClick}>Continuar</Button>)

    await user.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(onClick).toHaveBeenCalledOnce()
  })
})
```

- A presentational primitive is props-driven — no mocks needed.
- A component coupled to app concerns usually needs its data stubbed — see §11.
- **Mock icons as sentinel stubs** when their presence is the point:
  `vi.mock('../Icons', () => ({ PauseIcon: () => '<PauseIcon />' }))`, then assert on the sentinel
  text.

## 6. Test a hook

- **Never test a controller hook in isolation.** Controller hooks are exercised through their parent
  component's behavior. Testing one standalone locks in implementation, not behavior.
- A **pure-logic hook** with no rendering decisions CAN use `renderHook`.
- A hook needing a provider takes a `wrapper`:

```tsx
renderHook(() => useEvent(name, callback), {
  wrapper: ({ children }: React.PropsWithChildren) => <SocketProvider>{children}</SocketProvider>,
})
```

- Assert the hook's **observable effect** (the callback fires, the value updates), not its internal
  wiring.

## 7. Test a utility

Plain function, plain assertions — no `render`, no providers. This is where the parametrized
`behavesLike` factory shines: many input→output cases sharing one assertion.

## 8. Test a form

Drive it like a user: fill the fields with `userEvent`, submit, assert the submission fired with the
right values — or did NOT fire when validation blocks it. The blocked path is the half people skip,
and it is the half that regresses.

```ts
await user.type(screen.getByLabelText('Monto'), '1000')
await user.click(screen.getByRole('button', { name: 'Continuar' }))

expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ amount: 1000 }))
```

Assert error copy through the same shared source the component renders it from, never a duplicated
literal.

## 9. Test a modal

Same as a component, plus:

- Modal content is usually rendered into a **portal**, so reach it with `screen` when the
  destructured queries don't see it.
- Assert the user contract: opening shows the title, cancel calls `onClose`, submitting fires the
  action, in-flight disables the controls.
- **Never assert on the disclosure object.** Drive the modal by clicking its real trigger.

## 10. Data: fakes at the boundary

This project has no HTTP or query client yet, so there is no mocking convention to follow — and
none should be invented ahead of the need.

When one is adopted, its recipes belong in [references/mocking.md](references/mocking.md), and this
section's rules still hold: fake at the **network boundary**, never by mocking the component's own
hooks; keep request URLs and operation documents imported from the module that owns them rather than
retyped as literals in the test; and drive loading, empty and error states through the same fake
rather than by stubbing the component's internals.

## 11. Stubbing children with `vi.mock`

When a child pulls in heavy setup or rendering unrelated to what you're testing, stub it.

```ts
// whole module
vi.mock('../components', () => ({ Terms: () => '<Terms />', Confirm: () => '<Confirm />' }))

// partial — preserve real exports
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: vi.fn(),
}))

// pass-through layout
vi.mock('../Layout', () => ({ Layout: ({ children }) => children }))

// SVG assets — always stub (`?react` imports aren't available in jsdom)
vi.mock('../../assets/user-blocked.svg?react', () => ({
  default: () => '<UserBlockedImage />',
}))
```

Rules:

- **Don't mock the component under test.** Stub only its children, providers and assets.
- **Prefer `vi.importActual` for partial mocks** — replacing a whole module silently loses behavior.
- **Don't deep-stub.** Needing six stubs to render one screen means the screen does too much —
  refactor it rather than propping the test up.
- **Beware over-stubbing a feedback loop.** Mocking a child that feeds state back to the parent can
  hide an infinite-render bug that only appears in the browser.
- Put `vi.mock` calls at module scope, above the imports. Vitest hoists them, but placement makes
  the intent visible.

## 12. Characterization tests (before a refactor)

Refactoring untested code? Lock the CURRENT observable behavior first, run it green against the old
code, then migrate — the same tests must pass **unchanged**.

The trap worth repeating: **write the user-facing contract, not DOM presence.** A test asserting
`expect(screen.getByText(tooltipCopy)).toBeInTheDocument()` passes on a tooltip that is always
mounted and breaks on one that mounts on hover — blocking a change that is an improvement. Write
`await user.hover(trigger)` then `expect(await screen.findByText(copy)).toBeVisible()`; that passes
on both.

## 13. No runtime dynamic `import()` in test bodies

Import the module statically at the top. `vi.mock` is hoisted above ALL static imports, so a static
import already gets the mocks — deferring it (`const { default: X } = await import('../index')`
inside the `it`) is a misconception, and it loads heavy modules late, widening teardown races.

This is about dynamic `import()` in test **bodies**. The setup-time partial-mock pattern
`vi.mock('x', async (importOriginal) => ({ ...(await importOriginal()), … }))` is fine.

## 14. A red or hanging test is a bug until proven otherwise

Never dismiss a failure as "flaky" to avoid investigating. "Flaky" is a conclusion you earn after
finding the race, not a label you apply to skip looking — and the most common cause is shared state
a test failed to reset (§3), which is a real bug that will eventually bite in production order too.

## 15. Running tests

```bash
pnpm test                          # whole suite, single pass
pnpm test src/App.test.tsx         # one file
pnpm vitest run -t "name"          # one case by name
pnpm vitest run --sequence.shuffle # prove isolation
pnpm test:watch
pnpm test:coverage
```

Iterate on one file, but run the full suite before pushing.
