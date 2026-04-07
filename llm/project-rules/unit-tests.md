# Unit Tests — Tamanu

Ideal guidance for new tests. See `llm/project-rules/coding-rules.md` (readability, healthcare boundaries, timezones) and `llm/project-rules/playwright-e2e.md` (browser journeys).

## Goals

- **Prove behaviour, not implementation** — observable inputs and outcomes; stable across refactors.
- **Fast and deterministic** — no real network, wall-clock dependence, or random data without fixed seeds. Fake timers for time-based logic; control timezones when behaviour depends on facility vs primary storage (see `coding-rules.md`).
- **Isolated** — no order dependence; each test arranges its own state; clean up or use disposable entities so parallel runs stay safe.
- **Right layer** — heavy logic and validation in **unit** tests; **HTTP + app + DB** checks in server integration tests (supertest); **critical user paths** in Playwright, not duplicated in bulky UI unit tests.

## Framework per package

| Package | Framework |
|---------|-----------|
| `shared`, `central-server`, `facility-server`, `settings`, `fake-data`, `mobile` | **Jest** (`common.jest.config.mjs` + package `jest.config`) |
| `web`, `database`, `utils`, `upgrade` | **Vitest** |

Use one framework per package. Jest: `describe` / `expect` / `jest` as globals. Vitest: import `describe`, `it`, `expect`, `vi` from `vitest`.

## Layout and naming (target)

- **Prefer** `__tests__/` next to `src` (or `app`), mirroring source paths: e.g. `src/utils/x.js` → `__tests__/utils/x.test.js`.
- **Exception — `packages/mobile`:** tests colocate with source until that package standardises on `__tests__/`.
- **Suffix:** `.test.ts` / `.test.js` (`.spec` only where a package already standardises it, e.g. some mobile UI).

## Structure and naming

- **Describe** by unit or feature; **nest** for scenarios ( happy path, validation, permissions).
- **One focused behaviour per `it`** — several assertions on the same outcome are fine.
- **Titles** read as specs: *what* should happen under *which* condition — not internal method names.
- **Arrange → act → assert** — extract builders/helpers when setup repeats; keep helpers boring and explicit.

## Test data and fakes

- Prefer small factories or `fake` / shared helpers (`@tamanu/fake-data`, `@tamanu/shared/test-helpers`) over anonymous magic objects scattered across files.
- **Healthcare:** use synthetic identifiers and fake profiles only; do not use real patient details. Assertions on error payloads must not expect patient-identifiable data in messages (align with `coding-rules.md`).

## Mocking

- Mock **boundaries** (HTTP clients, email, external SDKs), not every collaborator. Prefer real instances when cheap.
- Reset or spy cleanup in `afterEach` where mocks leak. Vitest: `vi.resetAllMocks()` / `mockClear` as appropriate.

## Web (`packages/web`)

- Prefer **Testing Library** — queries tied to roles/labels users perceive; avoid snapshotting large component trees unless output is stable and high-value.
- Avoid asserting on **MUI/DOM structure** that changes without behaviour change; test outcomes users care about.

## Endpoint / route tests (`central-server`, `facility-server`)

Treat these as **integration tests** (real app + DB): `createTestContext`, `baseApp`, `supertest` agents (`asRole`, `asUser`). **Ideal coverage for a route:**

| Area | What to assert |
|------|----------------|
| **Validation** | Missing required fields, wrong types, empty body, malformed IDs — client error (see matchers below). |
| **Success contract** | Status success, body shape for the operation, persistence when the API promises it (read-back or DB check). |
| **CRUD** | Create returns resource + stores; read list/detail + filters/pagination if applicable; update changes intended fields and preserves others; delete removes or soft-deletes per product rules; repeat operations behave as specified (e.g. 404 on missing resource). |
| **Authorisation** | Unauthenticated rejected; **least-privilege** user forbidden; permitted role succeeds. Every route must reflect `req.ability` / permission checks (`important-project-rules.md` — no placeholder permission tests). |
| **Errors** | Use project matchers: `toHaveSucceeded`, `toBeForbidden`, `toHaveRequestError`, `toHaveStatus` where needed. **Facility:** `toHaveRequestError` is for client errors **excluding 403** (use `toBeForbidden` for 403). **Central:** `toHaveRequestError` may include 403 — know which server you are in. Prefer stable **machine-readable** error shapes / codes where the API defines them; avoid brittle substring matches on long prose. |
| **Edge cases** | Duplicate creates if uniqueness applies; boundary values; non-existent parent or child IDs. |

Keep endpoint files organised by **resource or route group**; share arrange helpers when many cases repeat.

## What belongs elsewhere

- **Playwright** for full stack and UX-critical flows (`playwright-e2e.md`); do not recreate the same journey only in supertest or only in E2E without a reason.
- **Trivial wiring** (pure re-exports, obvious getters) — skip unless a regression already happened.
- **Snapshots** of large or frequently edited UI — avoid.

## Running tests

- Package: `npm --workspace packages/<name> run test`. Root: `npm test` runs the repo’s test orchestration. See root `package.json` for shortcuts (`shared-test`, `web-unit-test`, etc.).
