# Coding Rules - Tamanu

Domain-specific rules and antipatterns for Tamanu development. Follow these when writing code and check for them during review.

Also see `llm/project-rules/important-project-rules.md` for coding preferences and
`packages/database/CLAUDE.md` for migration patterns.

## Readability & Naming

Readability is the highest priority. Every line of code is read many times over its life — saving the reader cognitive cycles compounds massively.

- **Be specific with names.** The reader should instantly know what they're looking at without reading surrounding code. `numberOfDoors` not `count`, `doorWidth` not `dw`. Single-letter variables are fine in short inline callbacks (e.g. `.map(f => f.name)`) where the collection name provides context.
- **Avoid abbreviations** unless they're universally known (e.g. `id`, `url`, `html`). Variable names are minified out — there's no reason to abbreviate.
- **Use conventional hints.** `is`/`has`/`can`/`does` prefix for booleans, verb/action for functions, plural for arrays/sets.
- **`let` is a smell.** If a variable is being reassigned through conditionals, consider extracting a function that computes the value instead.
- **A function name containing "and" is a smell** — it's doing two things and should probably be split.

## Code Design

- **Avoid early abstractions.** Keep it concrete until you have evidence that generalisation is needed. Wrong abstractions are worse than duplication.
- **Chesterton's Fence:** understand why something exists before changing it. If code looks weird, there may be a valid reason — check git history or stop coding and ask for clarification.
- **Be wary of incidental changes to widely-used code.** Ask: why didn't this change need to happen before? Is the caller using the code in a non-standard way? Maybe a new, purpose-built component is better than modifying a shared one.
- **Defensive null checks in internal code are a smell.** Validation makes sense at system boundaries (API inputs, external data), but excessive null-guarding inside the app usually means the caller is sending invalid data — an assertion throwing an error is better so it is easily understood and can be fixed at source if it comes up.
- **Don't use unstructured data** (e.g. a JSON blob with no schema) for anything important — it spreads the definition across the codebase and becomes increasingly hard to work with.
- **Limit concurrency.** Don't do things in parallel without a good reason, and when you do, cap concurrency (e.g. `async-pool`). We have a finite pool of DB connections and heavy contention can make latency spike or the system unstable.

## Antipatterns

### Migrations

- NEVER mix DDL and DML in the same migration (see `packages/database/CLAUDE.md`)
- Bulk `UPDATE`s trigger FHIR rematerialisation for every touched row — consider volume impact
- Write corresponding mobile (TypeORM) migrations alongside server (Sequelize) migrations
- Schema changes (added/removed/changed tables or columns) require updating the dbt source models in `database/model/` — see `packages/database/CLAUDE.md`
- Adding a new **importable reference-data type** (a new `reference_data` type, or anything added to `OTHER_REFERENCE_TYPES` that flows into `GENERAL_IMPORTABLE_DATA_TYPES`) makes it **required by the provisioning completeness check** (`validateFullReferenceDataImport` in `provision.js`). You must either add a matching `packages/central-server/app/subCommands/defaultProvisioningData/<Sheet>.json5` (with at least one data row) **or** add it to `EXCLUDED_FROM_FULL_IMPORT_CHECK` if it's optional — otherwise `provision` throws and the deploy's central-provisioner job fails (central-api never starts).

### Queries

- **Bound the work by what the response returns.** If a query pages its output, its joins and aggregates must be scoped to that page too. A CTE bounded by the parent record (an encounter, a patient) rather than the page does work proportional to that record's entire history, so it degrades worst for the longest-staying patients — the ones whose data is most needed. Watch for an aggregate computed over a wider set than the page and then discarded by the outer join.
- **Justify every `logs.changes` read.** The changelog is the largest table in most deployments, grows with every write, and is never pruned on facility servers. Reading it on a page-load path needs a stated reason why the same fact cannot come from the domain tables instead — usually it can, via a column like `edited_time`. Prefer adding the column.
- **A `logs.changes` read needs a predicate an index can actually serve.** `record_id` is indexed with a **hash** index on facility servers, so equality only — not `IN` lists, and not if you cast it (`record_id::uuid`). Filtering on a `record_data` extraction (`record_data->>'x'`) is unindexed; the GIN index on `record_data` cannot serve `->>`. `table_name` on its own is no help either: the index is on the concatenated `table_schema || '.' || table_name`, which a bare column filter cannot match. Anything else is a sequential scan of the whole table.
- **Name the index in the PR, or say why a scan is acceptable.** For new or changed queries on large tables (`logs.changes`, `survey_response_answers`, `notes`, `encounters`, `sync_lookup`), work out the index when designing the feature, not after a site reports slowness. Migrations run in downtime, so a plain `addIndex` is cheap.
- **Read the plan against realistic volume, not seed data.** Real cost is query cost multiplied by contention: a query that is comfortable on a dev database can take minutes on a busy facility server, where a small `work_mem` spills aggregates to disk.

### Sync

- Never modify `updated_at_sync_tick` manually

### FHIR

- Bulk updates to upstream tables will trigger mass rematerialisation

### Frontend

- **Never put interaction event handlers on static elements.** For navigation, prefer `<a>` with an `href` attribute (or abstractions of it like `<Link>`). In other cases, use a semantic `<button>`. e.g. A `<div>` or `<span>` should never have an `onClick` handler. If an element has button semantics but absolutely needs to not look like one, make a `styled(UnstyledHtmlButton)`.
- **Huge modules.** React function components should be small and composable. There is no hard threshold; but if a component reaches 400 lines it is too big, and likely has at least a few opportunities to be split into manageable parts.
- **Effects.** Unless syncing React state with an external store, an Effect is almost certainly the wrong tool. If simply exploiting that Effects run when a dependency changes, consider how it can be achieved within the React render lifecycle. e.g. `const [prev, setPrev] = useState(); if (curr !== prev) respondToPropChange();`. Effects are a last resort.
- **Avoid props that mirror ARIA roles.** e.g. Prefer `aria-expanded` over a custom `isExpanded` prop.
- **Be judicious with transient props.** For ad-hoc styling, prefer providing an inline `style` over a custom transient prop whose sole purpose is to apply one or two CSS properties.

## Multiple Timezone Support

Tamanu operates across facilities in different timezones while maintaining a single source of truth for datetime storage. All datetime values (timestamps representing specific moments in time) are stored in a server-wide **primary timezone** and displayed using the **facility timezone** where staff are located. This approach ensures consistent storage and querying while allowing correct local display. These rules apply to all datetime handling throughout the application.

**Date-only strings** (format `yyyy-MM-dd`, e.g. birth dates, appointment dates) represent calendar dates rather than specific moments in time. They are stored as-is and never converted between timezones — a birth date of `1990-05-15` means "15 May 1990" regardless of which facility views it. When these need to be used in datetime range queries (e.g. "appointments on 2024-03-15"), use `getDayBoundaries()` to convert them to the appropriate start/end timestamps in the correct timezone.

- Datetimes stored as ISO 9075 (`yyyy-MM-dd HH:mm:ss`), no suffix, always in the **primary timezone**
- Display timezone = `facilityTimeZone ?? primaryTimeZone`
- **Frontend:** Use helpers from `useDateTime()` for formatting, `getCurrentDateTime()`/`getCurrentDate()` for defaults, and `toStoredDateTime()` on submit.
- **Backend:** use `getDayBoundaries(date, primaryTimeZone, facilityTimeZone)` for date-range queries

## Conventions

- Australian/NZ English in all text: "finalise", "colour", "centre", "cancelled"
- All user-facing strings (including prop values like titles, labels, toasts) must be wrapped in `TranslatedText` / `TranslatedEnum` / `TranslatedReferenceData` — see @llm/project-rules/translations.md
- Parameterised queries only — never interpolate user input into SQL

## Healthcare

- Patient data must never be logged at INFO level or above
- No patient identifiable information in error messages or stack traces
- All API endpoints must have permission checks (`req.ability.can()` + `req.flagPermissionChecked()`)
- No TODO or placeholder permission checks — raise for discussion instead
- Clinical data should be soft-deleted, never hard-deleted
