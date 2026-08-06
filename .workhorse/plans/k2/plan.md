# Route assets through the blob store — plan

Behaviour is specified in `specs/blob-storage/assets.md` (ASSET). These are implementation notes.

## Sequencing

- Re-update from B2 once G2 (facility outbox and LRU cache) merges, before implementing: the facility-side fetch-on-miss and prefetch land on G2's cache-tier `BlobStore` API, and G2 also brings `FacilityBlobCache` and the sync-runtime hooks the prefetch can attach to.
- Register the assets hash column in central's `BLOB_REFERENCE_SOURCES` registry (`blobReferences.js`, currently empty, added by H2). J2 registers attachments in the same registry — trivial merge overlap, coordinate ordering if both are in flight.

## Touch points

- Write path: `central-server/app/admin/asset.js` PUT — admit to store, stamp hash, stop writing `data`.
- Readers (all dual-read hash/legacy): `central-server/app/utils/makePatientCertificate.jsx`, `facility-server/app/utils/makePatientLetter.jsx`, `facility-server/app/routes/apiv1/asset.js` GET (response keeps inline bytes — client contract unchanged, web needs no changes).
- Prefetch: trigger on asset row arrival in sync; assets are `PULL_FROM_CENTRAL` and sync everywhere, so no scoping logic needed.
- Mobile has no Asset model — no mobile work on this card.
- Migration: add `hash` column to `assets` (server only; no mobile migration since no mobile model). Update dbt source models.
