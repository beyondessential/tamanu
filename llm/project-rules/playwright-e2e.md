# Playwright E2E tests — Tamanu

Guidance for writing and maintaining end-to-end tests in **`packages/e2e-tests`**. This describes an **ideal** target state and common Playwright best practices; the existing suite may not match every point yet — use this document to align new work and refactors.

Also see `llm/project-rules/coding-rules.md` (readability, healthcare boundaries) and `llm/project-rules/important-project-rules.md`.

## Goals of E2E tests

- **Prove critical user journeys** in a running stack (or realistic subset), not every edge case.
- **Fail for the right reasons**: behaviour regressions, not timing, selectors, or shared data.
- **Stay maintainable**: stable abstractions, one obvious place to update when the UI changes.

Prefer **fewer, higher-value E2E tests** and push granular logic to unit/integration tests where possible.

## Package layout (target)

| Area        | Purpose                                                                                                                            |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `tests/`    | Spec files only — orchestration, assertions, `test.describe` grouping. Minimal logic.                                              |
| `pages/`    | Page objects: locators, navigation, user-visible actions. No assertions about “correct” business outcomes unless truly page-local. |
| `fixtures/` | Playwright `test.extend` — auth, API context, seeded patients, composed page objects.                                              |
| `utils/`    | Shared helpers: dates, API setup, table reading, navigation. Pure or thin wrappers.                                                |
| `config/`   | Routes, constants, environment assumptions.                                                                                        |
| `types/`    | Shared TypeScript types for test data and page models.                                                                             |

**Ideal:** specs do not construct raw `Locator`s for core flows; they call page-object methods with meaningful names.

## Page Object Model (POM)

- **One class per screen or cohesive sub-area** (e.g. modal, tab pane). Compose larger flows from smaller objects.
- **Ctor takes `Page`** (or parent page object if you need a consistent sub-context). Avoid static singletons.
- **Expose actions**, not just elements: `submitReferral()` not only `submitButton`.
- **Encapsulate selectors** in one place. When the UI changes, fix selectors in the page object, not across specs.
- **Return values** that assertions need (typed structures, visible labels, ids) from action methods where appropriate.

### Locator strategy (priority order)

1. **`data-testid`** (or team-agreed `data-*`) — best stability when the app provides it.
2. **Role + accessible name** — `getByRole('button', { name: 'Save' })` — good for resilience and accessibility alignment.
3. **User-visible text** — `getByText`, `getByLabel` — use when stable and not translated in ways that break tests.
4. **CSS/XPath** — last resort; document why if unavoidable.

**Ideal:** no brittle selectors tied to layout (`nth-child`, long CSS chains) unless isolated in one helper with a comment.

**Ideal:** avoid `page.locator()` with string selectors scattered in specs; centralise in page objects.

## Tests vs fixtures

- **`test.beforeEach` / `afterEach`**: per-test setup (navigate, reset UI state).
- **`test.beforeAll` / `afterAll`**: expensive one-time setup — use sparingly; watch for **worker isolation** (parallel runs may not share memory the way you expect). Prefer fixtures for per-test resources.
- **Custom fixtures** (`base.extend`): inject `api` context, `newPatient`, page objects, so specs stay short and teardown is consistent (e.g. dispose API context).

**Ideal:** each test gets **fresh,correlated data** (own patient, own encounter) via API setup to avoid order-dependence.

## API usage in E2E

- Use **API to arrange** state (create patient, encounter, seed data) and **UI to act/assert** the journey under test — faster and less flaky than doing everything through clicks.
- Keep HTTP helpers in `utils/apiHelpers.ts` (or feature-specific helpers), not in specs.
- Reuse the same auth/session model the browser uses where possible so permissions match reality.

**Ideal:** document in the helper which environment assumptions it makes (facility, user role).

## Assertions and waiting

- Prefer Playwright **auto-waiting** (`expect(locator).toBeVisible()`, `toHaveText()`, etc.) over raw `waitForTimeout()`.
- Use **`expect.poll`** when the UI depends on async backend or animations — with a bounded timeout and a clear predicate.
- Avoid **fixed sleeps** except as a last resort; if used, add a **short comment** explaining what non-determinism cannot be observed yet (and log a follow-up to replace with event-driven wait).

**Ideal:** assertions read like user expectations: “user sees success”, “row appears”, not “wait 3 seconds”.

## Flakiness and isolation

- **Parallel-safe data**: tests should not share mutable entities (same patient id, same table row) unless the environment guarantees isolation.
- **Deterministic ordering**: don’t rely on default sort; sort explicitly in UI or API setup if the test needs “first row”.
- **Idempotency**: where possible, arrange state so re-runs don’t depend on previous run leftovers.
- **Retries**: CI may retry failed tests — avoid tests that **pass on retry** by hiding race conditions; fix the wait/assertion instead.

## Timeouts

- Prefer **global/reasonable defaults** in `playwright.config.ts`; use **`test.setTimeout`** only for known slow journeys (large imports, heavy flows).
- **Ideal:** per-action slowness is handled with `expect` timeouts and `poll`, not giant per-test timeouts.

## Authentication and projects

- **storageState** (saved cookies/localStorage) for authenticated projects is appropriate; keep generation in a **dedicated setup project** (`setup` → `chromium`).
- **Ideal:** document how to refresh auth artifacts for local dev and CI secrets (without committing credentials).

## Configuration and environments

- Environment via **`.env`** and `playwright.config.ts` (see existing `LAUNCH_LOCAL_SERVERS_WHEN_RUNNING_TESTS` pattern).
- **Workers / `fullyParallel`**: align with environment stability (CI often reduces workers to limit load).

## Reporting and debugging

- Use **trace on failure** (`trace: 'on-first-retry'` or `retain-on-failure` where appropriate).
- Attach **screenshots/video** in CI when it helps diagnose UI regressions — balance artifact size.
- **Ideal:** meaningful **test titles** (see existing convention: external ids + short description) so failures map to test cases.

## Structure of a spec (ideal)

```text
test.describe('Feature area', () => {
  test.beforeEach(async ({ /* fixture deps */ }) => { /* arrange common navigation */ });

  test('[ID-0001] completes happy path', async ({ page, patientDetailsPage, newPatient }) => {
    // arrange (minimal, often via fixture)
    // act — only page object methods + high-level expect
    // assert — user-visible outcomes
  });
});
```

- **One main behaviour per test**; multiple soft assertions on the same outcome are fine.
- **Ideal:** avoid long linear scripts without breakpoints — split journeys so failures pinpoint the regression.

## Naming and organisation

- File names: **domain-oriented** (`vaccine.spec.ts`, `outpatient.spec.ts`), not `test1.spec.ts`.
- **Describe blocks** group by feature or epic; nested `describe` for roles or modes is fine if it clarifies.
- Reuse **route constants** (`config/routes.ts`) rather than string literals everywhere.

## Healthcare and privacy

- **No patient identifiable information** in logs, console output, or CI artifact naming.
- Do not log raw API responses containing PHI at INFO in CI.
- Align with broader rules: errors and reports should not leak sensitive clinical identifiers beyond what the test environment already exposes.

## What E2E is not (ideal boundaries)

- **Not a substitute for unit tests** for business rules, formatting, or validation matrices.
- **Not the place for bulk data generation** performance tests unless a dedicated scenario exists.
- **Visual pixel-perfect checks**: optional; if introduced, use dedicated snapshots or tools with clear tolerance and ownership.

## Aspirational / stretch practices

Use these as a north star when improving the suite:

- **Tags / projects** for `smoke` vs `full` so PRs can run a fast subset.
- **Multi-browser projects** (Firefox/WebKit) for journeys that differ by engine — enable when stable.
- **Lint/format** on spec files same as application code; optional `eslint-plugin-playwright` rules.
- **fixture.use** per file for role-specific storageState (read-only vs admin).
- **Bounded execution budget** per suite in CI (split shards if runtime grows).
- **Merge queue / main** gating on smoke E2E only; nightly full suite if needed.
- **Contract checks**: optional lightweight API checks shared with mobile/other clients — not full Playwright scope but complementary.

## References

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Test configuration](https://playwright.dev/docs/test-configuration)
- [Page object models](https://playwright.dev/docs/pom)
