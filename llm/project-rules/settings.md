# Settings - Tamanu

How runtime settings work, and how to read them. Settings are DB-backed and
editable in the admin panel. A setting with no stored value resolves to its
schema `defaultValue`.

## Schemas

Settings are declared as schema trees in `packages/settings/src/schema/`:

- `global.ts` — apply to every server (`globalSettings`)
- `central.ts` — central server only (`centralSettings`)
- `facility.ts` — facility server only (`facilitySettings`)

Each leaf has a `type` (yup) and usually a `defaultValue`; defaults are derived
with `extractDefaults()` (e.g. `facilityDefaults`). Useful leaf flags:
`exposedToWeb` / `exposedToPatientPortal` (sent to those frontends),
`secret`, `highRisk`, `deprecated`, `unit`, `suggesterEndpoint`.

**Scope a setting by where it is read:** only read on facility → put it in
`facility.ts`; only on central → `central.ts`; both → `global.ts`. Don't put a
facility-only setting in `global.ts`.

**Facility overrides.** A subtree may be declared in *both* `global.ts` and
`facility.ts`. `buildSettings` resolves values through a deep-merge cascade in
descending priority — facility-scope DB → global DB → facility defaults → global
defaults — so a facility value overrides the global one for that facility, while
the central reader sees only the global value. Use this when a globally-meaningful
value also needs a per-facility override (e.g. `fhir`, `appointments`,
`integrations`, `medications`, `templates`). The merge is deep, so the same
subtree can hold some keys defined globally and others per-facility.

## Reading settings

`ReadSettings.get('dot.path')` is **async** and returns the value merged over
its defaults. The reader is built per request by `settingsReaderMiddleware`,
but the shape differs by server:

- **Central** — `req.settings` is a single `ReadSettings`:
  ```js
  const value = await req.settings.get('export.maxFileSizeInMB');
  ```
- **Facility** — `req.settings` is keyed by facility id, **with no `.global`**:
  ```js
  const { settings } = req;
  const value = await settings[facilityId].get('tasking.upcomingTasksTimeFrame');
  ```
  A facility reader already merges `globalSettings`, so read global settings the
  same way. `facilityId` comes from the request the same way existing handlers
  get it (`query`/`body`); add it to the endpoint if it isn't there yet, and pass
  it from the web caller via `useAuth()` (see `DashboardTaskTable` / `TasksTable`).

Outside a request (tasks, sub-commands) the reader lives on the app context:
`context.settings` (central) or `context.settings[facilityId]` /
`context.settings.global` (facility — note the context object *does* have
`.global`, unlike `req.settings`).

Pre-auth/global reads with no facility construct one directly:
`new ReadSettings(req.models)` — only when no facility id is available (e.g. the
`browser-support` route). Prefer the request reader otherwise.

`get()` is async and reads from the DB, so settings can only be read from async
code that runs after startup — not from bootstrap/module-load code.
