# Runbook: blob correction rate (failing storage)

A server is repairing stored attachment or asset bytes from parity, and doing it
often enough to report. **No content has been lost** — that is what makes this
different from `blob_integrity`. What it tells you is that the storage underneath
is beginning to fail, while it is still cheap to act on.

Every action is tagged with its class from the ladder in `../README.md`. Check
`../ruled-out-actions.md` before running anything mutating.

## 1. When this applies

Use this when the `blob_correction_rate` check is failing or warning on central or
a facility, or when the correction-rate query shows a figure climbing across
successive scrub passes.

This is a **capacity-planning signal, not an incident**. A single correction on one
blob is the feature working as intended and needs nothing. What matters is the
trend and the spread.

If content is actually corrupt or missing — quarantined rows, a failed download —
that is `blob-integrity.md`, not this.

## 2. What the store does on its own

Where error correction is enabled, a covered blob carries a parity sidecar beside
its content. When verification or the scrub finds bytes that no longer match their
hash, the store reconstructs the blob from that parity, checks the reconstruction
against the blob's hash, and writes it back into place.

So by the time this check fires, the repair has already happened:

- The blob is recorded `verified`, not quarantined, and nothing was escalated.
- `correction_count` on the blob went up by one, and `last_corrected_at` was
  stamped. Those two columns are the whole signal.
- Corruption **beyond** what the parity covers is not corrected. It falls through
  to the ordinary ladder and shows up as `blob_integrity` instead.

Error correction is off by default and enabled per server, so a deployment that
has never enabled it will never raise this check — and will meet the same failing
disk as unrecoverable corruption instead.

## 3. Establish context

Which deployment and server — see `../deployment-context.md`. Then, on the affected
server, run the "Correction rate" and "Parity coverage" queries from
`../reference/query-cookbook.md`. **[diagnose]**

Two things decide what this is:

- **How many distinct blobs?** `corrections_total` much larger than
  `blobs_corrected` is repeated repair of the same content, which is one bad region
  on the disk. Corrections spread thinly across many blobs is the substrate going,
  and is the more serious reading of the two.
- **Is it accelerating?** Compare `corrected_24h` against `corrected_7d`. A flat
  handful is background bit rot. A count that grows pass over pass is a disk with a
  limited remaining life.

## 4. Interpret alongside the host disk checks

This check reads the same underlying failure as the host-level disk checks, from
the other end. **[diagnose]** Look at `disk_free`, `btrfs`, and the SMART/host disk
state for the volume holding the blob store root (`blobStorage.root`, which may be
a separate volume from the database — check it rather than assuming).

- Corrections **and** host disk errors: the disk is failing. Go to §5.
- Corrections with a clean host: still treat the disk as suspect. Parity corrected
  real bit rot; the host checks simply have not caught up to it yet.
- Host disk errors with no corrections: this runbook is not the one — error
  correction may simply be off on that server. Check the coverage query, and see
  `blob-integrity.md`.

## 5. Resolve: plan to replace the media

There is no fix to apply on the Tamanu side. The content is intact and the store is
already doing the recovery. What the signal is asking for is hardware work:

- Raise replacing the disk with the deployment's infrastructure owner, with the
  correction figures and the host disk state as the evidence.
- Until it is replaced, confirm backups are current for the affected server — that
  is what covers corruption which outgrows the parity budget.
- On a facility, check the outbox is draining (`../reference/query-cookbook.md`,
  outbox depth). Un-pushed blobs are the only copy of their content, so a failing
  disk matters most while they sit there.

Raising the parity proportion is **not** the response. It buys a little more
recoverable corruption per blob at a linear cost in upload time, and it does not
address a disk that is deteriorating. Leave it at the default unless a developer
has assessed the specific case.

## 6. Escalate

Escalate to the infrastructure owner, not as a Tamanu incident, when:

- The correction count is rising across successive scrub passes, or
- Corrections are spread across many distinct blobs, or
- The same server is also failing `disk_free` / `btrfs` / SMART checks.

Include the server, the correction figures over time, the parity coverage output,
and the host disk check state. Escalate as an incident instead if `blob_integrity`
is *also* failing on that server: that means corruption has already outgrown what
the parity can recover, and content may be lost.

## 7. Do not

- Do **not** clear `correction_count` or `last_corrected_at` to quiet the check.
  They are the only record that the disk is deteriorating, and the count is what
  the trend is read from.
- Do **not** treat a correction as data loss. The reconstruction is verified
  against the blob's hash before it is kept, so a recorded correction means the
  content was recovered intact.
- Do **not** turn error correction off to stop the check firing. The corruption
  does not stop; only the repair does, and the next occurrence becomes a
  quarantined blob needing a backup restore.
- Do **not** delete or hand-edit parity sidecar files. They are derived data and
  the scrub regenerates them, but a hand-edited one is worse than none: it can only
  make a repair fail its hash check.
