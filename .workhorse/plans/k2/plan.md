# Route assets through the blob store — plan

Behaviour is specified in `specs/blob-storage/assets.md` (ASSET). These are implementation notes.

## Sequencing

- G2 (facility outbox and LRU cache) has merged into B2 and this branch includes it (updated 2026-08-06): the facility-side fetch-on-miss and prefetch land on its cache-tier `BlobStore` API, `FacilityBlobCache`, and the sync-runtime hooks the prefetch can attach to.
- Register the assets hash column in central's `BLOB_REFERENCE_SOURCES` registry (`blobReferences.js`, currently empty, added by H2). J2 registers attachments in the same registry — trivial merge overlap, coordinate ordering if both are in flight.

## Touch points

- Write path: `central-server/app/admin/asset.js` PUT — admit to store, stamp hash, stop writing `data`.
- Readers (all dual-read hash/legacy): `central-server/app/utils/makePatientCertificate.jsx`, `facility-server/app/utils/makePatientLetter.jsx`, `facility-server/app/routes/apiv1/asset.js` GET (response keeps inline bytes — client contract unchanged, web needs no changes).
- Prefetch: trigger on asset row arrival in sync; assets are `PULL_FROM_CENTRAL` and sync everywhere, so no scoping logic needed.
- Mobile has no Asset model — no mobile work on this card.
- Migration: add `hash` column to `assets` (server only; no mobile migration since no mobile model). Update dbt source models.

## Build checklist

- [x] Migration: add nullable `hash` TEXT column to `assets`, make `data` nullable (DDL only, after 1785820000000)
- [x] Asset model: declare `hash` field
- [x] Write path (`central-server/app/admin/asset.js`): admit bytes to `req.ctx.blobStore.put`, stamp `hash`, stop writing `data`
- [x] Register `assets.hash` in central `BLOB_REFERENCE_SOURCES` at startup (idempotent registration)
- [x] Shared reader helper `resolveAssetImageData(asset, openBlob)` (hash → buffer store stream, else row `data`)
- [x] Central certificate reader: thread `blobStore`, dual-read via helper
- [x] Facility patient-letter reader: dual-read via helper over `blobCache.open`, content-pending fails the print
- [x] Facility asset GET endpoint: resolve bytes inline (both forms); content-pending response when a hash's bytes are unresolvable
- [x] Prefetch: fetch asset bytes for hash rows after a completed sync cycle (`sync/prefetchAssets.js`)
- [~] Tests: shared helper unit test (passing); central upload/read endpoint tests authored
- [~] dbt: `assets` model updated by hand (`hash` column + docs, `data` no longer not-null); rerun `dbt-generate-model` + `dbt-check-todos` against a migrated DB to confirm ordering/reconciliation once the harness is healthy

## Notes

- No facility `blobReferenceResolvers` entry for assets: assets are `PULL_FROM_CENTRAL`, so they never sit in a facility outbox awaiting push. That registry gates push eligibility only. Central-side `registerBlobReferenceSource` (access-control scoping of fetches) is what assets need, and is wired.
- `assets.data` was `NOT NULL`; the migration drops that so hash rows can carry no bytes. Its `down` leaves `data` nullable (marked DESTRUCTIVE).
- **Local test harness caveat:** the central and facility DB-backed Jest harnesses cannot build a test context on this machine — `initDatabase({ testMode: true })` resets the connection at the Postgres handshake (`SequelizeConnectionError: read ECONNRESET`). This reproduces on untouched tests (`basics.test.js`, `blobCache.test.js`) with all K2 changes stashed, so it is a pre-existing environment issue, not a code fault. Raw `pg` and a bare `new Sequelize().authenticate()` both connect fine. The shared helper unit test (no DB) passes; the endpoint tests are authored against the new contract and should be run once the harness is healthy.
