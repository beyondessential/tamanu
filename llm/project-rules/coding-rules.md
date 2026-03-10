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

### Sync

- Never modify `updated_at_sync_tick` manually

### FHIR

- Bulk updates to upstream tables will trigger mass rematerialisation

## Multiple Timezone Support

Tamanu operates across facilities in different timezones while maintaining a single source of truth for datetime storage. All datetime values (timestamps representing specific moments in time) are stored in a server-wide **primary timezone** and displayed using the **facility timezone** where staff are located. This approach ensures consistent storage and querying while allowing correct local display. These rules apply to all datetime handling throughout the application.

**Date-only strings** (format `yyyy-MM-dd`, e.g. birth dates, appointment dates) represent calendar dates rather than specific moments in time. They are stored as-is and never converted between timezones — a birth date of `1990-05-15` means "15 May 1990" regardless of which facility views it. When these need to be used in datetime range queries (e.g. "appointments on 2024-03-15"), use `getDayBoundaries()` to convert them to the appropriate start/end timestamps in the correct timezone.

- Datetimes stored as ISO 9075 (`yyyy-MM-dd HH:mm:ss`), no suffix, always in the **primary timezone**
- Display timezone = `facilityTimeZone ?? primaryTimeZone`
- **Frontend:** Use helpers from `useDateTime()` for formatting, `getCurrentDateTime()`/`getCurrentDate()` for defaults, and `toStoredDateTime()` on submit.
- **Backend:** use `getDayBoundaries(date, primaryTimeZone, facilityTimeZone)` for date-range queries

## Conventions

- Australian/NZ English in all text: "finalise", "colour", "centre", "cancelled"
- User-facing strings must use `TranslatedText`, not hardcoded English
- Parameterised queries only — never interpolate user input into SQL
- Consider index usage for new queries on large tables

## Healthcare

- Patient data must never be logged at INFO level or above
- No patient identifiable information in error messages or stack traces
- All API endpoints must have permission checks (`req.ability.can()` + `req.flagPermissionChecked()`)
- No TODO or placeholder permission checks — raise for discussion instead
- Clinical data should be soft-deleted, never hard-deleted
