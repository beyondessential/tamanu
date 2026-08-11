# Runbook: blob backfill rollback (putting content back in the database)

The backfill has moved attachment and asset bytes out of the database and onto the
blob store, and they need to go back: almost always because the deployment is
being taken back to a version from before blob storage, which means reversing the
database migrations as well.

Every action is tagged with its class from the ladder in `../README.md`. Check
`../ruled-out-actions.md` before running anything mutating.

**Restoring from backup is the real path if a backfill has gone wrong.** A backup
cycle holds the database and the store together
(`facility-restored-from-backup.md` §5), and it recovers content that has been
lost. The rollback is a convenience: it only changes where intact bytes live, and
only while the store still holds all of them. Reach for it when the store is
healthy and the database has to look the way it did before the upgrade.

## 1. When this applies

- A central server is going back to a version from before blob storage, so its
  migrations have to reverse.
- A backfill is being abandoned part way and the deployment wants its content back
  in database columns. The rollback works at any stage, complete or not.

It does not apply when:

- **Content is missing or corrupt.** The rollback reads every byte back out of the
  store, so it cannot re-inflate a database from a store with holes in it, and it
  stops dead at the first blob it cannot read. That is `blob-integrity.md`.
- **The store is gone** (volume lost, root deleted). There is nothing to restore
  from, so this is a backup restore.
- **One file is the problem.** Nothing here is per-file. See `blob-integrity.md`.
- **The server is a facility.** The command runs on central only, and there is no
  facility equivalent (§7).

## 2. What the rollback does

It walks every attachment and asset row carrying a hash, streams that content out
of the store, writes it back into the row's byte column and clears the hash. Then
it does the same for changelog entries, restoring the byte snapshot each one used
to carry.

Four things worth knowing before you start:

- **It covers everything carrying a hash.** Content uploaded since the upgrade was
  never in the database, and the rollback puts it there too. Expect the database to
  grow by roughly the size of the content the store holds for attachments and
  assets.
- **It leaves the store alone.** Blobs and their registry rows stay exactly as they
  are, so nothing is destroyed and the backfill can simply run again afterwards.
- **Restored asset rows re-sync.** Assets are pulled from central, so facilities
  receive those bytes over ordinary sync again once the rows change.
- **It resumes.** A row that has its bytes back is not picked up again, so a run
  that is interrupted continues from where it stopped when re-run.

## 3. Before running it

**[diagnose]** On central, run the "Backfill progress" and "Integrity state
summary" queries in `../reference/query-cookbook.md`.

- Any `corrupt` or `absent` blob will stop the run when it reaches that content.
  Resolve it through `blob-integrity.md` first, or accept that the rollback will
  not get past it.
- Check free space on the database volume against the store's size. The bytes are
  going back into the database, and clearing them originally did not shrink the
  database files, so the space they used may still be held by the tables.
- Confirm the server's backup cycle is current. It is what covers this going
  wrong.

**[dev-OTS]** Stop the backfill before starting, by stopping the central server's
task process (`../sops/restart-services.md`) or setting
`schedules.blobBackfill.enabled` to false in settings. Left running, the job moves
rows back out to the store while the command is moving them in.

## 4. Order against the migrations

**The rollback runs first, the downgrade second.**

Reversing the attachment hash migration restores the `NOT NULL` constraint on
`attachments.data`, which fails while any attachment row carries a hash instead of
bytes. Migrations reverse newest first, so by the time it fails the assets hash
column has already been dropped and committed: those rows are left with no bytes
and no hash naming their content, and the rollback can no longer put anything
back. Recovering from that is a database restore from backup.

So the order is: stop the services, run the rollback, confirm it finished, then
run the downgrade.

## 5. Run it

**[dev-OTS]** Mutating, against a live production database, rewriting every
attachment and asset row and their changelog entries. It is reversible (the
backfill moves the content out again on the next upgrade), which is what keeps it
off the ruled-out list. A developer runs it, with the reason for the downgrade
established and a current backup confirmed. It is never a support first-line
action.

Central only. From the current release's central-server directory, the same place
report generation runs from (`../sops/run-db-report.md`):

```bash
node dist rollbackBlobBackfill
```

Where the release runs from source rather than a build, the invocation is
`node --import tsx app rollbackBlobBackfill` (see `../sops/run-db-report.md` for
the same distinction).

- `--batchSize` is rows restored per batch, default 50.
- `--delay` is the pause in milliseconds between batches, default 1000. Raise it
  to tread more lightly on a busy server, or pass `0` to run without pausing on a
  server that is already stopped.

It runs in the foreground and logs a line per batch (`Restored to the database`,
with the unit and a running total), ending with `Completed blob backfill
rollback`. It can run for hours on a large deployment, so start it somewhere a
dropped connection will not kill it. Interrupting it is safe.

## 6. Confirm it worked

**[diagnose]** Re-run the "Backfill progress" queries
(`../reference/query-cookbook.md`). Finished means the store-backed counts are
zero across the board: no attachment or asset row carries a hash, and no changelog
entry carries a hash with its bytes cleared. The remaining-to-move counts will
have risen to match, because every row is back to holding its bytes.

Do not start the downgrade on a partial result. A single row left carrying a hash
is enough to fail it, with the consequences in §4.

## 7. Escalate

- **The run stops with `Blob not found` or `Blob is corrupt`.** A hash the database
  references has no usable content in the store. The command has no way past it
  and will stop at the same row on every re-run, so the content has to be restored
  or the reference dealt with first. Take the hash to `blob-integrity.md`.
- **A downgrade was started before the rollback and failed.** Do not retry it. Asset
  hashes are already gone (§4), and what to do next is a restore decision.
- **A facility needs the same thing.** There is no facility rollback command, and a
  facility holds hash-carrying attachment rows of its own (uploads since the
  upgrade, and attachments pulled from central), so its downgrade meets the same
  failure. Taking a facility back a version is a restore from its backup cycle:
  `facility-restored-from-backup.md`.
- **The database volume fills part way through.** Restored rows keep their bytes, so
  free space and re-run rather than improvising around it.

Include the server, how far the rollback got (the counts from §6), the failing
hash if there is one, and whether the downgrade has been attempted.

## 8. Do not

- Do **not** delete store files or `blobs` rows to tidy up after a rollback. Until
  the downgrade is done and the deployment has settled, they are what the rollback
  reads from, and a second pass over a partly restored database still needs them.
- Do **not** run it with the backfill still scheduled. The two work against each
  other, one moving content out as the other moves it in.
- Do **not** run it to free space on the store volume. It grows the database by
  more than the store gives back, and it removes nothing from the filesystem.
- Do **not** treat it as a recovery for lost or corrupt content. It can only
  produce content the store still holds.
