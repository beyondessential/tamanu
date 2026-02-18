# Coding Rules - Tamanu

Domain-specific rules and antipatterns for Tamanu development. Follow these when writing code and check for them during review.

Also see `llm/project-rules/important-project-rules.md` for coding preferences and
`packages/database/CLAUDE.md` for migration patterns.

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
