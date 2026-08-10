# Runbook: blob integrity (corrupt or missing attachment bytes)

A server reports that stored attachment or asset bytes no longer match the hash
that names them, or that content it should hold is not there. This surfaces as
the `blob_integrity` healthcheck, as a failed download for a specific file, or as
corrupt rows found while triaging something else.

Every action is tagged with its class from the ladder in `../README.md`. Check
`../ruled-out-actions.md` before running anything mutating.

## 1. When this applies

Use this when any of the following is true:

- The `blob_integrity` check is failing on central or a facility.
- A user reports a specific attachment that fails to download, and the server log
  shows the content hashed to something other than its name on read.
- A scrub pass logged an unrecoverable blob.

Most blob problems are **not** this. Content that is merely awaiting its bytes is
normal and self-resolving: see the content-pending checks in
`facility-restored-from-backup.md` §5 before treating an absence as corruption.

## 2. What the store does on its own

The store verifies content at three points, so by the time a fault reaches you
the automatic repair has usually already been tried:

- On receipt, before the bytes are stored.
- On a full read, by re-hashing as the content streams.
- On a scheduled incremental scrub, which is what covers content nobody reads.

What happens next depends on whether the copy was the only durable one, and this
is the distinction that decides how urgent the report is:

| Where | What the server does | How urgent |
| --- | --- | --- |
| Facility, `cache` tier | Drops the bad copy; the next read refetches it from central | Self-correcting. Only a concern if it persists |
| Facility, `outbox` tier | Records it corrupt, tries central, then escalates | Urgent: may be the only copy |
| Central, any blob | Records it corrupt and escalates; waits for a facility to re-offer the content | Urgent: authoritative copy |

A corrupt blob is **retained, never served, and never deleted automatically**,
so the bad bytes stay available for investigation.

Quarantine also takes the blob out of the scrub's verification pass, which is
deliberate: re-hashing bytes already known to be bad every pass would spend the
scrub's budget re-learning what is recorded. The consequence matters for the
restores below. **The scrub will not notice good bytes placed under a quarantined
row on its own**, so clearing the state is an explicit step of the repair rather
than something to wait for. An `absent` blob is the opposite case: it stays in the
pass, and returning bytes are picked up and verified without anyone doing
anything.

## 3. Establish context

Which deployment and server — see `../deployment-context.md`. Then, on the
affected server, get the shape of the problem from the "Blob store" queries in
`../reference/query-cookbook.md`: the corrupt-blob list, the store size by
tier, and (on a facility) outbox depth. **[diagnose]**

The two things worth establishing before anything else:

- **Is it one blob or many?** A single corrupt blob is a bad sector or an
  interrupted write. Many at once is the storage substrate failing, and the blob
  problem is a symptom of a host problem — go to `disk_free` / `btrfs` / the host
  disk checks, and treat this runbook as secondary.
- **Which tier?** On a facility, `tier` in the query output decides whether this
  is self-correcting or data loss, per the table above.

## 4. Resolve: facility cache blob

Nothing to do. The server drops the copy and refetches on demand, and the count
should return to zero without help. **[diagnose]** Re-run the corrupt-blob
query after the next scrub pass to confirm it cleared.

If the count does **not** clear, the refetch path is the problem, not the storage:
work the facility's sync and transfer health (`sync-facility-stale.md`) instead.

## 5. Resolve: facility outbox blob

An outbox blob has not been acknowledged by central, so this facility holds the
only copy. The server has already tried central (which occasionally does hold it,
where a push succeeded but the demotion did not land). If that failed, the
content exists only in this facility's backups.

**[diagnose]** Confirm the blob is genuinely outbox tier and genuinely unheld,
using the corrupt-blob and outbox queries.

Restoring a single blob from a facility backup is a **[dev-OTS]** action: it means
extracting one file from the store capture of a backup cycle and placing it in the
running store. Hand this to a developer with the hash, the facility, and the
backup cycle to draw from. It has two steps, and the second is what people miss:

1. Place the file in the exact fan-out path its hash dictates. Anywhere else it is
   invisible to the server and never reclaimed.
2. Return the row to `absent`, which puts the blob back in the scrub's
   verification pass (see §2). The next pass hashes the placed file and stamps it
   `verified`, or re-quarantines it if the bytes are still wrong, so the state
   change is not taking anyone's word for the restore: the scrub still decides.

Step 2 is the only case where writing to a quarantined row is right, and it is
safe precisely because step 1's bytes are independently re-checked. It does not
license deleting the row (see §8).

If no backup holds it, the content is lost. Say so plainly to the deployment
contact rather than leaving a corrupt row to be rediscovered later.

## 6. Resolve: central blob

Every blob central holds is authoritative, so this is the escalation case.

Central repairs itself from a facility **opportunistically**: it cannot reach out
to a facility on demand, so it accepts a replacement when some facility next
offers that content on a connection it makes anyway. This means a central
corrupt state can clear on its own, but only if a facility still holds the blob and
has reason to offer it. Do not wait on this if the content matters.

**[diagnose]** Establish whether the content is referenced by a live record, and
by how many. An unreferenced corrupt blob is a curiosity; a referenced one is
a file a clinician cannot open.

The dependable repair is a restore from central's backup, which is
**[dev-OTS]** and follows the same two steps as §5: extract the blob from the store
capture, place it in its fan-out path, then return the row to `absent` so the next
scrub pass verifies it.

## 7. Escalate

Escalate immediately, without waiting for a scrub cycle, when:

- A facility outbox blob is unrecoverable, or
- A central blob is corrupt and referenced, or
- The corrupt count is rising across successive scrub passes, which means the
  underlying storage is failing rather than having failed once.

Include the server, the tier, the hashes, the corrupt count over time, and
whether the host disk checks are also failing. Use the structured payload from
`senaite-integration-delay.md` §6.

## 8. Do not

- Do **not** delete corrupt rows or store files to "clear" the check. The
  bytes are the evidence, and on an outbox blob they may be a partially
  recoverable copy of content held nowhere else.
- Do **not** copy blob files between servers by hand as routine repair. It works
  only because the scrub adopts correctly placed files, and a file put in the
  wrong path is invisible and unreclaimable. Restores go through a developer.
- Do **not** disable the scrub to quiet the check. It is what finds the next
  fault, and a store with the scrub off looks healthy right up until someone
  needs the file.
