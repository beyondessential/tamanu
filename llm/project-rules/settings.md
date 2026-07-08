# Settings - Tamanu

How to work with settings in code. Product behaviour — scopes, resolution,
live-apply, exposure, config vs settings — is specified in
`specs/administration/settings/`; this is the how-to-code companion. Settings are
DB-backed, editable in the admin panel, and resolve to a schema `defaultValue`
when unset.

## Schemas

Settings are declared as schema trees in `packages/settings/src/schema/`:

- `global.ts` — apply to every server (`globalSettings`)
- `central.ts` — central server only (`centralSettings`)
- `facility.ts` — facility server only (`facilitySettings`)

Each leaf has a `type` (yup) and usually a `defaultValue`; defaults are derived
with `extractDefaults()` (e.g. `facilityDefaults`). Useful leaf flags:
`exposedToWeb` / `exposedToPatientPortal` (sent to those frontends),
`secret`, `highRisk`, `deprecated`, `unit`, `suggesterEndpoint`.

A `secret: true` leaf must **not** declare a `defaultValue` (a schema test
enforces this). Its value is stored encrypted and masked in the UI (see
`specs/administration/settings/secret-encryption.md`); read it with
`getSettingSecret(settings, 'dot.path')`, which decrypts — a plain `get()`
returns the raw encrypted blob (see `ai.anthropicApiKey`,
`integrations.dhis2.password`).

**Scope a setting by where it is read:** only read on facility → put it in
`facility.ts`; only on central → `central.ts`; both → `global.ts`. Don't put a
facility-only setting in `global.ts`.

**Facility overrides.** To let a global value also take a per-facility override,
declare the subtree in *both* `global.ts` and `facility.ts` — `buildSettings`
deep-merges the scopes (resolution rule in `specs/administration/settings/`), so
the same subtree can hold some keys globally and others per-facility (e.g.
`fhir`, `appointments`, `integrations`, `medications`, `templates`).

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

**Prefer threading over constructing.** Pass what's needed down from a caller that
already has a reader — either the reader itself, or the resolved value (model
methods usually take the value, e.g. a number, not a reader). Constructing
`new ReadSettings(models)` is a fallback for code deep in `@tamanu/database` /
`@tamanu/shared` (both depend on `@tamanu/settings`, so the import is fine) that
only has `models` and can't reasonably be threaded a reader.

`get()` is async and reads from the DB, so settings can only be read from async
code that runs after startup — not from bootstrap/module-load code.

## Settings, not config files

New configurable values belong in the settings schema, **not** in the
`config/*.json5` files. Config is reserved for deployment/bootstrap concerns
that must be read synchronously before settings are available — DB connection,
`serverFacilityId`, crypto key paths, ports. Anything an operator might tune at
runtime should be a setting: it's DB-backed, admin-editable, and per-facility
where needed, none of which a config file can do.
