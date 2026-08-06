# Handoff: blob store backups in bestool

You are picking up the bestool side of Tamanu card **N2, Blob store backups and
restore**. The behaviour has been specified in the Tamanu repo; the implementation
is bestool's, and it does not exist yet.

Work in `beyondessential/bestool`. You will read the Tamanu spec for the
requirement but you are not changing Tamanu.

## How these repos work

Both repos use Workhorse, a spec-driven workflow. Specs are the durable
description of what the system requires, written as a snapshot of the system as it
should be rather than as changes to make. Australian/NZ English throughout.

bestool's house conventions are in `.workhorse/rules.md`, and they differ from
Tamanu's. Read that file first. The parts that will catch you out:

- Specs live in `.workhorse/specs/<area>/<name>.md` and are written in **markdown
  prose with each sentence on its own line, no hard-wrapping**, not the checkbox
  acceptance-criteria style Tamanu uses.
- Specs describe the **present** system. Do not write unimplemented requirements
  into a spec.
- Plans live in `.workhorse/plans/` and are point-in-time working documents where
  options and trade-offs are welcome. A plan is added in a `plan:` commit and
  deleted in an `unplan:` commit once the work ships, folding any durable behaviour
  into a spec in that same commit.
- Cross-reference specs by id, e.g. `[BAK](backup.md)`.

There is a plan branch already pushed with the brief on it:
`plan/blob-store-backups`, adding `.workhorse/plans/blob-store-backups.md`. Its PR
(#809) was closed deliberately, because the work moved back to this board rather
than because the content was wrong. **Start by reading that file** on that branch;
it is the fullest statement of the problem and it lays out the options. Either
build on the branch or lift the plan onto a fresh one.

## The card

**N2, Blob store backups and restore.** Specifies how the blob store and database
stay mutually consistent across backup and restore: the database-then-store
ordering that guarantees no dangling references, incremental append-only store
backup, and the restore procedure. Facility backups include the store, since they
drive upgrade testing and must reproduce the true facility state rather than one
part-reconstituted from central.

Part of a larger epic moving Tamanu's attachment and asset bytes out of the
database into a content-addressed blob store on disk.

## Reading the requirement

The spec is `specs/blob-storage/backups.md` (id `BKUP`) in the Tamanu repo, on
branch `workhorse/n2`, in PR beyondessential/tamanu#10708. Note that branch is
based on `workhorse/b2`, the epic's parent, not on `main`, so diff it against
`origin/workhorse/b2` to see only this card's changes.

Read its neighbours in `specs/blob-storage/` too. The ones that bear on backups:

- `content-addressing.md` (`CAS`) — hash-keyed layout, atomic admission, the blob
  registry
- `facility-cache.md` (`CACHE`) — the outbox and cache tiers
- `integrity.md` (`SCRUB`) — verification, and the registry reconciliation that is
  Tamanu's side of restore
- `reclamation.md` (`RECL`) — the only thing that ever removes a blob
- `capacity.md` (`CAP`) — the free-disk floor

## What the store looks like

A directory tree under a configurable root, keyed by content hash, two-level
fan-out. Blobs are immutable once written and are moved into place by an atomic
rename. Only the central server ever removes one, and only when no record
references it.

Two consequences. The store needs **no freeze**: a live path capture cannot observe
a partial or changing blob, so the `simple` method is correct here, and the caveat
that a live path snapshot has no consistency point does not apply to an append-only
content-addressed tree. And the store **dedupes against itself**, so a cycle
transfers only blobs added since the previous one while each capture still
represents the whole store rather than a delta needing a chain to restore.

A facility store has two tiers, distinguished only by durability: an **outbox** of
blobs central has not yet acknowledged, which is the only durable copy of that
content, and a **cache** of blobs durable elsewhere. The tier is recorded in a
database table, not in the tree, so it comes back with the database rather than
with the store. Both tiers must be captured; losing the outbox loses content held
nowhere else.

## The three gaps

Nothing here exists today. The first two are described at length in the plan
mentioned above, with options; the third was found later and is not in it.

**1. Cross-type ordering.** The database must be captured before the store, so the
store capture is a superset of what the database references. Reversed, a blob
admitted between the two captures is referenced by the restored database and absent
from the restored store. But `BackupDef` carries `type`, `tags`, `pre`, `post` and
one method, with no way to declare "run after that type", and Canopy schedules each
`(group, type)` on its own interval and emits due types with no declared order. The
daemon linearises a batch through one run slot, but that order is not a guarantee
anyone can rely on. Options in the plan: a `post` hook re-invoking the driver
(free, but two runs report to Canopy as unrelated); a dependency field respected by
Canopy (cleanest, touches both sides); one type with two sources (cuts against
exactly-one-method-table and per-type retention).

**2. Pairing the captures.** A restore has to select the store capture belonging
with the database capture it is restoring. Each run mints its own id and tags its
snapshot with device, run and type, so two captures of one logical cycle share no
identifier, and pairing is currently an operator comparing timestamps by eye. The
freeze moment already reported is the natural anchor: the database capture reports
the instant it froze, the store capture has none of its own, so "the store capture
belonging to this database capture" means the earliest store capture taken after
that instant. Either derive it that way at restore time or tag both runs with a
shared cycle id.

Note the useful asymmetry: a **later** store capture restored against an earlier
database capture is safe, being a superset. An **earlier** store capture against a
later database capture is not. Restore should fall back to a later one and refuse
an earlier one.

**3. Where the store root comes from.** This one is not in the plan file. The store
root is a Tamanu **setting**, not config: `blobStorage.root` in
`packages/settings/src/schema/{central,facility}.ts`, default `data/blobs`,
resolved against the server's working directory when not absolute, marked
`highRisk`, applying on restart. There is no entry for it in any `config/*.json5`.

So `bestool tamanu config` cannot tell you the store root, and a static TOML
definition that hardcodes a path can be silently orphaned by an administrator
changing the setting in the admin panel. Decide how a definition learns the root.
Reading it from the database is possible but a definition is static; hardcoding it
needs at minimum a way to detect divergence. Worth raising with whoever owns the
Tamanu side if the cleanest answer is that the root should also be readable from
config.

## Also worth deciding

**Retention.** Central's store is the authoritative copy of every blob in a
deployment and grows without deletion, and Tamanu's integrity spec names a backup
as the dependable source for repairing a blob that is corrupt or missing there when
no peer holds it. So the store type's retention wants deciding deliberately rather
than inheriting a database-shaped default. Because each store capture represents
the whole store rather than a delta, expiring old captures does not lose a blob
still on disk; what retention actually bounds is a blob deleted from the store and
then wanted back.

**Canopy.** Whether Canopy needs a change depends entirely on which ordering option
you take. Two of the three need nothing from it. The dependency-field option needs
Canopy to emit a batch in dependency order, and a shared-cycle-id approach to
pairing would want the status view to show a cycle rather than two unrelated runs.
Nothing has been opened against `beyondessential/canopy` for this, deliberately,
because designing it before the mechanism is chosen would be guessing.

## The boundary with Tamanu

After a restore the tree and Tamanu's registry of what it holds can disagree in
both directions, because they were captured at different moments. Reconciling them
is **Tamanu's job, not bestool's**: bestool restores files and knows nothing about
that table. It is specified in `integrity.md` under "Registry reconciliation" and
folded into the epic's integrity scrub card. Do not build it here, and do not assume
it has already happened.

## What to do

1. Read `.workhorse/rules.md`, then the plan on `plan/blob-store-backups`.
2. Read `specs/blob-storage/backups.md` and its neighbours in the Tamanu repo.
3. Decide the three gaps. They are genuinely open; the plan argues the options but
   picks none. Record the decisions in the plan as you make them.
4. Implement: a blob store backup definition using the `simple` method, the
   ordering mechanism, the pairing mechanism, and restore of the pair including the
   later-is-safe / earlier-is-refused rule.
5. Once it ships, delete the plan in an `unplan:` commit and fold the durable
   behaviour into `.workhorse/specs/canopy/backup.md` in that same commit, per the
   repo's lifecycle rule.

Commit style in bestool is conventional prefixes without ticket numbers, e.g.
`feat(canopy): ...`, and `plan:` / `unplan:` for the plan lifecycle. PR titles match.
