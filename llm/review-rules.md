# BES Code Review Rules & Antipatterns

Rules for reviewing Tamanu code. Used by AI review agents and as LLM context.

## Antipatterns

### Migrations

- NEVER mix DDL (ALTER TABLE) and DML (UPDATE) in the same migration — PostgreSQL
  deferred constraint triggers cause "pending trigger events" errors. Split into
  separate migration files: DDL → DML → DDL.
- Avoid migrations that UPDATE large tables unnecessarily — every touched row
  triggers a FHIR materialisation job, which can overwhelm the job queue.
- Always consider the data volume impact of DML in migrations.
- Write corresponding mobile (TypeORM) migrations alongside server (Sequelize)
  migrations when the model is synced to mobile.
- Mark destructive `down` functions with a `// DESTRUCTIVE:` comment explaining
  what won't be restored.

### Sync System

- Models with sync enabled must have correct `syncDirection` configuration.
- Changes to sync behaviour must be tested with multi-facility setups — sync
  bugs are extremely hard to diagnose in production.
- Never modify `updated_at_sync_tick` manually — the sync system manages this.

### FHIR Materialisation

- Adding or changing upstream models that feed FHIR resources requires verifying
  that materialisation still produces valid FHIR output.
- Bulk updates to upstream tables (e.g. in migrations) will trigger mass
  rematerialisation — consider whether this is acceptable or needs throttling.

## Coding Conventions (Not Caught by Linters)

### Language

- Australian/NZ English spelling in ALL text: comments, variable names, string
  literals, documentation.
- Examples: "finalise" not "finalize", "colour" not "color", "centre" not
  "center", "organise" not "organize", "cancelled" not "canceled".

### JavaScript/TypeScript

- Prefer `??` over `||` for nullish coalescing.
- Prefer `Boolean(t)` over `!!t`.
- Always add dependencies to the package they're used in — don't rely on hoisting.
- Avoid over-engineering: no premature abstractions, no feature flags for
  one-off changes, no helpers for single-use operations.

### Internationalisation

- All user-facing strings must use `TranslatedText` (not hardcoded English).
- Use `general.action.*` string IDs for common actions (save, cancel, add).
- Prefer replacement tokens (`:count`, `:name`) over message splitting for
  dynamic content.
- Don't put styled JSX as replacement values — the translation factory won't
  handle it.

### Sequelize/Database

- Use parameterised queries — never interpolate user input into SQL strings.
- Prefer `findAll` with `where` clauses over looping with `findByPk`.
- Always consider index usage for new queries on large tables.
- New columns should have sensible defaults or be nullable — avoid breaking
  existing data.

### React/Frontend

- Use functional components with hooks.
- Follow Material-UI patterns established in the codebase.
- Use styled-components for CSS-in-JS.
- Reference `packages/web/app/constants/styles.js` for colour palette.

## Healthcare-Specific

### Patient Data

- Patient data must never be logged at INFO level or above.
- Be cautious about what appears in error messages — stack traces and error
  contexts should not contain patient identifiable information.

### Permissions & Authorisation

- ALL API endpoints must have appropriate permission checks — this is critical
  for a healthcare system handling sensitive patient data.
- Use `req.ability.can(action, subject)` to verify the user has permission.
- Always call `req.flagPermissionChecked()` after checking — routes without this
  flag will be caught by middleware and flagged as potentially unprotected.
- Check permissions at the route level, not deep inside service logic — permission
  checks should be visible and auditable at the entry point.
- New endpoints must not be left with TODO or placeholder permission checks —
  raise it for discussion rather than shipping without checks.
- Deactivated users (`visibilityStatus !== CURRENT`) must not be able to
  authenticate or access any endpoints.

### Data Integrity

- Deleting or modifying clinical data should be soft-delete or audited — never
  hard-delete patient records, encounters, or clinical observations.
- Status transitions (e.g. encounter statuses, lab request statuses) should
  follow the defined state machine — don't allow arbitrary transitions.
