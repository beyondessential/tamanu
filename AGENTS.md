## Cursor Cloud specific instructions

### Overview

Tamanu is a healthcare EHR monorepo (npm workspaces). The main services are:

- **Central server** (port 3000): `npm run central-start-dev`
- **Facility server** (port 4000): `npm run facility-start-dev`
- **Web frontend** (port 5173): `npm run web-start-dev`

See `README.md` for full setup and `package.json` for all available scripts.

### Database

PostgreSQL 16 is pre-installed. Two databases are needed: `tamanu-central` and `tamanu-facility`, both using `postgres/postgres` credentials on port 5432. Start PostgreSQL with:

```
sudo pg_ctlcluster 16 main start
```

### Configuration

Server configs live in `packages/{central,facility}-server/config/local.json5`. If missing, copy from `local.example` and adjust credentials. Both servers use port 5432 with different database names (`tamanu-central` and `tamanu-facility`).

### Running services

Shared packages must be built before servers start. The `*-start-dev` scripts handle this automatically. Start order: central server first, then facility server, then web frontend.

### Migrations

Run migrations via `node dist upgrade` in each server package (after building with `npm run build`). Alternatively, use `npm run central-migrate` / `npm run facility-migrate` from the root, but note these use `nodemon` (watch mode).

### Provisioning

After fresh migrations, provision the central server with an admin user and facility:

```
cd packages/central-server && node dist provision provisioning.json5
```

The provisioning file creates `admin@tamanu.io` (password: `admin`) and a facility. The admin user needs a `user_facilities` record in the facility database to log into the web frontend.

### Testing

- **Lint**: `npm run lint-all` (0 errors expected; ~160 pre-existing warnings)
- **Unit tests** (no DB): `npm run --workspace @tamanu/utils test`, `npm run shared-test`, `npm run web-unit-test`
- **Server tests** (need DB): `npm run central-test`, `npm run facility-test` — these need `NODE_CONFIG` set with DB credentials pointing at a test database
- Tests use `NODE_OPTIONS="--max-old-space-size=6144"` in CI

### Gotchas

- The facility server's `sync.enabled` should be `false` for local-only development (no need for central-facility sync unless testing sync flows).
- The `start-watch` scripts use `nodemon` — they stay running and watch for file changes. For one-shot operations (migrations, provisioning), use `node dist <command>` directly after building.
- Node version must be v20.19.4 (from `.node-version`). Use `nvm use 20.19.4`.
