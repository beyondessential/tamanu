# Sync

How Tamanu keeps a central server, facility servers and mobile devices in step, and why it is built the way it is. Read this before changing anything under a `sync` directory, a model's sync configuration, or the database triggers sync relies on.

The code will tell you how each step works. This document is for what the code cannot tell you: what each part is protecting, and what must stay true.

Companion documents:

- [Dragons](dragons.md): the invariants that have been broken before, what broke, and the known problems still open.
- [The retired model-snapshot path](legacy-model-snapshot.md): how pulls were built before the lookup table. Not in use. Nothing in this document depends on it.

## Before you change sync

Sync is in its current shape because of years of learning from flearning from flearning from flearning from learning from failures on large, busy deployments. Most of what looks redundant was added to close a specific hole, and the holes were small: a few milliseconds, one interleaving, one record in a million. So the default is restraint:- Do not change sync as a side effect of other work. If a task that is not about sync leads you into `packages/*/app/sync`, `packages/database/src/sync`, the sync triggers, or a model's sync methods, stop and raise it instead of making the change in passing.
- A sync change should be asked for explicitly, be about sync, and come with tests that exercise the path with the lookup table on (see [Settings and config](#settings-and-config) for why that matters).
- If something looks removable, assume it is a fence. A list of things that look removable and are not is in [Dragons](dragons.md).

## What sync guarantees

- **Each phase lands whole or not at all.** A push is persisted on central in one transaction. A pull is saved on the client in one transaction. Push and pull are separate: a push can succeed and its pull fail, and that is deliberate, because records stranded on a client are a worse outcome than a client that is behind.
- **Work is done from a snapshot.** Whatever is being sent is first copied at a single point in time, then sent. Nothing is read from live tables page by page while they change underneath.
- **Order comes from a logical clock that central owns.** Not wall-clock time. See [The clock](#the-clock).
- **Central is the only place conflicts are resolved.** A client pushes before it pulls so that central sees local changes first, and then takes whatever central gives it without comparing.
- **Each client holds a subset.** Everything a client needs to run, plus the full records of the patients marked for sync at its facilities.
- **Changes are detected by database triggers, not ORM hooks.** A write made by raw SQL in a psql session is tracked the same as one made by a model. This holds on the servers. Mobile is the exception, described in its own section.
- **Applying the same data twice is safe.** Sessions get interrupted and repeated. Nothing may depend on a record arriving exactly once.

Where there is a choice, responsibility sits with the client. A client holds its own cursors, tells central which facilities it serves and (on mobile) which tables it wants, and asks for a resync when it needs one. Central keeps only what it needs for its own job: the clock, the queue of waiting devices, which device pushed what, and the lookup table's cursor.

## Vocabulary

| Term | Meaning |
| --- | --- |
| Sync client | A facility server or a mobile device. Anything that syncs with central. |
| Session | One push-then-pull exchange between a client and central, with a row in `sync_sessions`. |
| Sync tick | A value of the logical clock. Every synced row carries one in `updated_at_sync_tick`. |
| Tick-tock | Advancing central's clock by two. The first of the pair is the "tick", the second the "tock". |
| Cursor | A tick a client has stored: "I have pushed everything up to here" or "I have pulled everything up to here". |
| Snapshot table | A per-session table in the `sync_snapshots` schema holding the records in flight. An ordinary table, not a temporary one. |
| Lookup table | `sync_lookup` on central: a copy of every syncable record with the columns that decide who receives it. Pulls read from it. |
| Marked for sync | A patient with a `patient_facilities` row for a facility. That facility holds the patient's full record. |
| Multi-facility server | A facility server that serves several facilities (historically "omni server"). It sends several facility ids. |

## The clock

Central holds one number, `currentSyncTick`, in `local_system_facts`. It starts at 1 and only ever goes up.

`tickTockGlobalClock` in `CentralSyncManager.js` adds 2 in a single statement and returns both new values: the tick (the lower) and the tock (the higher, now the stored value). A tick handed out this way belongs to whoever asked for it. Everything central writes on its own account is stamped with the stored value, which is always a tock. So ticks given to clients are even, central's own writes are odd, and no two parties ever hold the same time. That is the whole reason for advancing by two.

A client receives one tick per session, at session start, and makes it its own clock at the start of its push. Every local write from then until its next session is stamped with that tick. A client does not tick between sessions, so every edit it makes in that window happens "at the same time", and how late that time is depends on when it last synced, not on when the edit was made. This is coarse on purpose. It makes ordering trivial and unambiguous, and in practice a patient's record is edited at one facility at a time.

Central tick-tocks at several other points in a session and in each lookup build, for its own purposes. Each is described where it happens. None is spare.

### The trigger

On the servers, every syncing table has a `BEFORE INSERT OR UPDATE` trigger calling `set_updated_at_sync_tick`. The function is defined in migrations; the latest definition wins, so search the migrations for the function name and take the most recent. It does three things:

1. If the `syncTrigger` fact is `disabled`, it does nothing. Migrations run in this mode.
2. If the incoming value is `-1`, it stores `-999`.
3. Otherwise it reads the current tick, takes a shared advisory lock keyed on that tick for the rest of the transaction, and stamps the row with it. Whatever value the write supplied is overwritten.

Step 3 is why a tick cannot be set by hand, and why setting a row's tick to any junk value re-queues it for sync. The lock is the other half of [pending edits](#concurrency).

### Flag values

| Value | Meaning | Who writes it |
| --- | --- | --- |
| Positive | A real tick. | The trigger. |
| `-1` | "This row is arriving from central; do not treat it as a local edit." | A client saving pulled records. The trigger turns it into `-999`. |
| `-999` | Last updated elsewhere. Below every push cursor, so never pushed. | The trigger, from `-1`. Also the column default on facilities and mobile. |
| `0` | The column default on central. | Column default only. |
| `-2` | A `sync_lookup` row written by a build and not yet stamped. | The lookup build. Only ever in `sync_lookup`. |

The trigger special-cases `-1` and nothing else. A later ordinary update to a `-999` row is stamped with the current tick like any other write, which is exactly what marks it as a local edit.

## A session, end to end

The client always drives. Central's long steps run in the background: the request returns at once, and the client polls until the step is done. This pattern exists because the work can take far longer than an HTTP timeout, especially when it is queued behind another client. A background failure is written to the session row and reaches the client on its next poll.

Routes are in `buildSyncRoutes.js`; the work is in `CentralSyncManager.js`.

1. **Ask for a session.** Central checks the user may sync those facilities, closes any unfinished session the same device left behind, and applies the queue and the capacity limit. If there is no room the client is told it is queued and tries again later; no session exists.
2. **Start** (`startSession`). Central creates the session row and returns its id. In the background, `prepareSession` creates the snapshot table and tick-tocks. That tick is the client's new clock.
3. **Push.** The client snapshots its changes since its push cursor and sends them in pages (`addIncomingChanges`), which central writes to the snapshot table and nothing else.
4. **Complete the push** (`completePush`). In the background, `persistIncomingChanges` saves the pushed records into the real tables in one transaction.
5. **Initiate the pull** (`initiatePull`). In the background, `setupSnapshotForPull` copies everything this client should receive since its pull cursor into the snapshot table.
6. **Pull.** The client fetches the snapshot in pages (`getOutgoingChanges`) into its own staging area, then saves it all in one transaction along with its new pull cursor.
7. **End.** The client deletes the session; central drops the snapshot table. A session that errors keeps its tables for a day for debugging, then a cleaner removes them.

"Is this step still running?" is answered across processes by an advisory lock on the session id, held by a transaction for as long as the background step runs (`markSessionAsProcessing`). Any API process can probe it. If the lock is free but the step never recorded finishing, central restarted mid-step, and the session is errored.

### Persisting a push

`persistIncomingChanges`, in order, inside one transaction:

1. Pause audit logging, unless the client is mobile. A facility has already written its own changelog rows and sends them with each record; mobile keeps no changelog, so central's triggers write it.
2. Tick-tock and keep the tock, T. Every row saved in this transaction is stamped T by the trigger.
3. Run incoming sync hooks. A model may declare `incomingSyncHook` to rewrite what is about to be saved. Two do: `Patient`, which renames clashing display ids instead of letting a unique constraint fail the push, and `AppointmentSchedule`.
4. Save (`saveIncomingChanges`): models in dependency order, constraints deferred to the end, ORM hooks off so that saving one record cannot trigger side effects on another.
5. Record `(device, T)` in `sync_device_ticks`.
6. Tick-tock again, so that nothing after this can be stamped T.

After the transaction commits: `adjustDataPostSyncPush`, then `bumpSyncTickForRepull`, which re-stamps any record a hook changed so that it goes back to the client that pushed it.

T does a lot of work. Because the first tick-tock is uncommitted until the transaction ends, no other transaction can read T as the current tick; because of the second, none can afterwards. So a row stamped T was certainly written by this push, and that is how central later knows not to send it back to the device it came from. Both tick-tocks, their position inside the transaction, and the post-commit steps sitting outside it are all part of that.

A pushed record is checked on the way in only for being a known model whose sync direction allows pushing. Its shape is not validated; database constraints at save time are the safety net. A few models with effects outside the database (emails, report requests) sanitise pushed records on central with `sanitizeForCentralServer`.

### Building a pull

`setupSnapshotForPull`, in order:

1. Wait for a snapshot slot (a separate limit from the session limit).
2. Tick-tock and keep the tick. This is `pullUntil`, the cursor the client will store.
3. Wait for pending edits below that tick. See [Concurrency](#concurrency).
4. Work out which patients were marked for sync since the client's cursor, by reading `patient_facilities` directly.
5. In one repeatable read transaction, copy from the lookup table into the snapshot table in up to three passes: everything, from the beginning of time, for newly marked patients; everything changed since the cursor for the rest; and, for mobile only, any tables it asked to resync from scratch.

The snapshot has no upper bound. Rows newer than `pullUntil` that are visible when the transaction starts are sent, and sent again next time. That is harmless and intended: `pullUntil` is the point central is certain the client is complete to, not a limit on what it may receive.

Newly marked patients are found by central, not declared by the client. A client never has to send a list of patients; marking one is just another record that syncs.

## What syncs where

### Direction

Each model declares one of five directions in `SYNC_DIRECTIONS`:

| Direction | Meaning |
| --- | --- |
| Bidirectional | Pushed and pulled. Most clinical data. |
| Pull from central | Pulled only. Users, permissions, surveys, locations, settings. |
| Push to central | Pushed only; the client keeps its copy. |
| Push to central then delete | Pushed, then the facility deletes its copy. For records central acts on (attachments, patient communications, certificate notifications), where a second copy would be processed twice or show a stale status. Mobile has no equivalent. |
| Do not sync | Never leaves the server it is on. The table has no tick column. |

### Scope

Direction says whether a table syncs. Scope says which clients receive a given row, and for pulls it is decided when the row is copied into the lookup table. A model's `buildSyncLookupQueryDetails` supplies the scope columns:

| Scope | Which clients receive the row | How |
| --- | --- | --- |
| Everywhere | All. | No scope columns set. Reference data, users, surveys, and every `patients` row. |
| Patient | Those with the patient marked for sync. | `patient_id`, directly or through the row's encounter. |
| Facility | Those serving that facility. | `facility_id`. Only for records that genuinely belong to one facility: settings, `patient_facilities`, appointments. |
| Sensitive network | Those whose facilities are in the same network. | `sensitive_network_id`, carried by every encounter-linked model. Specified in `specs/sync/sensitive-networks.md`. |
| Lab request | Also any facility with `sync.syncAllLabRequests` on. | `is_lab_request`. For a facility that runs the lab for others, without marking every patient in the country. |

Two things to hold on to:

- **A row with no scope columns goes to everyone.** Leaving a scope column null is a decision, not a default. It has leaked data twice.
- The lab-request arm sits ahead of patient and network scoping. A facility syncing all lab requests receives lab requests and their encounters from inside a sensitive network it is not part of. The sensitive networks spec states the ordering, but the interaction was carried over when networks were added and never decided on its merits. Treat it as an open question, not a designed exception.

There is no constant that defines "reference data" for sync. What syncs everywhere is simply every model that sets no scope.

### What travels

- Four columns never sync, on any model: `createdAt`, `updatedAt`, `deletedAt`, `updatedAtSyncTick`. They are each server's own bookkeeping.
- Everything else does, including the whole user row with its password hash, to every client. Offline login depends on it.
- **Deletes are soft.** A delete travels as an `isDeleted` flag beside the record, and the receiver sets or clears `deleted_at` in the same statement as the rest of the record. A hard delete tells nobody: other servers keep the row forever. The reason is structural: sync works from what a row says about itself, and a row that is gone says nothing.
- **A record is one `id`.** A few tables have composite keys in the database; each also has a stored generated `id` built from the parts, and that is what sync uses.

### Marking patients for sync

A patient is marked at a facility automatically by clinical activity there (creating the patient, an encounter, an appointment or booking, a program registration, an edit on mobile) or deliberately by a user. Specified in `specs/sync/marking-patients-for-sync.md`. Marks are records like any other and sync to central.

Nothing unmarks a patient. No UI, route or task removes a mark, and since hard deletes do not travel, removing one by hand would leave the patient's data on the facility with nothing to tidy it up. Do not do it.

## The lookup table

Working out which rows belong to which client is expensive. A note may hang off an encounter, or a lab request on an encounter, or an imaging request, or directly off a patient, and notes are the largest table there is. This used to be worked out for every table, in every session, for every client.

The lookup table moves that work out of the session. `sync_lookup` holds one row per syncable record: the record as JSON, its scope columns, and a tick. A scheduled task rebuilds what has changed (every 20 seconds by default), and a pull becomes one indexed query on one table. Specified in `specs/sync/lookup-table.md`.

The cost is a lag. A write on central cannot be pulled until the next build has picked it up. In particular, **a session's pull does not see that session's own push.**

### A build

`updateLookupTable` in `CentralSyncManager.js` drives it; the per-model work is in `updateLookupTable.js`.

1. Tick-tock, and wait for pending edits below that tick. The tick is the new build cursor: every source row up to it is now committed and visible.
2. In one repeatable read transaction: for each model, upsert every source row changed since the previous cursor, with tick `-2`; rebuild rows for patients flagged after a merge; heal rows flagged as drifted; store the new cursor.
3. After that commits, in a second short transaction: tick-tock, and stamp every `-2` row with that tick.

The two-step stamping is the subtle part. A lookup row needs a tick later than any `pullUntil` already handed out, or a client whose cursor has passed it would never see it. A build can run for a long time and cannot know in advance when it will commit. Stamping at the end, in a transaction that holds the clock for only a moment, gets the same result without stopping every session for the length of the build. Rows at `-2` are invisible to pulls, which only ever ask for ticks above their cursor.

The very first build is different: it copies each record's own tick, so that clients do not see the whole database as new. Central refuses sessions until it has finished.

### Not sending a client its own changes

When a build copies a row, it looks up the row's tick in `sync_device_ticks`. If a push was persisted at exactly that tick, the row is attributed to that device (`pushed_by_device_id`), and that device's pulls skip it. Any later change to the row gives it a different tick and clears the attribution. This rests entirely on the persist tick being unique to one push, as described under [Persisting a push](#persisting-a-push).

### Drift and healing

The lookup table is a copy, and copies drift:

- **Writes with the trigger off** (migrations) do not advance a row's tick, so a build would not notice them. On central, a second trigger flags the lookup row instead, and the build's heal pass rebuilds flagged rows, keeping their existing tick so that clients which already hold the record do not pull it again. An upgrade does not complete while any row is still flagged.
- **A hard delete** flags the lookup row for removal.
- **A change that moves a row's scope without touching the row** (a patient merge re-pointing children) is not caught by either. The merge flags the affected patients for rebuild, and migrations can flag a whole model.

## Conflict resolution

Two versions of a record meet in exactly one place: when central saves a push and the record already exists there.

- **Per record, the last push wins.** `mergeRecord` returns the incoming record. No ticks are compared.
- **Per field, for one model.** A model that carries `updatedAtByField` is merged field by field, each field taking the version with the higher tick. Only `patient_additional_data` does this. It was built as a trial, and was not rolled out further because conflicts have not been a problem worth the extra cost.
- **Clients do not resolve anything.** A client saving a pull overwrites what it has. The one protection is that a facility aborts the whole session if a record it is about to overwrite was edited locally after its push snapshot was taken. The edit is then pushed next session, central resolves, and the facility pulls the result.

The logical clock invites the assumption that the highest tick wins. It does not, outside the per-field merge. A facility that syncs late can overwrite an edit with a higher tick. This has been left alone deliberately: neither rule knows the real order of events, both are arbitrary in a conflict, and a change here would alter behaviour everywhere at once. Do not "correct" it in passing.

> [!WARNING]
> In a true conflict, the lookup table's lag currently breaks the last step. The pushing client wins on central, then pulls the other side's stale version in the same session, and is never sent its own back. The same applies to a per-field merge. This is a known open problem; see [Dragons](dragons.md).

## Concurrency

Central serves many clients at once from several processes, alongside an admin panel, imports and scheduled tasks all writing to the same tables. Everything is coordinated in the database, never in process memory, because a second process would not see it. Four mechanisms do nearly all the work.

**The clock row lock.** A tick-tock is an update to one row. Made inside a transaction, it holds that row's lock until the transaction ends, and every other tick-tock waits. Reading the clock never waits: a reader sees the last committed value, which is what lets a transaction hold a tick nobody else can see. The persist transaction holds the lock for the whole persist and the lookup build's stamping transaction holds it briefly, neither with an explicit lock, only by where their tick-tock is placed. An import takes the same row lock explicitly and holds it for the whole import. Since starting a session, starting a pull snapshot, starting a lookup build and persisting a push all begin with a tick-tock, they all queue behind whichever of those is running. This is what "you cannot sync during an import" means, and why persists happen one at a time.

**The private tock.** Described under [Persisting a push](#persisting-a-push): a tick that only one transaction can ever write with.

**Pending edits.** The problem: a transaction stamps a row with tick 7 and stays open. A pull comes through with `pullUntil` 10, does not see the uncommitted row, and the client records that it is complete to 10. The transaction then commits. The row is at 7, behind the client's cursor, and is never sent. Imports made this real, since they are long and commit all at once.

The answer is the shared advisory lock the trigger takes on the tick it stamps with. Anything about to treat "everything up to T" as complete first lists the ticks below T that have a shared lock held, and takes and releases an exclusive lock on each (`waitForPendingEdits`), which waits until every such transaction has finished. Central does this before a lookup build and before a pull snapshot; a facility does it before its push snapshot.

The pull still needs it even though it reads the lookup table, because it reads `patient_facilities` directly to find newly marked patients. Without the wait, a patient marked in a slow transaction could be missed for good.

**The pending flag.** Described under [A build](#a-build): `-2` rows, stamped afterwards.

### Isolation

Snapshots are taken in repeatable read transactions so that every table is read as of the same instant, and a child cannot be copied without its parent: the pull snapshot, the lookup build, the facility's push snapshot, and the facility bootstrap. Inside one, only read shared tables. Writing a row that something outside also writes (the session row, which every poll touches) raises a serialisation failure, and nothing retries those. That is why session updates sit just outside these transactions.

Everything else in sync runs at the default, read committed, and pending edits depend on it. Above read committed a transaction sees the clock as it was at its first statement, however long it then runs, while the trigger takes its lock only at the first write to a synced table. In between, nothing marks that tick as in use, and a snapshot can pass it. So a transaction at repeatable read or serializable that writes synced rows needs to hold the clock itself. The importer runs serializable and does exactly that, which is the real reason it locks the clock row.

### Advisory lock keys

Advisory locks are global to the database and identified by a number. Plain integers are sync ticks. Every other use (the session processing lock, the create-session lock, and several outside sync) derives its key by hashing a string. Keep it that way. The two ranges do overlap, and the trigger does not check whether its lock was granted, so a clash would leave an edit untracked.

### Capacity

Separately from correctness, central limits how much runs at once: `sync.maxConcurrentSessions` and `sync.numberConcurrentPullSnapshots`. Waiting devices queue, urgent requests first, then whoever has gone longest without syncing. Each lock held is also a database connection held, so these limits and the connection pool size are related.

## The facility server as a client

Code: `packages/facility-server/app/sync/`, driven by `FacilitySyncManager.js`. The sync loop runs in its own process; the API process asks it to sync over a local connection.

### When it syncs

On a schedule (every minute by default), and at once when a user asks or marks a patient for sync. If a sync is asked for while one is running, one follow-up is queued to run straight after, and every caller waits on that same follow-up. The follow-up exists because the running sync took its snapshot before the request and cannot contain what prompted it.

A brand new facility first fetches a small bootstrap (users, roles, settings, reference data) so that people can log in while the first full sync runs. Specified in `specs/sync/bootstrap.md`. It reads the source tables directly instead of the lookup table, and leaves the pull cursor unset, so the first real sync pulls everything again over the top.

### Push

1. Read the current local tick, then replace it with the tick central issued for this session. New writes are stamped with the new tick from here on.
2. Wait for pending edits on the old tick.
3. Snapshot, in repeatable read, every row in a pushable table with a tick above the push cursor. There is no filter: everything changed locally goes. The snapshot is held in memory, since a facility only ever pushes what changed since last time.
4. Attach each record's changelog rows and send in pages. Page size adapts to how long the last page took.
5. Wait for central to persist.
6. Delete local copies of push-then-delete records.
7. Store the old tick as the push cursor.

Step 7 happens before the pull and outside any transaction. A push is recorded as done whatever happens next.

### Pull

1. Ask central to build the snapshot and wait.
2. Fetch pages into a local snapshot table, so that a first sync does not have to fit in memory and the database is never left half updated.
3. Run the check for records edited locally since the push (`assertIfPulledRecordsUpdatedAfterPushSnapshot`). If any are found, fail the session.
4. In one transaction: pause audit logging, defer constraints, save everything (`saveIncomingChanges`, the same function central uses to persist a push), insert central's changelog rows, and store `pullUntil` as the pull cursor.

Pulled rows are written with tick `-1`, which the trigger stores as `-999`, so they are not mistaken for local edits and pushed back. Deletes and restores are written in the same statement as the record for the same reason: a separate delete would be stamped as a local edit and echo back to central.

The cursor is saved in the same transaction as the records. If it were saved separately and failed, the saved rows would be pulled again and could then be taken for edits.

### Its cursors

Three facts in `local_system_facts`: the current tick, the last successful push, the last successful pull. Push stores the tick from before the session; pull stores `pullUntil`. The web app's "is this patient fully synced" check reads both, so their meaning is visible to users.

## The mobile app as a client

Code: `packages/mobile/App/services/sync/`, driven by `MobileSyncManager.ts`. Mobile is TypeORM on SQLite, and shares the protocol with the facility server but almost none of the code. This section says where it differs; where it does not, it follows the facility section above.

### What is the same

- Push, then pull, with the same routes, the same background-and-poll pattern, and the same three cursors with the same meaning ([Its cursors](#its-cursors)).
- The session tick becomes the local clock at the start of the push, and the push cursor is stored as the old tick after the push, before the pull ([Push](#push)).
- The pull is saved in one transaction with the pull cursor ([Pull](#pull)).

### No triggers

Mobile has no database triggers. A listener on the base model stamps `updatedAtSyncTick` before an insert or update made through an entity's `save()`. Writes that go around it (raw SQL, bulk updates, every migration) are not stamped and will not be pushed. This is the one place the "triggers, not hooks" principle does not hold, so on mobile, a write to a synced table must go through the model.

Pulled records are written with hand-built SQL that leaves the tick column out altogether: new rows take the default `-999`, existing rows keep whatever they had.

Two of the facility's guards have no counterpart on mobile:

- No wait for pending edits before the push snapshot. A save that reads the tick just before the push replaces it could, in principle, be written with the old tick after the snapshot and never be pushed. The window is small on a single connection, and unguarded.
- No check for records edited locally between the push snapshot and the pull being saved. A pulled record overwrites such an edit.

### What it sends and receives

- A device serves one facility and sends `isMobile`. It names the tables it wants; central has no list of what a mobile device holds.
- It holds a smaller set of tables than a facility, and pulls the patients marked for sync at its facility, the same set as every other device there.
- It keeps no changelog. Central writes audit rows when it persists a mobile push, and does not send changelog rows to mobile.
- Sync-all-lab-requests never applies to mobile.
- Push bodies are compressed.

### Pulling

There are two paths, chosen by whether the pull cursor is unset.

- **Initial sync** saves each page as it arrives, all inside one transaction, with no staging. The user cannot do anything useful until it finishes, so a half-written database is acceptable as long as it rolls back on failure.
- **Incremental sync** stages the pull first, in a throwaway SQLite file attached beside the main database, then saves from it in one transaction. Keeping staging out of the main database's journal is purely for speed; if anything fails the file is dropped and the pull repeated.

Foreign keys are deferred for the whole save and checked at commit, so the order records arrive in does not matter. Only if the commit fails does mobile go looking for which record was at fault.

### Schema changes

On the servers a data migration runs everywhere and nothing needs to sync ([Migrations and sync](#migrations-and-sync)). Mobile does the same where it can. Where it cannot, typically a new table that the servers already hold data for, the migration records the table name locally, the next pull asks central for that table from the beginning, and the request is cleared in the same transaction that saves the result.

### Lifecycle

Mobile syncs every five minutes while the app is open, and at once when the user asks or marks a patient. Nothing runs in the background. If a sync is requested while one is running, the request is dropped, not queued. The screen is kept awake for the length of a sync (`specs/sync/mobile-keep-awake.md`). If the app is killed mid-sync, the cursors have not moved and the next sync repeats the work.

## Migrations and sync

Migrations run with the sync tick trigger switched off, by a fact set before the batch and cleared after it. Rows changed by a migration keep their ticks and are not synced.

The reason: every server runs the same migrations. A data migration that is deterministic produces the same result on central and on each facility, in place, without sending anything. Syncing the result as well would move the same rows across the network for nothing, and for a large table that could be most of the database.

What follows from that:

- **A data migration must be deterministic**: the same input rows give the same output on every server. If it depends on something that differs between servers, the servers will silently disagree afterwards.
- **Central's lookup table must end up holding the migrated form**, because a facility that marks a patient next week will pull that patient's history from it. Writes made while the trigger is off flag the lookup rows they touch, and the heal pass rebuilds them. A migration that changes who should receive a row without writing to the row needs to flag the model or the patients for rebuild itself.
- **If a migration batch fails, the trigger stays off** until a later batch succeeds. A server in that state stamps nothing.
- Mobile has its own migrations and no trigger; see [Schema changes](#schema-changes).

## Where things are

| What | Where |
| --- | --- |
| Sync routes on central | `packages/central-server/app/sync/buildSyncRoutes.js` |
| Sessions, persist, pull snapshot, lookup build | `packages/central-server/app/sync/CentralSyncManager.js` |
| Reading the lookup table for a pull | `packages/central-server/app/sync/snapshotOutgoingChanges.js` |
| Per-model lookup build | `packages/central-server/app/sync/updateLookupTable.js` |
| Code shared by central and facility: saving, merging, snapshot tables, pending edits | `packages/database/src/sync/` |
| The facility client | `packages/facility-server/app/sync/` |
| The mobile client | `packages/mobile/App/services/sync/` |
| A model's sync declarations | `syncDirection`, `buildSyncLookupQueryDetails`, `buildSyncFilter`, and optional hooks, on each model in `packages/database/src/models/` |
| Trigger functions | Migrations in `packages/database/src/migrations/`; latest definition wins |
| Installing triggers on each table | `packages/database/src/services/migrations/hooks/postMigrationHooks.ts` |
| Flag values and excluded columns | `packages/database/src/sync/constants.ts` |
| Specs | `specs/sync/` |
| Support runbooks | `docs/runbooks/sync-*.md` |

## Settings and config

Almost every sync tunable is a config file key, not a setting, on both servers. The ones that change behaviour and not just pacing:

| Key | Where | Default | What it does |
| --- | --- | --- | --- |
| `sync.lookupTable.enabled` | Central config | true | Whether pulls read the lookup table. Off selects the [retired path](legacy-model-snapshot.md), which lacks sensitive network scoping and is not a safe fallback. **The central test config sets this to false**, so a sync test exercises the retired path unless it turns the lookup table on itself. |
| `sync.lookupTable.avoidRepull` | Central config | true | Whether a device is spared its own pushed records. |
| `sync.maxConcurrentSessions` | Central config | 4 | Sessions at once before clients queue. |
| `sync.numberConcurrentPullSnapshots` | Central config | 4 | Pull snapshots building at once. |
| The `syncLookupRefresher` schedule | Central | every 20 seconds | How often the lookup table is rebuilt. Read once at startup. |
| `sync.syncAllLabRequests` | Facility setting | false | The lab-request scope. |
| `sync.streaming.enabled` | Central setting | false | Streamed instead of polled responses for facility servers. |
| `sync.schedule` | Facility config | every minute | How often a facility syncs. |
| `sync.assertIfPulledRecordsUpdatedAfterPushSnapshot` | Facility config | true | The check for local edits made since the push. |
| `mobileSync.*` | Central setting | | Mobile batch sizes and paging, sent to the device at login. |

The first two are rollout flags left over from introducing the lookup table and are due to be removed along with the path they switch to.
