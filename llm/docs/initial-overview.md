# Tamanu Initial Overview

## What is Tamanu?

Tamanu is a comprehensive healthcare management system designed for Pacific Island nations and similar contexts. It's a monorepo containing multiple interconnected applications that work together to provide electronic medical records, patient management, and healthcare data synchronisation across facilities.

## Architecture Overview

Tamanu consists of several key components:

- **Central Server** (`@tamanu/central-server`) - The central hub that facility servers and mobile clients sync with. Also manages central admin actions, like changing settings and setting up users.
- **Facility Server** (`@tamanu/facility-server`) - Local server for each healthcare facility
- **Web Frontend** (`@tamanu/web-frontend`) - Desktop web application for clinical staff
- **Mobile App** (`packages/mobile`) - React Native app for Android, used at smaller facilities and for remote outreach
- **Shared Libraries** (`@tamanu/shared`, `@tamanu/constants`, etc.) - Common code and utilities

## Key Complexity Areas

### Synchronisation System

Tamanu has a sophisticated multi-directional sync system that means distributed data

Key sync concepts:

- Sync ticks for cursors, ordering, and conflict resolution
- Atomic sync sessions with snapshot isolation and strongly enforced concurrency control

### FHIR Materialisation

Tamanu implements FHIR (Fast Healthcare Interoperability Resources) through a materialisation system:

- **Upstream models** - Original Tamanu database models
- **FHIR resources** - Materialised FHIR-compliant representations
- **Reference resolution** - Linking between FHIR resources
- **Materialisation jobs** - Background processing to keep FHIR data current

FHIR resources include: Patient, Encounter, Practitioner, Organization, ServiceRequest, Specimen, etc.

## Technology Stack

- **Backend**: Node.js with Express, Sequelize ORM, PostgreSQL
- **Frontend**: React with Material-UI, styled-components
- **Mobile**: React Native with SQLite for local storage
- **Build**: npm workspaces, custom build tooling
- **Testing**: Jest, Playwright for E2E

## Coding Standards

### Language & Style

- **Australian/NZ English** spelling and terminology throughout
- **TypeScript** for new code where possible
- **ESLint** configuration with custom rules
- **Prettier** for code formatting

### Common Patterns

- **Styled Components** for CSS-in-JS styling
- **Material-UI** components with custom theming
- **Sequelize models** with sync direction configuration
- **API routes** following RESTful conventions
- **Form handling** with validation schemas

## Project Structure

```
tamanu/
├── packages/
│   ├── central-server/     # Central server for synchronisation, external integrations, & admin actions
│   ├── facility-server/    # Local facility server
│   ├── web/               # Desktop web application
│   ├── mobile/            # React Native mobile app
│   ├── shared/            # Shared utilities and services
│   ├── constants/         # Shared constants and enums
│   ├── database/          # Database models and migrations
│   └── ...
├── llm/                   # LLM documentation and rules
│   ├── docs/             # Context documentation
│   ├── rules/            # LLM operational rules
│   └── plans/            # Development plans
└── scripts/              # Build and utility scripts
```

## Common Development Tasks

- **Database migrations** - Use Sequelize migrations for schema changes on the server and TypeORM migrations for mobile database schema changes. Always write corresponding mobile migrations at the same time as server migrations
- **API development** - Add routes to facility-server or central-server
- **UI components** - Create reusable components in the web package
- **Sync configuration** - Set sync directions on models
- **FHIR resources** - Implement materialisation for new resource types

## Key Files to Know

- `packages/web/app/constants/styles.js` - Colour palette and styling constants
- `packages/web/app/theme/theme.js` - Material-UI theme configuration
- `packages/database/src/models/` - Database model definitions
- `packages/shared/src/` - Shared utilities and services
- `packages/constants/src/` - Project-wide constants

## Development Environment

- **Node.js 20.9.0** required
- **PostgreSQL** for databases
- **npm workspaces** for package management
- **Local configuration** via `config/local.json5` files (to override config/default.json5 defaults)
- **Hot reloading** for development servers

## Getting Help

- Check existing documentation in `llm/docs/`
- Look for similar patterns in the codebase
- Use the LLM rules for specific tasks (documentation, context creation, etc.)
- Test changes thoroughly, especially sync-related functionality
