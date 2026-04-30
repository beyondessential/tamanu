# Endpoint (integration) tests — Tamanu

Guidance for **HTTP route tests** in **`packages/central-server`** and **`packages/facility-server`**: real Express app, test database, **Jest** + **supertest**.

Granular **pure logic** belongs in package unit tests (`shared`, `utils`, etc.). **Critical user journeys** belong in Playwright — see `llm/project-rules/playwright-e2e.md`. These integration tests sit in between: **API contract**, **validation**, **permissions**, and **persistence**.

Also see `llm/project-rules/coding-rules.md` (healthcare boundaries, timezones) and `llm/project-rules/important-project-rules.md` (permissions must be real, not placeholder).

## Goals

- **Observable HTTP outcomes** — status, body shape, and side effects the API promises (including DB where relevant).
- **Deterministic data** — use `fake`, seed helpers, and disposable entities; no dependence on test order or shared mutable rows.
- **Isolation** — each case arranges what it needs; avoid “the third patient from demo data” assumptions.

## Layout and naming

- Tests live in **`__tests__/`** inside the server package, grouped by **resource or route area** (e.g. `apiv1/Patient.test.js`); mirror how routes are organised when it helps navigation.
- **`*.test.js`** / **`*.test.ts`** to match existing server suites.

## Setup pattern

```js
import { createTestContext } from './utilities';

describe('MyResource', () => {
  let baseApp;
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
  });

  afterAll(() => ctx.close());
});
```

- **`baseApp.asRole('practitioner')`** — authenticated agent with that role.
- **`baseApp.asRole('base')`** — useful **least-privilege** user for forbidden cases.
- **`baseApp.asUser(user)`** — specific user when roles alone are not enough.

Use the **agent** returned from `asRole` / `asUser` for `.get` / `.post` / `.put` / `.delete` with `.send()` as needed.

## Test data

- Prefer **`@tamanu/fake-data`** and **`@tamanu/shared/test-helpers`** over ad-hoc objects; keep payloads minimal but valid.
- **Healthcare:** synthetic identifiers and fake profiles only; do not use real patient data. Error assertions must not encode identifiable patient information in expected messages (`coding-rules.md`).

### Central defaults in `fake` (avoid repeating boilerplate)

When many integration tests pass the **same** field values only to satisfy the schema or to represent a normal row (e.g. `createdTime` set to “now” in primary datetime format, empty `metadata: {}`), **add those values to the model’s entry in `MODEL_SPECIFIC_OVERRIDES`** in `packages/fake-data/src/fake/fake.ts` instead of listing them in every `fake(models.SomeModel, { ... })` call.

- **`fake(model, overrides)`** still merges **test-specific** fields last: use the second argument only for what the case actually asserts (different user, status, a deliberately old timestamp for time-window behaviour, etc.).
- **Do not** push values into `MODEL_SPECIFIC_OVERRIDES` when most tests need different values or when randomness is important; keep those explicit in the test or in a local helper.
- Match storage conventions the product expects (e.g. primary datetime strings via shared utilities where plain `fakeDateTimeString` is wrong for that column).

## Coverage checklist (per route or feature group)

| Area | What to assert |
|------|----------------|
| **Validation** | Missing required fields, wrong types, empty body, malformed IDs — client error (matchers below). |
| **Success contract** | Success status; response body matches the operation; persistence when the API implies it (read-back or DB). |
| **CRUD** | Create returns and stores; list/detail reads; filters/pagination if applicable; update changes intended fields and preserves others; delete matches product rules (hard vs soft); repeat calls behave as specified (e.g. 404). |
| **Authorisation** | Unauthenticated rejected; least-privilege user **forbidden**; permitted role **succeeds**. Every route must exercise real permission checks (`important-project-rules.md`). |
| **Errors** | Use project matchers. **Facility:** `toHaveRequestError` = 4xx **except 403** (use `toBeForbidden` for 403). **Central:** `toHaveRequestError` may include 403 — know which server you are in. Prefer stable **machine-readable** error shapes or codes; avoid brittle long-message substring matches. |
| **Edge cases** | Duplicate creates if uniqueness applies; boundary values; missing parent/child resources. |

Share **arrange** helpers within a file or `__tests__` utilities when many cases repeat.

## Matchers (quick reference)

- **`toHaveSucceeded()`** — status &lt; 400
- **`toBeForbidden()`** — 403
- **`toHaveRequestError()`** — client error semantics (see facility vs central note above)
- **`toHaveStatus(n)`** — exact status when required
- **`toMatchObject`** / **`body.error.message`** — only when stable enough to maintain

## Relation to other test layers

- **Do not** replace every Playwright journey with integration tests, or vice versa: use integration tests for **API behaviour and permissions**; E2E for **multi-step UI flows** that are business-critical.
- **Do not** put **pure functions** or **shared** utilities here — test them in their package with faster unit tests.

## Running tests

- `npm --workspace @tamanu/central-server run test` or `@tamanu/facility-server` (see root `package.json` for shortcuts such as `central-test`, `facility-test`).
