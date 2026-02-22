# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build
```bash
npm run build-shared          # Build shared packages (required before running servers/tests)
npm run build                 # Build all packages
```

### Running Servers
```bash
npm run central-start-dev     # Central server (port 3000)
npm run facility-start-dev    # Facility server (port 4000)
npm run web-start-dev         # Web frontend
```

### Testing
```bash
npm run shared-test           # @tamanu/shared tests
npm run facility-test         # @tamanu/facility-server tests
npm run central-test          # @tamanu/central-server tests
npm run web-unit-test         # Web frontend tests

# Run a single test file
npm run facility-test -- path/to/__tests__/foo.test.ts
npm run facility-test -- --testNamePattern="test name"

# Watch mode
npm run facility-test-watch
npm run central-test-watch
```

### Linting
```bash
npm run lint-all              # ESLint on entire codebase
npm run lint-fix              # Auto-fix lint issues
```

### Database Migrations
```bash
npm run create-migration      # Scaffold a new migration file
npm run facility-migrate      # Run pending facility-server migrations
npm run central-migrate       # Run pending central-server migrations
npm run facility-migrate-down # Roll back facility-server migrations
npm run central-migrate-down  # Roll back central-server migrations
```

## Architecture

Tamanu is an npm workspaces monorepo. The two backend servers share the same database models (`@tamanu/database`) but have separate Express apps and routes.

### Data Flow
```
Web/Mobile clients
    ↓ REST API
@tamanu/facility-server  ←→  @tamanu/central-server
    ↓ sync                         ↓ FHIR materialisation
@tamanu/database (Sequelize + PostgreSQL)
```

### Key Packages

| Package | Role |
|---|---|
| `@tamanu/facility-server` | Local facility REST API; clinical data, auth, sync push/pull |
| `@tamanu/central-server` | Central hub; sync coordination, FHIR, admin, reports |
| `@tamanu/web` | React 18 + Vite + Material-UI desktop web app |
| `@tamanu/mobile` | React Native Android app; offline-first with SQLite + TypeORM |
| `@tamanu/database` | Sequelize models and TypeScript migrations (shared by both servers) |
| `@tamanu/shared` | Business logic, Zod schemas, CASL permissions, services |
| `@tamanu/constants` | Project-wide enums and sync direction constants |
| `@tamanu/utils` | Pure utility functions (invoice calculations, etc.) |
| `@tamanu/ui-components` | Shared React component library |

### Configuration
Each package uses the `config` npm package. Override defaults by creating `config/local.json5` (gitignored) inside the relevant package directory. Key config areas: `db.*`, `sync.*`, `auth.*`, `port`.

### API Route Pattern
Routes live in `packages/facility-server/app/routes/` and `packages/central-server/app/routes/`. All protected routes pass through `authMiddleware` → `constructPermission` → `attachAuditUserToDbSession`. Handlers call `req.checkPermission('action', 'Subject')` before accessing data.

### Sync System
Facility servers sync with central via atomic sessions using snapshot isolation. Sync direction per model is set in `@tamanu/constants` (`SYNC_DIRECTIONS`). Mobile uses the same central server sync endpoint.

---

## AI Agent Rules

See `llm/project-rules/` for detailed Tamanu-specific rules:

- **Git Workflow**: See @llm/project-rules/git-workflow.md for branch naming, commit format, and allowed conventional types
- **Pull Requests**: See @llm/project-rules/pull-requests.md for PR template usage and conventional commit types
- **Release Branches**: See @llm/project-rules/release-branches.md for finding releases
- **Configuration Guides**: See @llm/project-rules/write-config-guides.md for creating config and usage documentation
- **Important Rules**: See @llm/project-rules/important-project-rules.md for coding preferences and conventions
- **Copy Changes**: See @llm/project-rules/update-copy.md for TranslatedText system and copy update workflows
- **Translate Strings**: See @llm/project-rules/translate-hardcoded-strings.md for internationalization

## Common Rules (Shared Across Projects)

See `llm/common-rules/` for generic LLM agent rules (from shared submodule):

- **Git Workflows**: See @llm/common-rules/commit.md, @llm/common-rules/create-branch.md, @llm/common-rules/rebase-branch.md
- **Documentation**: See @llm/common-rules/write-docs.md, @llm/common-rules/write-card-description.md
- **Agent Onboarding**: See @llm/common-rules/onboard-agent.md for standardized onboarding flow
- **Rule Management**: See @llm/common-rules/create-rule.md, @llm/common-rules/update-submodule.md, @llm/common-rules/get-latest-rules.md

## Project Documentation

See `llm/docs/` for project-specific documentation:

- **Overview**: See @llm/docs/initial-overview.md for codebase architecture
- **Authentication**: See @llm/docs/authentication.md for auth system details
- **On-Call**: See @llm/docs/on-call-cheatsheet.md for operations and troubleshooting

## Additional Resources

- See @README for project overview
- See @package.json for available npm commands for this project
- See @packages/database/CLAUDE.md for database and migration patterns
