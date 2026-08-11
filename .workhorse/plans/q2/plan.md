# Antivirus scanning for stored blobs

Implements `specs/blob-storage/antivirus.md` (AV) over the store primitive (E2),
the transfer channel (F2), access control (H2), the facility cache tiers (G2) and
the scrub and self-heal ladder (P2), all already merged into the epic branch.

The feature is optional and no-ops when no scanner is configured. It must not
change ingest latency, serving behaviour, or the scrub in a deployment that has
not turned it on.

## Decisions

Taken 2026-08-10 and now carried by `specs/blob-storage/antivirus.md`. This
section keeps the reasoning behind them, which the spec does not.

### Scan state is separate from integrity state

`integrity_state` means "standing against the hash": `verified`, `quarantined`,
`absent` (`packages/constants/src/blobs.ts`). Infected content hashes correctly,
so it cannot share that column. Reusing `quarantined` for infection would be
actively wrong in three places that already ship:

- the healer treats `quarantined` as damage to repair from parity, a peer, then a
  backup (`specs/blob-storage/integrity.md`, `CentralBlobHealer.js`), which for
  malware means fetching the same bad content again
- `commitStaged` resets any non-verified row to `verified` when good bytes arrive
  (`packages/database/src/blobStore/BlobStore.ts`), so a re-upload or refetch would
  silently clear the state
- central's offer route answers `wanted` for a quarantined copy so a facility can
  heal it (P2's opportunistic peer healing), which is the exact behaviour infection
  has to suppress

So: scan state is its own set of columns on `blobs` (verdict, scanned time,
scanner and signature version), orthogonal to `integrity_state` in the same way
`tier` and `last_scrubbed_at` already are. Those columns record the work *this
server* did.

The propagating fact is separate again: a hash-keyed known-bad record that travels
between servers, because the `blobs` registry is deliberately local, `DO_NOT_SYNC`
and unlogged (CAS). The two answer different questions: `blobs` is what this server
holds, the known-bad record is what is known about this content anywhere.

### Quarantine becomes the malware word

The existing `quarantined` integrity value means "failed verification", so it is
renamed to `corrupt` and quarantine is freed for the propagating malware state the
card describes. Cheap now (a constant, a column default, a mobile migration, two
healers, their tests, and a paragraph in `integrity.md`) and much more expensive
once B2 lands on main.

### Scanning is asynchronous

Admission does not block on the scanner. Content is admitted unscanned and a
queued scan records the verdict, the same shape as the scrub
(`BlobIntegrityScrubTask`).

Reasons: re-scan on signature update and scanning the backfill backlog have to be
async anyway, so blocking ingest means building two mechanisms for one job; the
ingest path stays untouched when no scanner is configured; and the unscanned
window is what the serve policy exists to govern.

Consequences to build:

- not-yet-scanned is a serving answer, not an error. Under serve-only-when-known-good
  it reuses the 202-plus-availability-state shape that already answers
  awaiting-upload (`packages/central-server/app/attachment.js`), so a client can
  tell "wait" from "gone"
- a scanner outage fails closed on the verdict, not on ingest. Content stays
  unscanned and the administrator's posture decides whether it serves. An outage
  cannot widen exposure and cannot stop clinicians uploading
- because a verdict can arrive after content has been served, infection is
  revocable: the reference stays, the content stops serving, and the known-bad fact
  propagates

## Questions, and how they were answered

Taken 2026-08-11 by the card owner, who asked for the calls to be made rather
than deferred. All four are now carried by the spec.

1. **Propagation.** A hash-keyed `blob_quarantines` record, written on central and
   `PULL_FROM_CENTRAL` to facilities and devices. Chosen over a refusal reason on
   the fetch subprotocol or a check at fetch time because it is the only one that
   survives an offline facility, which is the case that matters: a cached copy of
   known-bad content has to stay refused with the link down. Verdicts themselves
   stay local to the server that reached them, so the sync volume is one row per
   known-bad hash rather than one per blob.
2. **Scanner configuration.** A server opts in by naming a scanner
   (`blobStorage.antivirus.scanner`, default `none`), with an address, a timeout
   and a size cap. Content over the cap is left unscanned rather than sent, so
   clamd's stream limit cannot stall the pass; the posture then decides what
   unscanned content does.
3. **Re-scan trigger.** Scanner-reported signature version, compared against the
   version recorded on each blob, on its own schedule and budget
   (`schedules.blobAntivirusScan`) rather than sharing the scrub's. Scanning is
   bound by the scanner's throughput and scrubbing by disk reads, and a signature
   update makes the whole store due at once.
4. **User-visible behaviour.** Infected content is answered as its own state
   (`withheld-infected`) rather than as pending, so a clinician is told the content
   is not coming. Unscanned content withheld under the strict posture answers
   `awaiting-scan`, in the content-pending shape. Uploads are never rejected at the
   door: content is admitted and quarantined if the scan finds something.

Two refinements after review, both narrowing what the posture governs:

- A quarantine binds under every posture, `off` included. The first cut had `off`
  serve everything, which read straight off the spec, but it meant a deployment
  that had found malware and recorded it deployment-wide would keep serving it
  until someone also changed the posture. `off` now means this server does not act
  on its own verdicts, which is the bedding-in case it exists for; the deployment's
  standing record of confirmed malware is not one of those verdicts.
- The strict posture only judges content the server holds. Judging a blob it has
  yet to fetch deadlocked it: the scan reads what is on disk, so withholding it
  before the fetch meant it was never fetched, never scanned, and never served.

The original framing of those questions, kept because the reasoning still applies:

1. **Propagation mechanism.** How a known-bad verdict reaches other servers: a
   synced hash-keyed record, a refusal reason on the fetch-by-hash subprotocol, or
   central-authoritative check at fetch time. The storage split above assumes such a
   record exists but does not choose its transport. Everything touching facilities
   waits on this.
2. **Scanner configuration surface.** Which scanner, socket or endpoint, timeouts,
   size caps, and what "unconfigured" means. Belongs in the settings schema under
   the existing `blobStorage` subtree, scoped by where it is read. The serve policy
   needs a named setting path and its three options.
3. **Re-scan trigger.** How a signature update is observed (scanner-reported
   version, scheduled full cycle, or both) and how the re-scan is rate limited
   against the scrub.
4. **User-visible behaviour.** What web, mobile and the patient portal show for
   withheld or infected content, and whether an infected upload is rejected outright
   or stored and quarantined.

Lower priority: whether a quarantined blob is ever reclaimed once unreferenced,
whether facilities evict infected cache copies, and how the backfill's legacy
backlog is scanned without swamping the scanner.

## Steps

- [x] Rename the `quarantined` integrity state to `corrupt` across constants, the
  model default, the mobile migration, both healers, and `integrity.md`
  - No migration: the value is only ever written at runtime, both column defaults
    are `verified`, and B2 is not on main, so no stored row holds the old value
  - Also swept the support pack (`docs/runbooks/blob-integrity.md`,
    `docs/reference/query-cookbook.md`, whose query matches on the value) and the
    dbt column doc
  - `MobileBlobStore.quarantine()` is now `markCorrupt()`, so the word is free
- [x] Add scan columns to `blobs` and the dbt models
  - `scan_verdict`, `scanned_at`, `scanner_version`, `signature_version`, all
    nullable; a null verdict is not-yet-scanned
  - `BLOB_SCAN_VERDICTS` (clean, infected) names the verdict domain
  - No mobile counterpart in the end: with question 1 answered by a propagating
    record, a device holds a quarantine it was told, not a scan it performed, so
    the four columns would have been dead there. It gets `blob_quarantines`
    instead
  - The dbt `.yml` was hand-edited to match the generator's shape rather than
    regenerated, which needs a migrated local database
- [x] Settings for the scanner and the serve policy
  - `blobStorage.antivirus.servePolicy` is global (deployment-wide posture);
    scanner, address, timeout and size cap are per-server, in central and facility
    scope alongside `blobStorage.root`
  - `schedules.blobAntivirusScan` on both servers, with its own per-pass bounds
- [x] Scanner driver behind one interface, with clamd first and the others left as
  seams
  - clamd over INSTREAM rather than SCAN-by-path, so the daemon needs no access to
    the store's filesystem and can run in its own container. The size cap is the
    cost of that choice
- [x] Queued scan task, on its own budget rather than the scrub's
- [x] Serve policy enforcement on the read path, including the not-yet-scanned
  answer, on central and facility attachment routes and the transfer channel
- [x] Known-bad propagation and self-heal suppression
  - `blob_quarantines`, written on central, `PULL_FROM_CENTRAL` everywhere else
  - Suppressed in four places the epic already shipped: central's offer answers
    already-stored rather than wanted, pushed bytes are not staged, the facility
    healer leaves it unrepaired, and the device refuses to fetch or serve it
- [x] Re-scan on signature update, by comparing the scanner's reported signature
  version against the one recorded on each blob
- [x] Runbook, healthcheck map entry, and query cookbook entries, as P2 did
- [x] Tests across the store, the scan pass, the serve postures, and the device
  - Unit coverage is in `@tamanu/database` and mobile, both runnable here
  - The central and facility endpoint tests need a database, so they are listed
    unticked in the test cases rather than written blind

## CI

**Not ours (2026-08-11).** Facility shard 3/8 failed on
`FacilitySyncManager-edgecases.test.js`, "throws an error if a pulled record was
updated between push and pull". The test sleeps 200ms expecting the sync to be
parked inside a mocked `pushOutgoingChanges` with the local tick already advanced,
then saves a record so it is stamped with the *new* tick. On a slow runner the save
lands before the bump at `FacilitySyncManager.js:256`, is stamped with the old tick,
and the assertion's `updated_at_sync_tick > last_successful_sync_push` (which push
sets to that same old tick) is false, so nothing throws and the promise resolves.
That is the reported symptom exactly. This card touches no sync code; the only
contact is `BlobQuarantine` joining `getModelsForPull`, which adds one COUNT query
to the assertion loop after the decisive per-model check. Re-run rather than fix,
and do not "harden" a shared sync test from this card.
