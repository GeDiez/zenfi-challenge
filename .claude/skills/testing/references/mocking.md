# Mock factories — data-layer recipes

Detail for the `testing` skill. SKILL.md holds the rules; this file holds the recipes.

## Status: unpopulated

This project has no HTTP client, query client, or state library yet, so there are no mock recipes to
document. Writing speculative ones would be worse than an empty file: they would look authoritative
while describing an API that does not exist.

## What belongs here once a data layer is adopted

- **Where mock files live and how they are named** — the folder next to the test, the barrel that
  re-exports the factories, and how they sit beside fixtures.
- **Fixtures vs mock files.** Fixtures are plain reusable **data** (the "what"). Mock files are the
  **wiring** that serves it (the "how"). A mock usually consumes a fixture; keeping them separate is
  what stops one test's data reshaping another test's transport.
- **One factory per operation.** Success and failure are driven by **parameters**, never by a second
  `mockFooError` factory — two factories for one operation drift apart, and the error path is the one
  that rots.
- **Factories import the real request definition** from the module that owns it, never a retyped
  copy, so a change to the operation breaks the test instead of silently passing against a stale
  duplicate.
- **How a fake is consumed** — whether a mock is single-use per match, and how to provide a second
  entry for a refetch.
- **The error channel** for the chosen client, so tests can drive failure states through the same
  boundary as success.

Until then, follow §10 of the parent skill: fake at the network boundary, never by mocking the
component's own hooks.
