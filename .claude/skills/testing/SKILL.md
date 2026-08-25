---
name: testing
description: >
  THE single source of truth for every test concern in ytp-investor-web. Vitest + Testing Library
  conventions: the custom `render`/`renderHook` from `tests/utils`, real i18n (never mocked), REST
  mocking with `mockAxios`, GraphQL mocking via Apollo `MockedProvider` with mock-file factories,
  fixtures, stubbing children with `vi.mock`, the two `behavesLike` helpers and when to use each,
  characterization tests, plus a section per target: component, hook, utility, view, navigator,
  form, modal. Every other skill REFERENCES this one instead of documenting tests itself.
  Trigger: ALWAYS load when a test is created, touched, modified, or refactored — any
  `*.test.ts(x)` / `*.test.js(x)` file or anything under `__tests__/` — and when setting up
  REST/GraphQL mocks, writing a mock file or fixtures, stubbing a child component, factoring a
  `behavesLike` helper, or deciding how to test anything at all.
license: Apache-2.0
metadata:
  author: yotepresto
  version: "2.0"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash
---

## Testing

This skill owns ALL testing conventions. `component-anatomy`, `form-anatomy`, `view-anatomy`,
`navigator-anatomy`, `modal-anatomy`, `redux-query`, `graphql` and `migrate-legacy-code` point
here — they never document test setup themselves.

Full REST + GraphQL mock-factory recipes: [references/mocking.md](references/mocking.md).

---

## 0. Tests come FIRST

**Write the test before the implementation. No exceptions.** Red → green → refactor: the test states
the expected behaviour, you watch it fail for the right reason, then you make it pass.

This is not only for new code. Refactoring untested legacy? The safety net goes in first — see §16
and `migrate-legacy-code`. Fixing a bug? The test that reproduces it comes before the fix, otherwise
nothing proves the fix works or stops the regression from returning.

---

## 1. Entry point and setup

Test helpers live under `tests/` at the **repo root** (not under `src/`). The alias is set in
`tsconfig.json`, so import as `from 'tests/utils'`.

`tests/utils` is the single entry point — `render`, `renderHook`, `act`, `mockAxios`, `UserEvent`.

- **`TestUtils` is a GLOBAL** (`global.TestUtils`, typed in `types/global.d.ts`). Use
  `TestUtils.flushPromises()` / `TestUtils.createItBehavesLike(…)` directly — **do not import it**.
  `tests/utils` does also export it, and ~29 older files import it; that's harmless legacy, drop
  the import when you touch the file.
- **Never import Vitest globals.** `describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach` are
  globals (`test.globals: true` in `vite.config.ts`). Never
  `import { describe, it, expect, vi } from 'vitest'` — this holds inside mock and fixture files too.
- **`userEvent`, never `fireEvent`.** Set up once per test: `const userEvent = UserEvent.setup()`.
  Never destructure `user` from `render` — `render` does not return one. Do NOT add a local no-op
  focus `beforeAll` patch; it breaks `userEvent`, and global setup already handles Chakra/@zag focus.
- **`screen` is not re-exported.** Import it from `@testing-library/react` when you need it
  (portals — see §11).

### Custom `render` and `renderHook`

`tests/renders/render.tsx` wraps Testing Library's render with every provider (Redux, Apollo
`MockedProvider`, Router, UIProvider, Features, WebStorage). Options:

| Option | Use for |
|---|---|
| `mocks` | Apollo GraphQL mocks (array of `{ request, result }`) |
| `initialState` / `extraReducers` | Redux state hydration |
| `initialEntries` / `initialIndex` | Router memory-history setup |
| `featureFlags` | Feature-flag map (see `shared-hooks`) |
| `store` | Pre-built Redux store (overrides `initialState`) |

`renderHook` accepts the same options, plus a `wrapper` for provider-backed hooks.

---

## 2. i18n: ALWAYS the real resources — NEVER mock

```ts
import { tscope } from 'i18n';

const ts = tscope('Dashboard.Cart.addToCart.alerts');

expect(getByText(ts('confirm'))).toBeInTheDocument();
```

**Do NOT add `vi.mock('i18n', …)` to any test.** The real i18n system catches missing keys and
validates copy — mocking it defeats the safety net. There are zero such mocks in the codebase;
keep it that way. Assert formatted values through the real helpers (`toCurrency`, `toNumber`),
never a hardcoded `'$1,234.50'` string. See `i18n`.

---

## 3. What to assert (and what never to)

- **Behavior over implementation.** Assert what the user sees, where it navigates, what gets
  dispatched or fired — never internal state shape.
- **No trivial DOM assertions.** Never assert on `tagName`, `className`, or inline styles. Those
  are implementation details that break on any refactor.
- **Query priority: destructured → `screen` → never `querySelector`.** Use the queries destructured
  from `render` first. Fall back to `screen` only for what they can't reach (portal content, or
  after a re-render). **Never** `container.querySelector`.
- **Always `await act(TestUtils.flushPromises)`** after a render that triggers async work (Apollo,
  axios) before asserting.

---

## 4. The two `behavesLike` helpers — pick by shape

Both are conventions in this repo. They are NOT interchangeable.

**A. `TestUtils.createItBehavesLike<O>(cb)` — it DECLARES the tests.** Returns an `it`-like
function (with `.only` / `.skip`). Reach for it when you have many small parametrized cases that
share one assertion body.

```ts
const itDrops = TestUtils.createItBehavesLike<{ event: Partial<Event> | null }>((options) => {
  expect(isTransientNetworkError(options!.event as Event)).toBe(true);
});

itDrops('drops an unhandled axios Network Error', { event: { /* … */ } });
itDrops('drops a user-aborted request', { event: { /* … */ } });
```

**B. A file-local `behavesLike*` async function — you call it INSIDE your own `it()`.** Reach for
it when each case needs its own name, extra setup, or extra assertions after the shared shape.

```ts
const SESSION_PATH = '/auth/validate_token'; // no exported constant for this one — §8

const behavesLikeMountView = async ({ path, expectedHeading, mockSession }) => {
  const apiMock = mockAxios([{ method: 'GET', url: SESSION_PATH, data: mockSession, status: 200 }]);
  const { findByRole } = render(<App />, { initialEntries: [path] });
  await act(TestUtils.flushPromises);

  expect(apiMock.calls.get).toHaveBeenCalled();
  expect(await findByRole('heading', { name: expectedHeading })).toBeInTheDocument();
};

it('mounts Dashboard', () =>
  behavesLikeMountView({ path: '/dashboard', expectedHeading: 'Resumen', mockSession: USER_ACTIVE }));
```

Rules for both: factor one only once **≥2 tests share the shape**, and keep it **file-local**,
inside the `describe`. Never extract a `behavesLike` helper to a shared module.

---

## 5. Test a component

The default case. Render it with the custom `render`, drive it with `userEvent`, assert visible
output and outgoing calls.

```tsx
// the test lives in `__tests__/` next to the component
import { render, UserEvent } from 'tests/utils';
import { Button } from 'ui';

describe('Button', () => {
  it('renders the label and forwards onClick', async () => {
    const onClick = vi.fn();
    const userEvent = UserEvent.setup();
    const { getByRole } = render(<Button onClick={onClick}>Continuar</Button>);

    await userEvent.click(getByRole('button', { name: 'Continuar' }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

- A `src/ui/` primitive is props-driven — no mocks needed beyond the render wrapper. Real example:
  `src/ui/components/Form/Field/ButtonCheckbox/__tests__/ButtonCheckbox.test.tsx`. (`ui`'s `Button`
  has no test yet, so the snippet above is illustrative, not a file you can open.)
- A `src/components/` component usually needs its data mocked (REST → §12, GraphQL → §13).
- **Mock icons and images as stubs**: `vi.mock('components/Icons', () => ({ PauseIcon: vi.fn(() => '<PauseIcon />') }))`, then assert with `getByText('<PauseIcon />')`. **Never add a
  `data-testid` to production code just to test an icon's presence.**

## 6. Test a hook

- **Never test a `useController` in isolation.** Controller hooks are exercised through their
  parent component's behavior. Testing one standalone locks in implementation, not behavior. The
  controller's own conventions live in **`controller-anatomy`**.
- A **pure-logic hook** with no rendering decisions CAN use `renderHook`.
- A hook needing a provider takes a `wrapper`:

```tsx
renderHook(() => useEvent(name, callback), {
  wrapper: ({ children }: React.PropsWithChildren) => <SocketProvider>{children}</SocketProvider>,
});
```

- Assert the hook's **observable effect** (the callback fires, the value updates), not its internal
  wiring. Canonical: `src/providers/Socket/__tests__/useEvent.test.tsx` — it emits the event and
  asserts the handler ran, instead of asserting the handler is registered.

## 7. Test a utility

Plain function, plain assertions — no `render`, no providers. This is where
`TestUtils.createItBehavesLike` shines (many input→output cases sharing one assertion).
Canonical: `src/utils/crashReporter/__tests__/isTransientNetworkError.test.ts`.

## 8. Test a view

Render the view in isolation with the custom `render()` — **no parent navigator**. Pass the initial
route, Redux state, mocks and feature flags as render options. Stub heavy children (§15). See
`view-anatomy` for what a view is.

```tsx
import { render, mockAxios, act } from 'tests/utils';
import { CATALOG_WITHDRAWAL_PATH } from 'apis/investor/withdrawal';
import { FULL_PATHS } from 'config/navigation';
import Withdrawal from '..';

it('renders the withdrawal form', async () => {
  mockAxios([
    { method: 'GET', url: CATALOG_WITHDRAWAL_PATH, data: WITHDRAWAL_BANKS, status: 200 },
  ]);

  const { findByText } = render(<Withdrawal />, {
    initialEntries: [FULL_PATHS.WITHDRAW_FUNDS],
  });

  await act(TestUtils.flushPromises);
  expect(await findByText(ts('title'))).toBeInTheDocument();
});
```

Note the two rules the example enforces: the URL comes from the `apis/` layer constant and the
path from `FULL_PATHS` — **never hardcode either**.

**The session endpoint is the exception you WILL hit.** `src/apis/auth/session/index.js` exports only
`fetchSession` and `createSession` — there is no `SESSION_PATH` constant to import, so all 8 test
files that mock it declare `const SESSION_PATH = '/auth/validate_token'` locally. Prefer adding the
export to that module and importing it; if you declare it locally instead, you are reproducing a
known deviation from §12's rule, not satisfying it.

## 9. Test a navigator

A navigator test verifies ONE thing: the right view mounts at the right URL, and guards/redirects
fire. It does NOT test child-view internals. Canonical: `src/navigators/App/__tests__/App.test.tsx`.

- **`describe('@navigators | <Navigator />')`** — the `@navigators` tag plus the component in
  angle brackets.
- **Stub every child view / sub-navigator as a sentinel string component**:
  `vi.mock('views/.../Landing', () => ({ Landing: () => '<Landing />' }))`. Assert on the sentinel
  text. Stub the Layout transparently: `({ children }) => <>{children}</>`.
- **Mount at a URL** via `render(…, { initialEntries: [path] })` using `FULL_PATHS`. For a
  **nested** navigator, wrap it in its real parent splat route so relative routes and redirects
  resolve as in the app:
  `<Routes><Route path={APPLICATION_PATHS.AREA['*']} element={<Navigator />} /></Routes>`.
  Mounting a nested navigator bare at the router root makes relative `<Navigate>`s resolve wrong
  and **can infinite-loop the suite** (RD-110 / RD-112 — a real 1h CI hang).
- **Drive the boundary's data** the way the navigator loads it: REST shell → `mockAxios` +
  `await act(TestUtils.flushPromises)`; GraphQL → `mocks` + `findByText`.
- **Name tests by behavior** ("redirects the index to config when activated"), never by codes
  (`N-01:`).

## 10. Test a form

Drive it like a user: fill the fields with `userEvent`, submit, assert the mutation fired with the
right variables (or did NOT fire when validation blocks it).

```ts
await userEvent.type(getByLabelText(ts('fields.amount')), '1000');
await userEvent.click(getByRole('button', { name: ts('submit') }));
await act(TestUtils.flushPromises);

expect(withdrawalMock.result).toHaveBeenCalled();
// validation-blocked path: expect(withdrawalMock.result).not.toHaveBeenCalled();
```

Assert error copy through the shared keys (`tscope('Forms.fields.errors')`) — see `form-anatomy`.

## 11. Test a modal

Same as a component, plus:

- Chakra renders modal content into a **portal**, so reach it with `screen` when the destructured
  queries don't see it. (The legacy `components/Modal` is `react-modal` — also a portal.)
- Assert the user contract: opening shows the title, cancel calls `onClose`, submitting fires the
  mutation, in-flight disables the controls.
- **Never assert on the disclosure object.** Drive the modal by clicking its real trigger.
- A modal keyed for fresh-state-per-open (`key={...isOpen}`) is testable by closing and reopening
  and asserting the fields are blank. See `modal-anatomy`.

---

## 12. REST data: `mockAxios`

```ts
import { mockAxios, act } from 'tests/utils';
import { BANK_ACCOUNTS_PATH } from 'apis/investor/bankAccounts';

const apiMock = mockAxios([
  { method: 'GET', url: BANK_ACCOUNTS_PATH, data: mockBankAccounts, status: 200 },
  { method: 'POST', url: BANK_ACCOUNTS_PATH, data: mockCreatedAccount, status: 201 },
]);

await act(TestUtils.flushPromises);

expect(apiMock.calls.post).toHaveBeenCalledWith(
  expect.objectContaining({ url: expect.stringContaining(BANK_ACCOUNTS_PATH) }),
);
```

- **URLs come from the `apis/` layer constants** — never a hardcoded string literal. Constants that
  exist today and import cleanly: `BANK_ACCOUNTS_PATH` (`apis/investor/bankAccounts`),
  `CATALOG_WITHDRAWAL_PATH` / `WITHDRAWAL_REQUEST_PATH` (`apis/investor/withdrawal`),
  `UPDATE_PHONE_PATH` (`apis/investor/profile/cellphone/update`), `SECOND_FACTOR_PATH`
  (`apis/investor/secondFactor/fetch`). The session endpoint has **no** such constant — see the
  deviation noted in §8.
- The API layer `camelify`s responses, so mock `data` must be **snake_case**.
- A 4xx/5xx `status` makes `mockAxios` reject (shape `{ response: { status, data, headers } }`),
  exercising the error handler — same factory, different param.

What a component *should* render while loading, when empty, or on error is owned by
**`async-state-anatomy`** — this section is only about how to drive those states from a test.

### redux-query slices: `mockAxios` vs hydrate — decide by who owns loading

| The component… | Approach |
|---|---|
| **Handles its own loading** (renders via `isLoading`/`isCompleted`, tolerates an empty payload) | **`mockAxios`.** Leave the slice INITIAL (don't pass `initialState`), mock the endpoint, `await act(TestUtils.flushPromises)`. `useReduxQuery` auto-fetches on mount when INITIAL, so this exercises the real fetch → reducer → render path. |
| **Assumes pre-loaded data** (destructures the payload with no guard; the shell guarantees it's loaded before mount) | **`initialState` hydration** (COMPLETED). mockAxios would force an empty first render (payload defaults to `null`) that production never produces → crash. |

Examples: `MonthlyTransactions` owns its loading → mockAxios. `TransactionsLimitsCard` /
`BankAccountCard` assume `session.limits` / `depositInformation` exist → hydrate.

`tests/setupTests.js` runs `resetCache()` in `afterEach`, so the auto-fetch re-fires every test —
no cross-test leakage. To assert a **pending** state, assert before flushing, then flush anyway so
the late update doesn't warn. Full lifecycle background: `redux-query`.

## 13. GraphQL data: `mocks` + mock-file factories

The custom `render` wraps Apollo `MockedProvider`; pass `{ request, result }` mocks through the
`mocks` option — one entry per operation the component fires.

**Always put each mock in a mock file as a factory**, in `__tests__/mocks/` next to the test, with
an `index.ts` barrel. Each factory imports the **real gql document** (never re-declares it), types
its params with the **generated** types from `@gql/generated/graphql`, and returns `result` as a
`vi.fn` so the test can assert it fired.

```ts
// mocks/withdraw.ts
import { CREATE_WITHDRAWAL } from '../../hooks/graphql';
import type { CreateWithdrawalMutationInput } from '@gql/generated/graphql';

export const mockWithdraw = ({ user, withdrawalInput, errors }: {
  user: { id: string };
  withdrawalInput: CreateWithdrawalMutationInput;
  errors?: GraphQLError[];
}) => ({
  request: { query: CREATE_WITHDRAWAL, variables: { input: withdrawalInput } },
  result: vi.fn(() => ({ data: { createWithdrawal: { user } }, errors })),
});
```

Key rules (full recipes, error channels and the one-factory-per-operation policy:
[references/mocking.md](references/mocking.md)):

- **ONE factory per operation.** Success vs error is driven by **params**, never a second
  `mockXError` factory.
- `variables` must deep-match what the operation sends, or Apollo reports "No more mocked
  responses" and the component renders its error/empty branch.
- A mock is consumed **once** per matching `{ query, variables }` — provide two entries for a refetch.
- Any query selecting `Query.user` must include `user { id }` or Apollo cache-clobbers between
  user-selecting operations (silent empty data). See `graphql`.

## 14. Mock files vs fixtures

Two different things — keep them separate:

- **Fixtures** = plain reusable **data** (the "what"), in a `fixtures.{js,ts}` next to the test.
  No `request`/`result`, no Apollo. Example: `src/navigators/App/__tests__/fixtures.js` exports
  session payloads reused across many cases.
- **Mock files** = the **wiring** that serves data (the "how"): gql `{ request, result }` factories,
  or REST configs fed to `mockAxios`. A mock usually *consumes* a fixture.

---

## 15. Stubbing children with `vi.mock`

When a child pulls in heavy setup, mocks, or rendering unrelated to what you're testing, stub it.
There is no project helper — `vi.mock` is the convention.

```ts
// whole module
vi.mock('../components', () => ({ Terms: () => '<Terms />', Confirm: () => '<Confirm />' }));

// partial — preserve real exports
vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: vi.fn(),
}));

// pass-through layout
vi.mock('navigators/App/UserExpedient/Layout/Layout', () => ({
  Layout: ({ children }) => children,
}));

// SVG assets — always stub (Vite-SVGR's `?react` isn't available in jsdom)
vi.mock('assets/identityVerification/user-blocked.svg?react', () => ({
  default: () => '<UserBlockedImage />',
}));
```

Rules:

- **NEVER mock `i18n`** (§2).
- **Don't mock the component under test.** Stub only its children, providers and assets.
- **Prefer `vi.importActual` for partial mocks** — replacing a whole module silently loses behavior.
- **Don't deep-stub.** Needing 6 stubs to render one view means the view does too much — refactor.
- **Beware over-stubbing a feedback loop.** Mocking a child that feeds state back to the parent can
  hide an infinite-render bug that only appears in the browser.
- Put `vi.mock` calls at module scope, above the imports. Vitest hoists them, but placement makes
  the intent visible.

## 16. Characterization tests (before a refactor)

Refactoring untested legacy code? Lock the CURRENT observable behavior first, run it green against
the legacy code, then migrate — the same tests must pass **unchanged**. Workflow, ordering and the
legacy-specific traps live in `migrate-legacy-code`; the mechanics are all above.

The one trap worth repeating: **write the user-facing contract, not DOM presence.** A test asserting
`expect(getByText(tooltipCopy)).toBeInTheDocument()` passes on react-tooltip v4 (always mounted) and
breaks on Chakra `Tooltip` (mounts on hover) — blocking a change that is an improvement. Write
`await userEvent.hover(trigger)` then `expect(await findByText(copy)).toBeVisible()`; that passes on
both.

## 17. No runtime dynamic `import()` in test bodies

Import the module statically at the top. `vi.mock` is hoisted above ALL static imports, so a static
import already gets the mocks — deferring it (`const { default: X } = await import('../index')`
inside the `it`) is a misconception. It also loads heavy barrels late, widening the
`styled-components → tslib` teardown race and causing flaky `EnvironmentTeardownError` exits.

This is about dynamic `import()` in test **bodies**. The setup-time partial-mock pattern
`vi.mock('x', async (importOriginal) => ({ ...(await importOriginal()), … }))` is fine.

## 18. A red or hanging test is a bug until proven otherwise

Never dismiss a failure as "flaky" to avoid investigating — that cost 2h of CI on #1526, where the
"flaky teardown" was a synchronous infinite redirect loop. Root-cause it first. Known-and-solved
teardown classes: `vi.dynamicImportSettled()` in `afterEach`, and `globalThis.__DEV__ = false` in
`setupTests` (Apollo's devtools timer leaking past jsdom teardown).

## 19. Running tests

Exact commands and the `--run` gotcha live in **`toolchain`**. What matters here is scope: iterate on
one file or one subtree (`pnpm vitest run <path>`), and run the full suite before pushing — a full
run costs minutes because of this repo's setup time.
