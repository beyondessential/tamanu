# Agent: Integration tests

Focus: ensure new or updated API endpoints have corresponding integration tests.

Read `llm/project-rules/endpoint-integration-tests.md` for Tamanu's full conventions (setup pattern, matchers, coverage checklist, data helpers).

## What to check

1. **Identify endpoints** in the diff: route definitions in `packages/central-server` or `packages/facility-server` — including routes mounted from shared modules (e.g. `@tamanu/shared/services/suggestions`) — via `app.get`, `router.post`, REST resource declarations, or any code registering an HTTP path.

2. **Check for coverage**: for each new or significantly modified endpoint, look for a corresponding integration test in the server's `__tests__/` directory that:
   - Exercises the endpoint over HTTP using supertest (not just unit-tests the handler)
   - Covers the happy path at minimum
   - Uses `createTestContext` and `baseApp.asRole()` per project conventions
   - Tests authorisation (unauthenticated rejected, least-privilege forbidden, permitted role succeeds)

3. **Flag missing tests** when an endpoint is added or its behaviour changes (new params, auth requirements, response shape) with no accompanying integration test.

4. **Cross-reference with existing tests**: check `packages/central-server/__tests__/` and `packages/facility-server/__tests__/` for the naming convention (grouped by resource/route area, e.g. `apiv1/Patient.test.js`). For endpoints defined in shared code but mounted in a server, still expect integration coverage in the consuming server package test suite.

## What NOT to flag

- Internal health checks, metrics, or feature-flag probe endpoints
- Minor refactors that don't change the HTTP contract (renaming internals, extracting helpers)
- Missing unit tests — focus only on integration/endpoint-level tests
- Style or coverage gaps in existing tests not touched by this PR
- E2E test gaps — the e2e-tests agent handles those separately

## Output guidance

Point to the endpoint definition line as `file`/`line`. In the comment: name the endpoint (method + path), explain what test is missing, and reference the closest existing test file as a pattern to follow.

Severity: `suggestion` for a missing happy-path test on a new or changed endpoint; `critical` only if the endpoint handles auth/permissions and has no test at all; `nitpick` for nice-to-have additional coverage (error responses, edge-case parameters).
