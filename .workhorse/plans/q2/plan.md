# Antivirus scanning for stored blobs

Implements `specs/blob-storage/antivirus.md` (AV) over the store primitive (E2),
the transfer channel (F2), access control (H2), the facility cache tiers (G2) and
the scrub and self-heal ladder (P2), all already merged into the epic branch.

The feature is optional and no-ops when no scanner is configured. It must not
change ingest latency, serving behaviour, or the scrub in a deployment that has
not turned it on.

## Decisions

Taken 2026-08-10. The AV spec has not yet been amended to carry them; until it
is, this section is the record.

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

## Open questions

Blocking, in order:

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

Not started. The first two are unblocked; the rest wait on the open questions
above.

- [ ] Rename the `quarantined` integrity state to `corrupt` across constants, the
  model default, the mobile migration, both healers, and `integrity.md`
- [ ] Add scan columns to `blobs` plus the mobile counterpart, and the dbt models
- [ ] Settings for the scanner and the serve policy (open question 2)
- [ ] Scanner driver behind one interface, with clamd first and the others left as
  seams
- [ ] Queued scan task, sharing the scrub's rate-limiting shape
- [ ] Serve policy enforcement on the read path, including the not-yet-scanned
  answer
- [ ] Known-bad propagation and self-heal suppression (open question 1)
- [ ] Re-scan on signature update (open question 3)
- [ ] Runbook, healthcheck map entry, and query cookbook entries, as P2 did
- [ ] Tests across store, scan task, both servers, and the serve postures
