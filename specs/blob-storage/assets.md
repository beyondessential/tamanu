---
id: ASSET
---

# Assets through the blob store

Assets — letterhead logos, certificate watermarks, and certificate footer images — are stored as content-addressed blobs. An asset row carries the hash of its image (see `content-addressing.md`); the bytes live in the blob store and move over the blob transfer channel (see `transfer.md`). Asset rows themselves sync from the central server to every facility as before.

## Writing

- [ ] Uploading an asset (create or replace, via the admin endpoint) admits the image bytes to the central server's blob store and records the resulting hash on the asset row; the row carries no image bytes.

## Reading

- [ ] A reader resolves an asset's bytes from the blob store by the row's hash. A legacy row that carries in-database bytes and no hash is read from the row directly; every asset reader accepts both forms.
- [ ] This applies to all asset readers: certificate rendering on the central server, patient-letter rendering on the facility server, and the facility endpoint serving assets to the web client.
- [ ] The facility asset endpoint returns the image bytes inline, resolved from whichever form the row takes, so web clients are unaffected by where the bytes live.

## Access

- [ ] A server-to-server fetch of an asset's bytes is authorised by the referencing asset row (see `access-control.md`). Assets sync to every facility, so every facility server may fetch any asset's bytes.

## Facility availability

- [ ] A facility fetches an asset's bytes as soon as the asset row arrives through sync, without waiting for a first use, so printing does not depend on connectivity at print time.
- [ ] A facility reader that finds an asset's bytes absent fetches them on demand.
- [ ] Asset blobs on a facility are ordinary cache-tier content (see `facility-cache.md`): evictable, and refetched on demand after eviction.
- [ ] A certificate or patient letter whose asset bytes cannot be resolved — absent locally and not fetchable — fails with a message that the asset is not yet available, rather than producing the document without it.
