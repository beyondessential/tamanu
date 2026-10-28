# Test cases: Tamanu Workhorse rigs

Verifies that a rig lease built from the recipe on PR #11516 (`.workhorse/rig/`) is a usable
environment for the Playwright suite in `packages/e2e-tests`.

Run against a lease served from the cached build of `a1e38dce` ("two facilities"), whose `serve`,
`reset`, `teardown`, `lib.sh`, `seed` and `sql.mjs` are byte-identical to the PR tip.

## Lease health

- [x] `serve` brings up central, facility-1, facility-2 and the three web previews, all answering on 127.0.0.1
- [x] Every server answers `/api/public/ping`, and each web preview proxies `/api` to the server it targets
- [x] `admin@tamanu.io` / `admin` authenticates through the facility-1 web origin and returns a token
- [x] The lease uses only its own databases: the lease central plus the two `tamanu_rig_f*` clones
- [x] Patients created on facility-1 reach central and facility-2, with encounters correctly staying facility-scoped
- [x] `reset` returns all three databases to template state
- [ ] `teardown` drops the lease's facility databases and leaves the templates alone
- [ ] A second concurrent lease on the same build does not collide with the first

## Running the e2e suite against a lease

- [x] The suite needs only `FACILITY_FRONTEND_URL`, `ADMIN_FRONTEND_URL`, `TEST_EMAIL` and `TEST_PASSWORD`, with `LAUNCH_LOCAL_SERVERS_WHEN_RUNNING_TESTS` off
- [x] The `setup` project authenticates against both frontends and writes a combined `storageState`
- [x] A full suite run completes against a lease, with no test skipped for environment reasons
- [x] Run with `CI` unset so the suite's `slowMo` applies. Forcing `CI=true` on a fast machine makes `fill()` races fail tests that pass otherwise
- [ ] A full suite run in local mode, start to finish, on a freshly reset lease

## Provisioning parity with the CI e2e environment

The recipe's `provisioning.json5` is close to the setup in `.github/scripts/e2e-test-setup.sh`, and
the differences are what the suite notices.

- [x] `medications.dispensing.dispensingQuantityAutocalculation` is absent from the recipe and defaults to `false`, so both `medication.spec.ts` encounter tests fail
- [ ] The `practitioner@tamanu.io` and `reception@tamanu.io` users exist, as they do in the CI setup
- [ ] `localisation.data.imagingTypes` is populated. Nothing in this suite exercises it, since `tests/imaging/imaging.spec.ts` is an empty stub

## Recipe robustness

- [x] Central connects to the lease database. It relies on the manager exporting `DATABASE_URL`, which the recipe never declares; without it central silently falls through to whatever `development.json5` names
- [x] `serve` does not stop on SIGTERM to its shell, because it is blocked on the foreground `vite preview`. Killing the process group works
- [ ] Each lease logs no spurious errors. Three `fatal: not a git repository` lines appear during sync lookup, since the build source has no `.git`
- [ ] A fresh build at the PR tip succeeds, covering the `deps` and `build.sh` changes that the cached build predates
