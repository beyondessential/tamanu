---
id: ASSET
---

# Assets through the blob store

Assets — the images a deployment uploads to brand and complete its printed documents, such as letterhead logos, certificate watermarks, and certificate footer images — are stored as content-addressed blobs. An asset row carries the hash of its image (see `content-addressing.md`); the bytes live in the blob store and move over the blob transfer channel (see `transfer.md`). Asset rows themselves sync from the central server to every facility.

## Writing

- [ ] Uploading an asset (create or replace, via the admin endpoint) admits the image bytes to the central server's blob store and records the resulting hash on the asset row; the row carries no image bytes.

## Reading

- [ ] A reader resolves an asset's bytes from the blob store by the row's hash. A row that carries in-database bytes and no hash is read from the row directly; every asset reader accepts both forms.
- [ ] This applies to all asset readers: certificate rendering on the central server, patient-letter rendering on the facility server, and the facility endpoint serving assets to the web client.
- [ ] An asset may be facility-specific: a reader serving a facility resolves that facility's asset in preference to the deployment-wide one.
- [ ] The facility asset endpoint returns the image bytes inline, resolved from whichever form the row takes, so web clients need no awareness of where the bytes live. Assets are small enough to serve whole; streamed, ranged serving stays the province of the dedicated blob-serving path (see `serving.md`).
- [ ] When the endpoint holds a hash row whose bytes it cannot resolve, its response indicates the content-pending state (see `transfer.md`) rather than presenting the asset as absent.

## Access

- [ ] A server-to-server fetch of an asset's bytes is authorised by the referencing asset row (see `access-control.md`). Assets sync to every facility, so every facility server may fetch any asset's bytes.

## Facility availability

- [ ] A facility fetches an asset's bytes as soon as the asset row arrives through sync, without waiting for a first use, so printing does not depend on connectivity at print time.
- [ ] A facility reader that finds an asset's bytes absent fetches them on demand.
- [ ] Asset blobs on a facility are ordinary cache-tier content (see `facility-cache.md`): evictable, and refetched on demand after eviction.
- [ ] A certificate or patient letter for which no asset has been uploaded renders without it; assets are optional elements of a document.
- [ ] A certificate or patient letter whose asset row exists but whose bytes cannot be resolved — absent locally and not fetchable — fails with a message that the asset is not yet available, rather than rendering without it.
