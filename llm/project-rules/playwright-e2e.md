# Playwright E2E tests — Tamanu

Guidance for writing and maintaining end-to-end tests in **`packages/e2e-tests`**. This describes an **ideal** target state; the existing suite may not match every point yet.

Also see `llm/project-rules/coding-rules.md` (readability, healthcare boundaries) and `llm/project-rules/important-project-rules.md`.

## Goals of E2E tests

- **Prove critical user journeys** in a running stack, not every edge case.
- **Fail for the right reasons**: behaviour regressions, not timing, selectors, or shared data.
- **Stay maintainable**: stable abstractions, one obvious place to update when the UI changes.

Prefer **fewer, higher-value E2E tests** and push granular logic to unit/integration tests where possible.

## Package layout

Everything lives under **`packages/e2e-tests`**:

- **`tests/`** — only Playwright specs (`*.spec.ts`). Group by product area (`tests/patients/`, `tests/scheduling/`). `tests/setup/` is for global setup only (auth state, etc.).
- **`pages/`** — page object classes. One class per screen or sub-area. Mirror the app structure so people can find the object matching the UI they're looking at.
- **`fixtures/`** — `test.extend` wiring: API context, seed data (patient, encounter), page object instances.
- **`utils/`** — shared non-POM code: API helpers, data factories, date/string helpers.
- **`config/`** — routes, URL patterns, non-secret defaults.
- **`types/`** — shared TypeScript types for entities and API responses.

## Developing new tests

Use **playwright-cli** to explore the live app before writing page objects. This is faster and more reliable than reading source code to guess test IDs.

**Workflow:**

1. **Snapshot the live page** — open the target screen in a headed session, then `snapshot` to see rendered elements and their `data-testid` values. Don't guess from source.
2. **Build the page object** — use the test IDs from the snapshot to define locators in `pages/`.
3. **Arrange via API** — seed data (patient, encounter) via `utils/apiHelpers.ts` so tests start from a known state.
4. **Write the spec** — call page object methods; keep specs short (arrange → act → assert).

```bash
# Always run from the repo root
npm run e2e-playwright-cli -- open http://localhost:5173 --headed
# Sign in interactively, navigate to the target screen, then:
npm run e2e-playwright-cli -- snapshot
npm run e2e-playwright-cli -- snapshot --depth 3   # drill into a subtree
npm run e2e-playwright-cli -- click e15             # interact by element ref
npm run e2e-playwright-cli -- --help                # full command list
```

The `--` separates npm args from playwright-cli args. Output goes to `packages/e2e-tests/.playwright-cli/` (gitignored).

For auth, use `state-save` / `state-load` to persist sessions across CLI invocations rather than logging in every time.

## Page Object Model

- **One class per screen or cohesive sub-area**. Compose larger flows from smaller objects.
- **Expose actions**, not just elements: `submitReferral()` not only `submitButton`.
- **Encapsulate selectors** in one place — when the UI changes, fix in the page object, not across specs.

### Locator strategy (priority order)

1. **`data-testid`** — best stability. Discover actual values via `playwright-cli snapshot`, not source reading.
2. **Role + accessible name** — `getByRole('button', { name: 'Save' })`.
3. **User-visible text** — `getByText`, `getByLabel` — when stable and not subject to translation changes.
4. **CSS/XPath** — last resort; document why if unavoidable.

## Fixtures and test structure

- **Custom fixtures** (`test.extend`): inject `api` context, seed data, page object instances so specs stay short and teardown is automatic.
- **`beforeEach`**: per-test navigation / UI state reset.
- **`beforeAll`**: expensive one-time setup — use sparingly; prefer fixtures for per-test resources.
- Each test should get **fresh, isolated data** (own patient, own encounter) to avoid order-dependence.

## API usage

- **API to arrange** (create patient, encounter, seed data), **UI to act and assert** — faster and less flaky than doing everything through clicks.
- Keep HTTP helpers in `utils/apiHelpers.ts`, not in specs.

## Assertions and waiting

- Prefer Playwright **auto-waiting** (`expect(locator).toBeVisible()`, `toHaveText()`) over `waitForTimeout()`.
- Use **`expect.poll`** for async backend-dependent state.
- Avoid fixed sleeps; if unavoidable, add a comment explaining why and a follow-up to remove it.

## Flakiness

- Don't share mutable entities between parallel tests.
- Don't rely on default sort order — sort explicitly when a test needs "first row".
- CI retries masked race conditions — fix the wait/assertion rather than relying on retry to pass.

## Spec structure (ideal)

```typescript
test.describe('Feature area', () => {
  test.beforeEach(async ({ bedManagementPage }) => {
    await bedManagementPage.goto();
    await bedManagementPage.waitForPageToLoad();
  });

  test('[ID-0001] completes happy path', async ({ page, patientDetailsPage, newPatient }) => {
    // arrange (minimal — usually done by fixture)
    // act — page object methods only
    // assert — user-visible outcomes
  });
});
```

- File names: domain-oriented (`vaccine.spec.ts`), not `test1.spec.ts`.
- Use route constants from `config/routes.ts` rather than string literals.

## References

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Page object models](https://playwright.dev/docs/pom)
- [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli)
