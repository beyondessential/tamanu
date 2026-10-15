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
- ✅ **Migration timestamp regenerated** to a real epoch (was the hand-stamped `1792022400000`); still sorts last.

**Deviations / things to verify (surfaced for review):**
- **Patient portal → central, not facility.** The portal talks to `/api/portal` on central, so its telemetry ingest (`portal/public/telemetry`) and raw store live on **central**, not a facility server. Spec updated to say "the server the client talks to". Confirm this is acceptable, or defer portal telemetry.
- **Navigation params are positional** (`param1`, `param2`) via the same id-masking heuristic as request spans, not named (`patientId`) — getting named params needs react-router's route table, which the JSX `<Routes>` setup doesn't expose cleanly. Follow-up if named params are wanted.
- **Background tagging is minimal:** only `checkServerAlive` is tagged `background`. Tagging `useAutoUpdatingQuery` would wrongly exclude its initial page-load fetch; per-query background refinement is a follow-up.
- **Ingest endpoints are not rate-limited** (they follow the other `/public` routes; the strict auth limiter is wrong for frequent posts). A lenient per-IP limit + batch-size cap is a hardening follow-up; the batch-size cap (`TELEMETRY_MAX_BATCH_SIZE`) is already enforced.

**Still blocked — needs local DB credentials (facility test DB + migrated central DB):**
- **Facility integration tests** (ingest + prune) not run yet — need `tamanu-facility-test`.
- **dbt source models not regenerated** (`npm run dbt-generate-model` needs a migrated central DB). Outstanding: generate the `logs.browser_telemetry_spans` model, fill descriptions + masking (mask `parameters`), run `dbt-check-todos`. **Do before merge.**

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
- [ ] Update dbt source models under `database/model/` per `packages/database/CLAUDE.md` (`dbt-generate-model`, fill TODOs incl. masking for path/query, `dbt-check-todos`); commit with the migration. **(Outstanding — needs a local DB + node.)**

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
