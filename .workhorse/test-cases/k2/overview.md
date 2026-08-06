# Route assets through the blob store — test cases

Scenarios verifying the asset write path, the dual-form (hash/legacy) readers on
central and facility, and facility-side prefetch and fetch-on-miss. Most are
automatable as endpoint tests against the central and facility servers with a
seeded blob store; the print-preview and connectivity-loss cases are manual.
Cache mechanics (eviction, outbox, backpressure) are G2's coverage; this card
covers assets as a consumer of them.

Coverage status: the shared dual-read resolver has a passing unit test; the
central upload/read endpoint tests are authored but unrun locally, as the
DB-backed Jest harness cannot build a test context on this machine (a
pre-existing `read ECONNRESET` at the Postgres handshake that also fails
untouched suites). Boxes stay unticked until the scenarios run green.

## Upload path (central admin endpoint)

- [ ] Upload a new asset via the admin PUT endpoint; the image bytes are admitted to central's blob store and the asset row records the content hash with no image bytes in the row (verifies spec: ASSET)
- [ ] Replace an existing asset with a different image; the row's hash updates and subsequent reads serve the new image (verifies spec: ASSET)
- [ ] Replace a legacy in-database asset via upload; the row converts to hash form and readers serve the new image (verifies spec: ASSET)
- [ ] Upload the same image bytes twice (same or different asset names); the store holds one copy under one hash (verifies spec: CAS)
- [ ] Upload a facility-specific asset (facilityId set); the row records the hash and readers serving that facility resolve it in preference to the deployment-wide asset (verifies spec: ASSET)
- [ ] The assets hash column is registered as a blob reference source, so a facility's fetch of an asset's bytes by hash is authorised by the asset row (verifies spec: ASSET, BLAC)

## Readers accept both forms

- [ ] Render a vaccine certificate on central where logo, watermark, and footer rows carry hashes; the PDF includes all three images resolved from the blob store (verifies spec: ASSET)
- [ ] Render a certificate on central against legacy rows carrying in-database bytes and no hash; the images render from the rows directly (verifies spec: ASSET)
- [ ] Render a certificate against a mix of hash and legacy rows in the same document; every image renders (verifies spec: ASSET)
- [ ] Render a patient letter on a facility whose letterhead row is hash form with bytes cached locally; the letterhead renders (verifies spec: ASSET)
- [ ] Render a patient letter against a legacy letterhead row; the letterhead renders from the row (verifies spec: ASSET)
- [ ] GET the facility asset endpoint for a hash-form row with bytes local; the response carries the image bytes inline in the same shape as for a legacy row, and the web client renders it unchanged (verifies spec: ASSET)
- [ ] GET the facility asset endpoint for a legacy row; the response is unchanged from current behaviour (verifies spec: ASSET)
- [ ] GET the facility asset endpoint for a hash-form row whose bytes cannot be resolved; the response indicates content-pending rather than presenting the asset as absent (verifies spec: ASSET, XFER)

## Facility availability

- [x] A hash-form asset row (null inline bytes) passes the sync sanitiser on ingest, so the row and its hash land on the facility rather than throwing (verifies spec: ASSET)
- [ ] Sync a newly uploaded asset row to a facility; the facility fetches the bytes soon after the row arrives, before any reader touches it (verifies spec: ASSET)
- [ ] Evict the asset blob from the facility cache, then render a patient letter; the bytes are refetched on demand and the letter renders (verifies spec: ASSET, CACHE)
- [ ] With asset bytes absent and central reachable, GET the facility asset endpoint; the on-demand fetch fills the cache and the bytes serve (verifies spec: ASSET)
- [ ] With asset bytes absent and central unreachable, render a patient letter; it fails with a message that the asset is not yet available, rather than rendering without the letterhead (verifies spec: ASSET)
- [ ] With no asset uploaded at all (no row), render a certificate and a patient letter; each renders without the optional element and without error (verifies spec: ASSET)

## Transition and migration

- [ ] Run the migration on a database with existing in-database asset rows; rows keep their bytes, gain a null hash, and every reader keeps serving them unchanged (the bulk move is the backfill card's job) (verifies spec: ASSET)
- [ ] dbt source models updated for the assets schema change and `npm run dbt-check-todos` passes

## Operational

- [ ] Manual: on a facility web client, open a certificate print preview after new-form assets are in place; letterhead, watermark, and footer display with no web changes deployed
- [ ] Manual: email a vaccine certificate from central with hash-form assets; the attached PDF carries the images
