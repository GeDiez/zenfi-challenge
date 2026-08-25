# Mock factories — REST and GraphQL recipes

Detail for the `testing` skill. SKILL.md holds the rules; this file holds the full recipes.

## Folder layout

Mock files live in a `__tests__/mocks/` folder next to the test, re-exported from an `index.ts`
barrel. Fixtures (plain data) sit beside them, NOT inside `mocks/`.

```
WithdrawalForm/
  __tests__/
    WithdrawalForm.test.tsx
    fixtures.ts                 # plain reusable data
    mocks/
      index.ts                  # re-exports every factory
      withdraw.ts               # mutation
      withdrawalInitialData.ts  # query
      catalog.ts                # query
```

---

## GraphQL factories

Each factory **imports the real gql document** from the feature's `hooks/graphql` — never
re-declares the operation, because the document must match what the component actually sends.
It returns `{ request, result }` with `result` as a `vi.fn` so the test can assert it fired.

### Query

```ts
// mocks/mockRefreshSessionQuery.ts
import { REFRESH_SESSION_QUERY } from '../../hooks/graphql';

export const mockRefreshSessionQuery = () => ({
  request: { query: REFRESH_SESSION_QUERY, variables: {} },
  result: vi.fn(() => ({ data: { user: { id: 'userId' } } })),
});
```

### Mutation (parameterized, covers the error path)

```ts
// mocks/withdraw.ts
import { CREATE_WITHDRAWAL } from '../../hooks/graphql';
// Type params/results with the GENERATED gql types — never hand-roll an input shape.
import type { CreateWithdrawalMutationInput } from '@gql/generated/graphql';
import type { GraphQLError } from 'graphql'; // GraphQLError comes from the `graphql` package

export const mockWithdraw = ({
  user,
  withdrawalInput,
  errors,
}: {
  user: { id: string };
  withdrawalInput: CreateWithdrawalMutationInput;
  errors?: GraphQLError[];
}) => ({
  // `variables` must match EXACTLY what the hook sends (here: { input: { … } }).
  request: { query: CREATE_WITHDRAWAL, variables: { input: withdrawalInput } },
  result: vi.fn(() => ({ data: { createWithdrawal: { user } }, errors })),
});
```

> **Always type mocks with generated gql types.** Import input/result types from
> `@gql/generated/graphql` instead of hand-rolling interfaces — they stay in sync with the schema.

### Consuming them

```ts
import { render, act, UserEvent } from 'tests/utils';
import { tscope } from 'i18n';
import { mockWithdrawalInitialData, mockWithdraw } from './mocks';

const ts = tscope('Withdrawal.WithdrawalForm');
const withdrawalMock = mockWithdraw({ user: { id: '1' }, withdrawalInput });

const userEvent = UserEvent.setup();
const { getByRole } = render(<WithdrawalForm />, {
  mocks: [mockWithdrawalInitialData({ bankAccounts }), withdrawalMock],
});

await userEvent.click(getByRole('button', { name: ts('submit') }));
await act(TestUtils.flushPromises);

expect(withdrawalMock.result).toHaveBeenCalled();
```

### The two GraphQL error channels

Both are driven by params on the SAME factory:

- **`errors`** — GraphQL-level errors (`GraphQLError[]`). The request resolves but the payload
  carries `errors`. Returned through `result`.
- **`error`** — a network/link error. Apollo **rejects** the operation. Set as the mock's
  top-level `error` key.

```ts
// mocks/accountStatement.ts — ONE factory: success, GraphQL errors, network error
export const mockAccountStatement = (
  accountStatement = null,
  { variables, errors, error } = {},
) => ({
  request: { query: ACCOUNT_STATEMENT_GQL, variables },
  result: vi.fn(() => ({ data: { accountStatement }, errors })),
  error, // when set, MockedProvider rejects instead of returning data
});

// success:        mockAccountStatement(fixtureData, { variables })
// GraphQL errors: mockAccountStatement(null, { variables, errors: [new GraphQLError('…')] })
// network error:  mockAccountStatement(null, { variables, error: new Error('Network error') })
```

### Matching gotchas

- A mock is consumed **once** per matching `{ query, variables }`. If the component fires the same
  operation twice (e.g. a refetch), provide two entries.
- `variables` must **deep-match** what the operation sends, or Apollo reports "No more mocked
  responses" and the component silently renders its error/empty branch.
- Any operation selecting `Query.user` must include `user { id }` — without it Apollo cache-clobbers
  between user-selecting queries, producing silent empty data on an unrelated query. See `graphql`.

---

## REST factories

Same convention: a factory in the same `__tests__/mocks/` folder that imports the real endpoint
constant from the `apis/` layer (**never hardcode the URL**), takes the fixture data as a
parameter, and wires `mockAxios`.

```ts
// mocks/secondFactor.ts
import { mockAxios } from 'tests/utils';
import { SECOND_FACTOR_PATH } from 'apis/investor/secondFactor/fetch';

export const mockFetchSecondFactor = ({ data, status = 200 } = {}) =>
  mockAxios([{ method: 'GET', url: SECOND_FACTOR_PATH, data: data || {}, status }]);
```

```ts
// in the test
import { mockFetchSecondFactor } from './mocks';

mockFetchSecondFactor({ data: { otpType: OTP_TYPES.SMS } });   // success
mockFetchSecondFactor({ status: 422, data: { error: '…' } });  // error path, SAME factory
```

**Difference from GraphQL**: a gql factory **returns** a `{ request, result }` object you pass via
the `mocks` render option; a REST factory **calls** `mockAxios` directly (there is no render option
for REST). Both live in `mocks/`, both pull their URL/operation from real source, both take fixtures.

Remember: the API layer `camelify`s responses, so mock `data` must be **snake_case**.

---

## One factory per operation

Write **one** factory per operation and drive success vs error from its parameters. Do NOT add a
second `mockXError` / `mockXSuccess` factory — that older pattern is out. You will see duplicated
success/error mocks in the codebase; collapse them into one when you touch them.

---

## Fixtures

Plain reusable data, no `request`/`result`, no Apollo. A mock usually consumes a fixture.

```ts
// App.test.tsx — fixtures (data) + mockAxios (REST wiring), no inline literals
import { SESSION_AUTHORIZED, SESSION_CONTRACT_UNSIGNED } from './fixtures';

// `apis/auth/session` exports only `fetchSession`/`createSession` — no path constant to import,
// so this file declares it, like the other 7 that mock the session. See SKILL.md §8.
const SESSION_PATH = '/auth/validate_token';

mockAxios([{ method: 'GET', url: SESSION_PATH, data: SESSION_AUTHORIZED, status: 200 }]);
```

Canonical example: `src/navigators/App/__tests__/fixtures.js` exports session payloads
(`SESSION_AUTHORIZED`, `SESSION_CONTRACT_UNSIGNED`, …) reused across many cases, and
`src/navigators/App/__tests__/App.test.tsx:82` is the local `SESSION_PATH` declaration above.
