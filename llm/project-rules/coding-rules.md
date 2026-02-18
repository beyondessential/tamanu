# Coding Rules - Tamanu

Domain-specific rules and antipatterns for Tamanu development. Follow these when writing code and check for them during review.

Also see `llm/project-rules/important-project-rules.md` for coding preferences and
`packages/database/CLAUDE.md` for migration patterns.

## Readability & Naming

Readability is the highest priority. Every line of code is read many times over its life — saving the reader cognitive cycles compounds massively.

- **Be specific with names.** The reader should instantly know what they're looking at without reading surrounding code. `numberOfDoors` not `count`, `doorWidth` not `dw`.
- **Avoid abbreviations** unless they're universally known (e.g. `id`, `url`, `html`). Variable names are minified out — there's no reason to abbreviate.
- **Use conventional hints.** `is`/`has`/`can`/`does` prefix for booleans, verb/action for functions, plural for arrays/sets.
- **`let` is a smell.** If a variable is being reassigned through conditionals, consider extracting a function that computes the value instead.
- **A function name containing "and" is a smell** — it's doing two things and should probably be split.

## Code Design

- **Avoid early abstractions.** Keep it concrete until you have evidence that generalisation is needed. Wrong abstractions are worse than duplication.
- **Chesterton's Fence:** understand why something exists before changing it. If code looks weird, there may be a valid reason — check git history or stop coding and ask for clarification.
- **Be wary of incidental changes to widely-used code.** Ask: why didn't this change need to happen before? Is the caller using the code in a non-standard way? Maybe a new, purpose-built component is better than modifying a shared one.
- **Defensive null checks in internal code are a smell.** Validation makes sense at system boundaries (API inputs, external data), but excessive null-guarding inside the app usually means the caller is sending invalid data — fix the source.
- **Don't use unstructured data** (e.g. a JSON blob with no schema) for anything important — it spreads the definition across the codebase and becomes increasingly hard to work with.
- **Limit concurrency.** Don't do things in parallel without a good reason, and when you do, cap concurrency (e.g. `async-pool`). We have a finite pool of DB connections and heavy contention can make latency spike or the system unstable.

## Antipatterns

### Migrations

- NEVER mix DDL and DML in the same migration (see `packages/database/CLAUDE.md`)
- Bulk UPDATEs trigger FHIR rematerialisation for every touched row — consider volume impact
- Write corresponding mobile (TypeORM) migrations alongside server (Sequelize) migrations

### Sync

- Never modify `updated_at_sync_tick` manually
- Changes to sync behaviour need multi-facility testing

### FHIR

- Changes to upstream models that feed FHIR resources need materialisation verification
- Bulk updates to upstream tables will trigger mass rematerialisation

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
- Clinical data should be soft-deleted or audited, never hard-deleted
- Status transitions must follow defined state machines
