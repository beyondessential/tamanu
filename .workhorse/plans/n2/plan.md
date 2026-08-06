# Blob store backups and restore

Notes for the bestool-side work this card specifies. The behaviour lives in
`specs/blob-storage/backups.md`; nothing here is implemented in the Tamanu
codebase except the registry reconciliation noted below.

## How bestool backups actually work

Read from `~/dev/bestool`, `.workhorse/specs/canopy/backup.md` (id `BAK`) and
`~/dev/canopy`, `.workhorse/specs/private-server/backup.md`.

- A backup is a TOML definition in the backups directory, one per file, carrying a
  `type` label (the only identity Canopy cares about), optional tags, optional
  ordered `pre`/`post` command hooks, and exactly one method table: `simple`
  (snapshot a path as-is) or `postgresql`.
- kopia is the engine. The repository is per group, content-addressed and
  deduplicating, and the device holds write-without-delete credentials, so it can
  never delete from the repository. Retention and maintenance are Canopy's.
- Canopy schedules per `(group, type)`, each with its own expected interval and
  retention policy. On each healthcheck tick Canopy names the types the server
  should run now.
- The daemon linearises a batch of due types through a single run slot with a quiet
  period between runs, and takes a per-type lock.
- Restore is `bestool canopy restore <type> <id>`: one type, one snapshot id, named
  explicitly by the operator.

The blob store fits the `simple` method directly, since it is a path to snapshot
and needs no freeze (see the live-capture criterion in the spec).

## The two gaps this card's spec opens

Both are bestool/Canopy work, not Tamanu work, and neither has any mechanism
today.

**Cross-type ordering.** The spec requires the database captured first and the
store second within one cycle. Backup types are independent: separate definitions,
separate schedules, separate intervals, and a batch of due types is linearised but
not ordered by any declared dependency. Nothing today can express "run this type
after that one". Candidate approaches, cheapest first:

- Make the store capture a `post` hook of the database definition. Hooks run
  argv-style commands rather than kopia snapshots, so this would mean the hook
  invoking `bestool canopy backup --type <store type>`, which re-enters the driver
  and takes a second per-type lock. Ordering falls out for free but the nesting is
  ugly and the run reporting would show two unrelated runs.
- Add an ordering or dependency field to the definition, so a type can declare it
  runs after another. Canopy would need to emit the batch in dependency order.
- Treat the pair as one backup type with two sources. Cuts against "exactly one
  method table" and against per-type retention.

**Pairing the two captures.** The spec requires the two captures of a cycle to be
identifiable as a pair so a restore can select a matching store capture. Today
each run mints its own run id and each snapshot is tagged with device, run and
type, so two captures of the same logical cycle share no identifier. Restore is
per-type by snapshot id, so pairing is currently the operator's problem, resolved
by eyeballing timestamps. Options: a cycle id tag shared by both runs, or letting
restore resolve the store snapshot from the database snapshot's freeze moment.

Note the freeze-moment reporting already in `BAK` helps here: the database capture
reports the instant it froze, which is the right anchor for "the store capture
belonging to this database capture". The store capture has no freeze instant of its
own, being a live path snapshot.

## Why capturing the facility cache is affordable

Decided: capture both facility store tiers, cache included.

The outbox is non-negotiable, being the only durable copy of its content. Cache is
the judgment call, and it goes in because the card's rationale is upgrade rehearsal
against a faithful copy: a facility whose cache arrives empty is exactly the
part-reconstituted state the card is trying to avoid.

The cost is bounded by the store being content-addressed and the backup
incremental, so a cache blob captured by an earlier cycle is not captured again.
That argument holds per server and needs no assumption about grouping.

A stronger cost argument does exist but the spec deliberately does not lean on it.
The kopia repository is per group and deduplicating, so where a deployment's
central and facility servers share a group they share a repository, and a facility
cache blob that central's store backup already put there costs only metadata. But a
group is an operator-defined set of servers (`servers.group_id`, nullable) with at
most one backup configuration, so that sharing is a grouping convention rather than
a property of the model. Grouped otherwise, dedup does not cross between servers.
Worth confirming how deployments are actually grouped before relying on it for
capacity planning.

## What Canopy needs (nothing, in code)

bestool took the `after = "<type>"` route (beyondessential/bestool#810): the
follower is chained device-side by the driver, so the ordering never reaches
Canopy. Checked against Canopy's code, that needs no change there. `BackupType` is
open (`TamanuPostgres` plus `Custom(String)`), staleness is already evaluated per
`(server, type)` with type-suffixed alert refs, and restore credentials are issued
per `(server, type)`, so a new follower type registers, alerts and restores as it
stands.

The configuration does matter, though. `crates/database/src/backup/staleness.rs`
scans only enabled capabilities with a non-NULL `expected_interval`, and a
newly-seen type arrives with no schedule, so a blob type driven only by the chain
is never scanned: a chain that silently stops leaves the store unbacked with no
alert. Give the type its own interval as a backstop, longer than the database
type's, since the chain covers the common case and a scheduled run adds a capture
on top. Set its retention deliberately too, per the note above about central's
store being the archive and the heal source.

## Outstanding: the content-pending query

The runbook's section 5 asks a support officer to check for references awaiting
their bytes, and the cookbook has no query for it, because on this card's base
branch nothing references a blob yet: `Attachment` still carries a `data` BLOB
column, and references by hash arrive with the attachments and assets cards.

The other two checks (outbox depth and age, quarantined blobs) run against the
`blobs` registry, which does exist here, so those are written.

Once the reference tables are in place the content-pending query is a left join
from them to `blobs` on hash, counting references with no matching row, and it
belongs in the cookbook's "Blob store" section beside the others. Better done when
the epic assembles than by guessing the reference column names from here.

## The one piece of Tamanu-side work

Restore reconciles the store against the blob registry. The registry is a database
table and the bytes are a directory tree, captured at different moments, so after a
restore the two can disagree in both directions: a file on disk with no registry
row (invisible to the server) and a registry row with no file (a blob the server
would claim to hold). bestool restores files and knows nothing about the registry,
so this reconciliation belongs to Tamanu, most likely as a startup step on a server
that detects it has been restored.

Decided: folded into the integrity scrub card (P2), not carried here and not given
its own card.

The behaviour is specified in `specs/blob-storage/integrity.md` under "Registry
reconciliation", and `backups.md` cross-references it rather than restating it. P2
already owns periodic detect-and-repair sweeps and the registry's scrub state, so
this is a second direction on the same walk: its verification pass walks the
registry, its reconciliation pass walks the store.

Two reasons it belongs there rather than in a restore-triggered step. A server
cannot readily tell it has been restored, so hanging the work off a restore needs a
detection mechanism that a periodic sweep does not. And the same gap arises without
any restore: an admission interrupted between the atomic rename and the registry
insert strands a blob permanently, since it is never served and never reclaimed
while still consuming disk the free-disk floor measures.

The risk to watch is timing. P2 is a late resilience card and restore needs
reconciliation as soon as the store ships, so if P2 slips, this wants splitting into
a small card depending on E2 alone.

Nothing in the Tamanu codebase changes on this card.
