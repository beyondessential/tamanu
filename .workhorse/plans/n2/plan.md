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

The spec captures both facility store tiers, including cache, which looks wasteful
until the repository is taken into account. The kopia repository is per group and
deduplicating, and the store is content-addressed, so a facility's cache blob that
central's store backup already put in the repository is not transferred again. The
cost of including cache is close to the cost of the metadata.

Worth confirming rather than assuming: this holds only if a deployment's central
and facility servers share one group, and therefore one repository. If they are
grouped separately, dedup does not cross between them and including cache costs
real bytes and money.

## The one piece of Tamanu-side work

Restore reconciles the store against the blob registry. The registry is a database
table and the bytes are a directory tree, captured at different moments, so after a
restore the two can disagree in both directions: a file on disk with no registry
row (invisible to the server) and a registry row with no file (a blob the server
would claim to hold). bestool restores files and knows nothing about the registry,
so this reconciliation belongs to Tamanu, most likely as a startup step on a server
that detects it has been restored.

This is the part of this card that could need a Tamanu code change, and it is worth
deciding whether it lands here or on the store card.
