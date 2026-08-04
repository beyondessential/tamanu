# Content-addressed blob store primitive (E2) — test cases

Scenarios verifying the `BlobStore` primitive, the `blobs` registry, and the
free-disk floor. Automated coverage lives in
`packages/database/__tests__/blobStore/BlobStore.test.ts` and
`packages/utils/__test__/blobs.test.ts` unless noted.

## Hashing and identity

- [x] A tagged hash formats as `sha256:` + lowercase-hex digest, and uppercase input is lowercased (verifies spec: CAS)
- [x] Malformed hashes are rejected: untagged, uppercase hex, unknown algorithm, truncated digest, non-hex characters (verifies spec: CAS)
- [x] Empty (zero-byte) content has the defined SHA-256 empty hash and stores/retrieves like any other blob (verifies spec: CAS)

## Storage layout

- [x] A stored blob's path is `sha256/<aa>/<bb>/<rest>` under the store root, derived from its digest (verifies spec: CAS)

## Store interface

- [x] `put` streams content in, hashes on write, and returns the tagged hash and size (verifies spec: CAS)
- [x] `put` of already-stored content is a no-op that reports the existing blob; only one registry row exists (verifies spec: CAS)
- [x] `put` registers the blob with its size and verified integrity state (verifies spec: CAS)
- [x] `get` streams stored bytes by hash and throws not-found for absent content (verifies spec: CAS)
- [x] `get` never serves a quarantined blob (verifies spec: SCRUB)
- [x] `has` is true only when both the registry row and the file are present (verifies spec: CAS)
- [x] `delete` removes the file and the registry row; deleting an absent blob is a no-op (verifies spec: CAS)

## Atomic writes

- [x] A failed source stream leaves no temporary file behind (verifies spec: CAS)
- [x] Concurrent puts of identical content admit it exactly once; distinct content stays distinct (verifies spec: CAS)
- [ ] Rename-over-existing and transient sharing violations are handled on a real Windows/NTFS host (verifies spec: CAS) — needs a Windows environment; the retry path is exercised only implicitly on Linux

## Free-disk floor

- [x] `put` refuses with insufficient-storage rather than take volume free space below the reserve, leaving no temp file or registry row (verifies spec: CAP)
- [x] The cache-eviction hook is asked to free space before refusal, and `put` succeeds when eviction frees enough (verifies spec: CAP)
- [x] `put` still refuses when eviction cannot free enough (verifies spec: CAP)
- [x] A size hint refuses up front without consuming the source stream (verifies spec: CAP)
- [ ] Floor behaviour against a real volume (`fs.statfs`) on a server-class host, central included (verifies spec: CAP) — manual, needs a constrained volume

## Registry and migrations

- [ ] Server migration creates `blobs` with unique hash index; `updated_at_sync_tick` column and sync/changelog triggers are absent (verifies spec: CAS) — needs a live Postgres
- [ ] Mobile migration creates `blobs` on device; the model loads and the table is excluded from sync (verifies spec: CAS) — needs an Android build
- [ ] dbt source model reconciles cleanly (`npm run dbt-generate-model` produces no diff against the hand-written `database/model/public/blobs.yml`)

## Platform verification (carried from the spike)

- [ ] A native SHA-256 module builds against RN 0.85.3 and hashes streaming from a file path on a real ARM Android device — spike left this unmeasured; required before the mobile `put` is built
