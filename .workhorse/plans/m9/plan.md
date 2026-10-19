# M9 — Browser performance telemetry

Implementation plan for the [Browser performance telemetry](../../../specs/platform/browser-telemetry.md) spec (`BTEL`). Scope is browser capture → write to a raw table on the facility server. Aggregation, central sync, and Canopy reporting are separate tickets.

New code should carry `// spec: BTEL` traceability comments (see `CleanupIdempotencyKeys` / `// spec: IDEM` for the convention).

## Architecture at a glance

- **Request spans** are instrumented once in the shared `@tamanu/api-client` (`TamanuApi.fetch`), which both the clinical web app and the patient portal extend — so all three interfaces are covered from one seam.
- **Navigation traces + batching + OTel setup** live in a shared browser module in `@tamanu/ui-components` (both apps already depend on it). Each app wires it in at bootstrap and hooks its own router.
- **Ingest + raw store + retention** live on the facility server: an unauthenticated-tolerant apiv1 route, a `logs`-schema `DO_NOT_SYNC` model (modelled on `AccessLog`), and a `ScheduledTask` prune job (modelled on `CleanupIdempotencyKeys`).

## Build status

Implemented across all layers (first pass). Shared module home: `@tamanu/ui-components` (confirmed).

**Local verification (run on the paired device, 2026-10-15):**
- ✅ **Lint** clean on all 39 changed files (`eslint`, exit 0).
- ✅ **Build** of web-frontend and patient-portal clean (`npm run build`, exit 0) — confirms the OTel SDK wiring (`WebTracerProvider` + `addSpanProcessor` + `BatchSpanProcessor`) bundles against the installed `@opentelemetry/*` versions.
- ✅ **Unit tests** pass: ui-components collector (quiet/abandon/cap) + path masking — 10/10 (`vitest run src/telemetry`).
- ✅ **Facility integration tests** pass: ingest (unauthenticated + authenticated + malformed/oversized) and prune — 6/6 (`vitest run __tests__/telemetry.test.js __tests__/tasks/CleanupBrowserTelemetry.test.js`).
  - **Bug found and fixed by running them:** both ingest routes used `z.record(z.any())`, which is invalid under zod v4 (needs a key schema) and threw a 500 on every batch. Fixed to `z.record(z.string(), z.any())` in the facility and central portal routes.
- ✅ **Migration timestamp regenerated** to a real epoch (was the hand-stamped `1792022400000`); still sorts last.
- ✅ **dbt source models regenerated** (`dbt-generate-model` against a fresh `tamanu-generate-model` DB): `database/model/logs/browser_telemetry_spans.{yml,md}` created, descriptions filled, `parameters` masked `empty` (the convention for sensitive jsonb). `dbt-check-todos` clean.

**Review round 2 — central-side completion (Cursor Bugbot, all six confirmed and fixed):**

The feature was built facility-first, then admin and portal were wired in without completing the central side. That one root cause produced most of the findings:

- **Ingest logic extracted to shared.** The validation + insert now live in one factory, `@tamanu/shared/utils/browserTelemetryIngest` (`createBrowserTelemetryIngest`), that all three call sites use (facility apiv1, central portal, central public) — differing only in the facility they stamp. No more three copies to keep in step.
- **Admin telemetry had no ingest.** The admin panel talks to *central*, but central only mounted telemetry under `/api/portal/...`, so every admin batch 404'd silently. Added `POST /public/telemetry` to central's `publicRoutes`.
- **Central never pruned.** Spans stored on central grew unbounded. `CleanupBrowserTelemetry` moved to `@tamanu/shared/tasks` (the `SendStatusToMetaServer` precedent) and registered on central, with a matching `schedules.cleanupBrowserTelemetry` in `central.ts`.
- **`telemetry.enabled` was facility-scoped** but is read by central-connected clients. Moved to `global.ts`, matching the other `exposedToPatientPortal` settings and the repo's scope-by-where-it's-read rule.
- **Portal ignored the setting** — it passed no `isEnabled`. Wired through a module flag the portal's `SettingsProvider` syncs.
- **Portal never recorded a user** — its `tokenLogin`/`restoreSession` never set `api.user`. Added `fetchCurrentUser()`, used by `useCurrentUserQuery`, so both paths populate it.
- **`keepalive` on every POST** — browsers cap keepalive bodies at 64 KiB, so the busiest batches were silently dropped. Now set only for the unload flush. Also capped `maxExportBatchSize` to `TELEMETRY_MAX_BATCH_SIZE`: the SDK default (512) exceeded our own ingest limit (500), so a full batch was refused.
- **Same-URL screen swaps** — `App` swaps login/facility-selection in at the same URL, so the post-login load never started a navigation. The route listener now also depends on the auth gates.

Also folded in: the three near-identical ingest handlers are now one shared `@tamanu/shared/utils/browserTelemetryIngest`.

**Review round 3 (Review Hero) — fixed:**
- **Route words were being masked.** `OPAQUE_RE` matched any 16+ char segment, so `medicationRequests`, `labTestPanelRequests`, `invoice-price-lists` and six other real routes became `:param1`, fragmenting `route` — the key everything groups by. Now requires a digit, which route words (camelCase or kebab-case) don't carry. Regression tests added.
- **Retention was evadable.** The prune aged rows by the browser-reported `occurredAt`, so a client could post a far-future date and keep rows forever. Now ages by the server-stamped `createdAt` (index added, migration amended); test added for the future-dating case.
- **Unbounded prune DELETE.** On a table this size one statement means a long transaction and a WAL spike; now deletes in bounded batches.
- **`occurredAt` accepted any non-empty string**, so a non-date reached Postgres and surfaced as a 500 from a public endpoint. Now validated as a datetime; `statusCode` bounded to 100–599.
- **Unload flush could exceed the keepalive budget.** Capped at 100 spans so the final flush fits under the 64 KiB limit instead of being rejected whole.
- **Two weak tests.** `expect(facilityId !== undefined).toBe(true)` passed even when nothing was stamped (now asserts the configured facility), and the "authenticated batch" case never authenticated (now does, and is named for what it checks).
- **Portal mount untested.** Added `central-server/__tests__/patientPortalApi/telemetry.test.js`.

**Review round 3 — rejected, with evidence:**
- *"`readTelemetryEnabled` reads a localStorage key nothing writes, so the gate is dead."* Incorrect: `web/app/api/TamanuApi.jsx:101` writes `SETTINGS`, destructured from the same `LOCAL_STORAGE_KEYS`. The gate works; absence pre-login is the intended default-on window.
- *"The ingest endpoint has no per-IP rate limit."* Incorrect: `createApiApp` applies `limiters.globalLimiter` at `/`, covering every route at 600 req/min per IP by default. Telemetry posts ~4/min. A dedicated stricter limiter stays a hardening follow-up.
- *"`BatchSpanProcessor` leaves `maxExportBatchSize` at the default."* Already fixed in round 2.
- *"The portal ignores `telemetry.enabled`, and the setting is facility-only."* Both already fixed in round 2.

**Open question for review (not actioned):**
- **`userId` is taken from the client payload**, so an anonymous caller could attribute telemetry to any user. The reviewer suggested stamping it from auth context, but that premise doesn't hold here: the route is deliberately mounted *ahead* of `authMiddleware` so pre-login navigations are captured, so there is no `req.user` to read. Fixing it properly means adding optional token verification to a public, high-frequency endpoint — a change to its auth posture worth an explicit decision rather than a unilateral one.

**Rebased onto P10 (explicit API path templates):**
- Rebased the branch onto main after #P10 landed. #P10 added `route('patient/:patientId/allergies', { patientId })`, which keeps the template and params together down to `TamanuApi.fetch`.
- **Request spans now use the real template when the call site used `route()`.** The api-client telemetry `start` edge carries `route` (the template) and `pathParams` (resolved values) when the endpoint is a `RouteDescriptor`; the collector uses them directly and only falls back to the `genericiseApiPath` heuristic for plain-string endpoints not yet migrated. So request-span params are now *named* (`:patientId`), not positional, wherever `route()` is used — and the `village-Nasaga`-style mis-grouping disappears for those calls.
- Collector tests added for both the explicit-template path and the heuristic fallback.

**Deviations / things to verify (surfaced for review):**
- **Navigation params are still positional** (`param1`, `param2`) via the `genericiseApiPath` heuristic on the pathname. #P10 covers API calls, not react-router, so navigation spans don't benefit from it; named navigation params still need the router's route table, which the JSX `<Routes>` setup doesn't expose cleanly. Follow-up if wanted.
- **Request spans fall back to the heuristic for any call site still passing a plain string** (the heuristic is retained for exactly this). Fully named request params depend on how much of the codebase has adopted `route()`.
- **Background tagging is minimal:** only `checkServerAlive` is tagged `background`. Tagging `useAutoUpdatingQuery` would wrongly exclude its initial page-load fetch; per-query background refinement is a follow-up.
- **Ingest endpoints are not rate-limited** (they follow the other `/public` routes; the strict auth limiter is wrong for frequent posts). A lenient per-IP limit + batch-size cap is a hardening follow-up; the batch-size cap (`TELEMETRY_MAX_BATCH_SIZE`) is already enforced.

**Remaining follow-ups (not blockers for this card):**
- Two owed tests: api-client sink unit (api-client has no vitest setup yet) and a sync/changelog-exclusion guard test.
- A fresh-eyes spec review.

## 1. Request instrumentation — `@tamanu/api-client`

- [x] In `packages/api-client/src/TamanuApi.ts`, time each `fetch()` call (start before `fetcher(...)`, settle on resolve/reject) and emit a structured event — method, `endpoint` path, raw `query`, response status, success/error, duration.
- [x] Emit request-start and request-settle events (or maintain an in-flight counter) so the navigation collector can compute network-quiet; settle must fire on both success and error paths.
- [x] Add an optional telemetry sink to `TamanuApiConfig` (a callback), so the client stays free of OTel/app concerns and the collector subscribes to it.
- [x] Add a `background?: boolean` flag to `FetchOptions`, carried onto the emitted event, so polling requests can be excluded from the quiet calculation.

## 2. Shared browser-telemetry collector — `@tamanu/ui-components`

- [x] Add OTel web deps to the package: `@opentelemetry/api`, `@opentelemetry/sdk-trace-web`, `@opentelemetry/sdk-trace-base`.
- [x] Set up a `WebTracerProvider` with a `BatchSpanProcessor` and a **custom `SpanExporter`** that POSTs batched spans to the facility-server ingest endpoint through the app's `TamanuApi` instance (best-effort: swallow failures, drop the batch, no infinite retry).
- [x] Flush on `pagehide` / `visibilitychange` via `navigator.sendBeacon` so an abrupt tab close loses at most the current buffer.
- [x] Navigation tracer:
  - [x] Start a navigation root span on route change; its route pattern + full path come from the app's router hook.
  - [x] Open a child span per request from the api-client sink, parented to the active navigation.
  - [x] End the navigation when non-`background` in-flight count has been zero for the quiet window; record outcome `settled`.
  - [x] Abandon the in-progress navigation on the next route change (outcome `abandoned`); do not attribute it to the next route.
  - [x] End via a hard max-duration cap if it never goes quiet (outcome `capped`).
- [x] Attach span attributes: interface (clinical/admin/portal), app version, device id, user id + session (when authenticated; device-only before sign-in), full path incl. query, route pattern, method, status, nav outcome.
- [x] Gate the whole collector on the exposed `telemetry.enabled` setting — a no-op (no spans, no exporter) when off.

## 3. Per-interface wiring

- [x] Clinical web + admin (`packages/web/app/index.js`): initialise telemetry at bootstrap alongside Bugsnag; subscribe the collector to the `API` singleton's sink; hook react-router location changes (in `Root.jsx` / `RoutingApp.jsx`) to start/abandon navigations with the matched route pattern.
- [x] Patient portal (`packages/patient-portal/src/main.tsx`): same init on its `TamanuApi` and router.
- [x] Tag known recurring/background requests with `{ background: true }` so they don't block settle: `useCheckServerAliveQuery` (`refetchInterval`), `useAutoUpdatingQuery`, and any notifications poll.

## 4. Facility-server ingest endpoint

- [x] Add an apiv1 route (e.g. `telemetry/browser`) accepting a batch of spans; mount it to tolerate unauthenticated requests (follow the `public/*` / `browser-support` pre-auth pattern), reading the user from auth context when a token is present.
- [x] Stamp each row server-side with facility id and received time; take trace id, parent, kind (navigation/request), path, route pattern, method, status, duration, outcome, device, session, version, user from the payload.
- [x] Validate the payload shape and cap batch size; respond cheaply (202/204) and never surface server internals. Patient data must not be logged at INFO+ (telemetry paths may hold search terms).

## 5. Raw store — model + migration (`@tamanu/database`)

- [x] Add a flat Sequelize model (one row per span) in `packages/database/src/models/`, `logs` schema, `syncDirection: DO_NOT_SYNC` — modelled on `AccessLog`. Model `BrowserTelemetrySpan`, table `logs.browser_telemetry_spans`. Columns: `id`, `trace_id`, `parent_id` (null for a navigation root), `kind` (`navigation`/`request`), `route` (generic pattern — the grouping key), `parameters` (JSONB `{ path: {...}, query: {...} }` — resolved values, path fillers kept apart from query params), `method` + `status_code` (requests only, nullable), `duration_ms`, `outcome` (navigations only: `settled`/`abandoned`/`capped`), `interface`, `device_id`, `session_id` (nullable), `app_version`, `user_id` (nullable), `facility_id` (server-stamped), `occurred_at`. The concrete path is not stored — it is derivable from `route` + `parameters`.
- [x] Register the model in the models index.
- [x] Generate the migration with `npm run create-migration -- addBrowserTelemetry...` (DDL only; never hand-write the timestamp). No mobile/TypeORM migration — browser-only.
- [x] Add an index supporting the retention delete (occurred-at) and any expected read.
- [x] Update dbt source models under `database/model/` per `packages/database/CLAUDE.md` (`dbt-generate-model`, fill TODOs incl. masking for path/query, `dbt-check-todos`); commit with the migration. `logs.browser_telemetry_spans.{yml,md}` generated, descriptions filled, `parameters` masked `empty`; `dbt-check-todos` clean.

## 6. Retention prune task (`packages/facility-server/app/tasks`)

- [x] Add `CleanupBrowserTelemetry extends ScheduledTask` (template: `CleanupIdempotencyKeys`) that deletes rows older than the configured retention period.
- [x] Register it in `DEFAULT_TASK_CLASSES` in `tasks/index.js`.
- [x] Add its schedule + retention to `schedules` in the facility settings schema, following `fhirErroredJobCleaner` (a `scheduledTaskSchema` with a `retentionDays` property), defaulting to ~30 days.

## 7. Settings (`@tamanu/settings`)

- [x] Add `telemetry.enabled` to the facility schema (`facility.ts`), `exposedToWeb: true`, `defaultValue: true` (PM can later flip the default to opt-in).
- [x] Retention period lives on the prune task's `schedules` entry (step 6).
- [x] Confirm `telemetry.enabled` reaches the browser through the front-end settings the client already loads (`settings/frontEnd` / `exposedToWeb`), and that the collector reads it.

## 8. Tests

- [x] Unit (collector): quiet-settle logic — settles after the quiet window; ignores `background` requests; abandons on navigate-away; caps when never quiet; outcome recorded correctly.
- [ ] Unit (api-client): the sink emits one event per request with method/path/query/status/duration and the `background` flag; settle fires on error responses too. **(Outstanding — api-client has no vitest setup yet.)**
- [x] Integration (facility-server, supertest): ingest endpoint accepts an **unauthenticated** batch and an **authenticated** batch (latter carries user); writes the expected rows; stamps facility; rejects malformed and oversized batches.
- [x] Integration (facility-server): prune task deletes only rows older than the retention period.
- [ ] Integration/schema: the raw model does not sync (`DO_NOT_SYNC`) and is not changelogged. **(Outstanding — covered by config today; a guard test would lock it in.)**
