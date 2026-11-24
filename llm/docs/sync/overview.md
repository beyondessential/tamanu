# Sync

How Tamanu keeps a central server, facility servers and mobile devices in step, and why it is built the way it is. Read this before changing anything under a `sync` directory, a model's sync configuration, or the database triggers sync relies on.

The code will tell you how each step works. This document is for what the code cannot tell you: what each part is protecting, and what must stay true.

Companion documents:

- [Dragons](dragons.md): the invariants that have been broken before, what broke, and the known problems still open.
- [The retired model-snapshot path](legacy-model-snapshot.md): how pulls were built before the lookup table. Not in use. Nothing in this document depends on it.

## Before you change sync

Sync is in its current shape because of years of learning from failures on large, busy deployments. Most of what looks redundant was added to close a specific hole, and the holes were small: a few milliseconds, one interleaving, one record in a million. So the default is restraint:

- Do not change sync as a side effect of other work. If a task that is not about sync leads you into `packages/*/app/sync`, `packages/database/src/sync`, the sync triggers, or a model's sync methods, stop and raise it instead of making the change in passing.
- A sync change should be asked for explicitly, be about sync, and come with tests that exercise the path with the lookup table on (see [Settings and config](#settings-and-config) for why that matters).
- If something looks removable, assume it is a fence. A list of things that look removable and are not is in [Dragons](dragons.md).

## What sync guarantees

- **Atomic: each phase lands whole or not at all.** A push is persisted on central in one transaction. A pull is saved on the client in one transaction. Push and pull are separate: a push can succeed and its pull fail, and that is deliberate, because records stranded on a client are a worse outcome than a client that is behind.
- **Coherent: work is done from a snapshot.** Whatever is being sent is first copied at a single point in time, then sent. Nothing is read from live tables page by page while they change underneath.
- **Order comes from a logical clock that central owns.** Not wall-clock time. See [The clock](#the-clock).
- **Central is the only place conflicts are resolved.** A client pushes before it pulls so that central sees local changes first, and then takes whatever central gives it without comparing.
- **Each client holds a subset.** Everything a client needs to run, plus the full records of the patients marked for sync at its facilities.
- **Changes are detected by database triggers, not ORM hooks.** A write made by raw SQL in a psql session is tracked the same as one made by a model. This holds on the servers. Mobile is the exception, described in its own section.
- **Idempotent: applying the same data twice is safe.** Sessions get interrupted and repeated. Nothing may depend on a record arriving exactly once.

Where there is a choice, responsibility sits with the client. A client holds its own cursors, tells central which facilities it serves and (on mobile) which tables it wants, and asks for a resync when it needs one. Central keeps what it needs for its own job: the clock, the queue of waiting devices, which device pushed what, and the lookup table's cursor.

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
| In-flight lock | The lock a write takes on the tick it is stamping with, held until its transaction ends. It is how sync knows a tick still has uncommitted writes (aka pending edits). |
| Marked for sync | A patient with a `patient_facilities` row for a facility. That facility holds the patient's full record, and it is kept in sync with changes elsewhere in the system. |
| Omni-server / Multi-facility server | A facility server that serves several facilities. It sends several facility ids. |

## The clock

Central holds one number, `currentSyncTick`, in `local_system_facts`. It starts at 1 and only ever goes up (i.e. is monotonic).

The way this goes up is not attached to wall clock time. Whenever a client syncs, it "tick-tocks" the clock. This means incrementing the local system fact by 2 in a single statement, and returning both new values. The tick (the lower) is handed to the client doing the sync, and the tock (the higher) is stored as the central server's new `currentSyncTick`. With this system, every node in the sync system (all clients plus central) has a different, unique current sync tick at all times. Ticks given to clients are even, central's own writes are odd, and no two parties ever hold the same time. That is the whole reason for advancing by two.

A client receives one tick per session, at session start, and makes it its own clock at the start of its push. Every local write from then until its next session is stamped with that tick. A client does not tick between sessions, so every edit it makes in that window happens "at the same time", and how late that time is depends on when it last synced, not on when the edit was made. This is coarse on purpose. It makes ordering trivial and unambiguous, and in practice a patient's record is edited at one facility at a time.

Central tick-tocks at several other points in a session and in each lookup build, for its own purposes. Each is described where it happens. None is spare, but only that first tick, from the start of the session, becomes the client's clock. The later ones are for central's own bookkeeping.

### The trigger

On the servers, every table that syncs has a database trigger that runs before each insert or update, and calls the function `set_updated_at_sync_tick`. This is what stamps each row with the current sync tick, so that sync can tell what has changed since it last looked. Because it runs inside the database, it catches every write, whether it came through a model, a migration, or someone typing SQL into psql.

The function is defined in migrations, and has been redefined several times. To read its current form, search the migrations for the function name and take the most recent one.

It does three things, in order:

1. If the `syncTrigger` local system fact is set to `disabled`, it does nothing and leaves the row's tick alone. Migrations run in this mode (see [Migrations and sync](#migrations-and-sync)).
2. If the write is setting the tick to `-1`, it stores `-999` instead. This is how a client saves a record it has pulled without that looking like a local edit (see [Flag values](#flag-values)).
3. Otherwise it reads the current sync tick, takes an in-flight lock on that tick value for the rest of the transaction (this is important; see "in-flight lock" below), and stamps the row with it. Whatever tick the write supplied is thrown away.

Step 3 has two consequences worth knowing:

- **Trigger always wins:** A tick cannot be set by hand, in JS, or in any way other than the trigger. Write any value other than `-1` and the trigger replaces it with the current tick. That is also how a record gets re-queued for sync, since touching the row is enough.
- **In-flight lock:** The lock taken on the tick during a write is how sync finds out about writes that are still in progress, i.e. transactions that have stamped a row but not yet committed. That is covered under pending edits in [Concurrency](#concurrency).

### Flag values

Most values of `updated_at_sync_tick` are real ticks, but a few are flags with a special meaning:

| Value | Meaning | Who writes it |
| --- | --- | --- |
| Positive | A real tick. | The trigger. |
| `-1` | "This row is arriving from central; do not treat it as a local edit." | A client saving pulled records. The trigger turns it into `-999`. |
| `-999` | Last updated elsewhere. Will never be pushed (-999 is below every push cursor). | The trigger when it sees a `-1`. Also the column default on facilities and mobile. |
| `0` | The column default on central. | Column default only. |
| `-2` | A `sync_lookup` row written by a build and not yet stamped. | The lookup build. Only ever in `sync_lookup`. |

The trigger only treats `-1` specially. Every other value, including `-999`, `0` and `-2`, is overwritten with the current tick on the next write. So when someone later edits a row that came from central (sitting at `-999`), it gets a real tick, which is what marks it as a local edit to push.

## A session, end to end

A sync session is always driven by the client, and always goes push first, then pull.

Several of central's steps can take a long time, e.g. when they are queued behind another client, or working through a first sync. An HTTP request cannot stay open that long, so those steps are asynchronous: the request returns straight away, central carries on in the background, and the client polls a "ready yet?" endpoint until the step is done. If a background step fails, the error is written to the session's row, and the client finds out on its next poll.

The routes are in `buildSyncRoutes.js`, and the work behind them is in `CentralSyncManager.js`.

1. **Ask for a session.** The client asks central to start a sync. Central checks the user is allowed to sync those facilities, closes any unfinished session the same device left behind, and checks whether it has capacity. If it does not, the client is told it is queued and tries again later. No session exists yet at that point.
2. **Start the session** (`startSession`). Central creates the session row and returns its id. In the background (`prepareSession`), it creates the session's snapshot table and tick-tocks the clock. The tick from that is handed to the client as its new clock.
3. **Push.** The client takes a snapshot of everything it has changed since its push cursor and sends it up in pages (`addIncomingChanges`). Central writes each page into the snapshot table, and does nothing else with it yet.
4. **Complete the push** (`completePush`). Once every page is up, the client says so. In the background (`persistIncomingChanges`), central saves the pushed records into its real tables, all in one transaction.
5. **Initiate the pull** (`initiatePull`). In the background (`setupSnapshotForPull`), central copies every record this client should receive since its pull cursor into the snapshot table.
6. **Pull.** The client downloads that snapshot in pages (`getOutgoingChanges`) into its own staging area. Once it has everything, it saves it all in one transaction, along with its new pull cursor.
7. **End the session.** The client deletes the session and central drops the snapshot table. If the session errored instead, the table is kept for a day so it can be inspected, then cleaned up.

Central runs as several node processes, so "is this background step still running?" cannot be answered from memory inside any one process. Instead, the process doing the work holds a lock in the database, keyed on the session id, for as long as the step runs (`markSessionAsProcessing`). Any process can check whether that lock is held. If the lock is free but the step never recorded that it finished, central must have restarted part way through, and the session is marked as errored.

### Persisting a push

This is `persistIncomingChanges`. Everything in the numbered list happens inside one database transaction, in this order:

1. **Pause audit logging**, unless the client is mobile. A facility server has already written its own changelog rows, and sends them along with each record. Mobile keeps no changelog, so for a mobile push central's own triggers write it XXX [add the effect of this being that between syncs we can't tell what happened on mobile or by different users].
2. **Tick-tock, and use the tock for all changes.** Call the tock T. Every row saved in this transaction is stamped T by the trigger.
3. **Run incoming sync hooks.** A model can declare `incomingSyncHook` to adjust records before they are saved. Two models do. `Patient` renames clashing display ids, so that two facilities registering the same id does not fail the whole push on a unique constraint. `AppointmentSchedule` removes later appointments when a schedule has been cancelled.
4. **Save the records** (`saveIncomingChanges`). Models are saved in dependency order, i.e. a table is saved after the tables its foreign keys point to XXX [this is no longer necessary hey, for the reason in the next sentence]. Constraints are deferred until the end of the transaction. Sequelize hooks are switched off, so that saving one record cannot trigger side effects on another.
5. **Record that this device pushed at T**, as a row in `sync_device_ticks`.
6. **Tick-tock again**, so that nothing written after this point can be stamped T (this is important; see "the two tick-tocks" below).

After the transaction commits, two more things run: `adjustDataPostSyncPush`, which lets a model make follow-up changes, and `bumpSyncTickForRepull`, which re-stamps any record a hook changed so that it is sent back to the client that pushed it.

**The two tick-tocks:** T has to be unique to this push, so that all records pushed in this session, _and only_ records pushed in this session, are stamped with that tick. The first tick-tock happens inside the transaction, so until the transaction commits, no other transaction can see T as the current tick. The second moves the clock past T before the commit, so nobody can see it afterwards either. So any row stamped T can only have been written by this push.

Central relies on that later, to avoid sending a device its own changes back (see [Not sending a client its own changes](#not-sending-a-client-its-own-changes)). It is also why the two follow-up steps run after the transaction and not inside it: their changes need a different tick, so that they do go back to the client.

Pushed records are only lightly validated on the way in. Central checks that each one is for a known model, and that the model's sync direction allows pushing. It does not check the shape of the record. If a record is malformed, a database constraint rejects it when it is saved, and the session fails. A few models whose records cause something to happen outside the database (e.g. sending an email, running a report) clean up what was pushed first, using `sanitizeForCentralServer`. XXX [I don't know what this last sentence is referring to]

### Building a pull XXX [I'm surprised we don't have "building a push"?]

This is `setupSnapshotForPull`, which is a central-side snapshot process. In order:

1. **Wait for a snapshot slot.** Only a few snapshots are built at once. This is a separate limit from the limit on sessions.
2. **Tick-tock, and use the tick.** This becomes `pullUntil`: the cursor the client will store once it has saved the pull.
3. **Wait for pending edits** below that tick, i.e. for any transaction still in flight that has already stamped rows with an earlier tick (see [Concurrency](#concurrency)).
4. **Work out which patients are newly marked for sync**, by reading `patient_facilities` for any added since the client's last successful pull.
5. **Copy records from the lookup table into the snapshot table.** This happens inside one repeatable read transaction, so that everything is read as at a single moment. There are up to three passes: the full history of newly marked patients; everything changed since the cursor for everyone else; and, for mobile only, any tables it asked to sync again from scratch.

There is no upper limit on what goes into the snapshot. If a row newer than `pullUntil` is visible when the transaction starts, it is sent, and it will be sent again next time. That is fine, and intended. `pullUntil` means "central is certain you are complete up to here", not "you have nothing newer than this".

Note that the client doesn't tells central which patients it wants in each sync session request. Marking a patient for sync is just another record that syncs up, and central works out from it that the patient's history needs to go down.

## What syncs where

### Direction

Every model declares a sync direction, which says whether its table syncs at all, and which way. There are five (`SYNC_DIRECTIONS`):

| Direction | Meaning |
| --- | --- |
| Bidirectional | Pushed and pulled. Most clinical data. |
| Pull from central | Pulled only. Reference data, e.g. users, permissions, surveys, locations, diagnoses, settings. |
| Push to central | Pushed only; the client keeps its copy. |
| Push to central then delete | Pushed, then the facility deletes its copy. For records central acts on (attachments, patient communications, certificate notifications), where a second copy would be processed twice or show a stale status. Mobile has no equivalent. |
| Do not sync | Never leaves the server it is on. The table has no tick column. XXX [e.g.] |

### Scope

Direction says whether a table syncs. Scope says which clients receive a particular row. XXX [this line doesn't sound like me]

For pulls, scope is worked out when the row is copied into the lookup table, not when a client asks. Each model has a `buildSyncLookupQueryDetails` method that fills in the lookup row's scope columns:

| Scope | Which clients receive the row | How |
| --- | --- | --- |
| Everywhere | All. | No scope columns set. Reference data, users, surveys, and every `patients` row. |
| Patient | Those with the patient marked for sync. | `patient_id` column set. Patient found directly or through the row's encounter. |
| Facility | Those serving that facility. | `facility_id` column set. Only for records that belong to one facility: settings, `patient_facilities`, appointments. |
| Sensitive network | Those whose facilities are in the same network. | `sensitive_network_id` set to true, for every encounter-linked model. See `specs/sync/sensitive-networks.md`. |
| Lab request | Any facility with `sync.syncAllLabRequests` on. | `is_lab_request` set to true. For a facility that runs the lab for others, without syncing every patient in the country. |

Two things to be careful of:

- **Empty scope means everyone:** A row with no scope columns goes to every client, so leaving a scope column empty needs to be a deliberate choice.
- **Lab requests skip the other scopes:** Lab requests are checked before patient and network scope, so a facility that syncs all lab requests receives lab requests, and the encounters they belong to, from inside a sensitive network it is not part of. Changing this is an open question; see Slack.

### What travels

- **Bookkeeping columns stay put:** Four columns never sync, on any model: `createdAt`, `updatedAt`, `deletedAt` and `updatedAtSyncTick` XXX [hold on the last one syncs for conflict resolution no?]. These are each server's own bookkeeping about the row.
- **Everything else travels:** That includes the whole user row with its password hash XXX [wrong spot for this], which goes to every client. Logging in while central is unreachable depends on it.
- **Soft deletes only:** A delete is sent as an `isDeleted` flag alongside the record, and whoever receives it sets  `deleted_at` in the same statement as the rest of the record. A hard delete (actually removing the row) is not supported by sync. Any hard delete will not be synced at all, and every other server keeps the row. This follows from how sync works: it finds out what changed by reading what each row says about itself, and a row that no longer exists cannot say anything. XXX [the hard delete stuff is a good note here, but feels more like it belongs somewhere else, perhaps along with the password hash thing]
- **One `id` per record:** A record is identified by a single `id` column. A few tables have a composite primary key in the database, i.e. a key made of two or more columns XXX [but this is never done in the strict composite primary key fashion]. Each of those also has a stored, generated `id` column built from the parts, and that is what sync uses.
- XXX [changelogs]

### Marking patients for sync

A patient is marked for sync at a facility in one of two ways. It happens automatically when clinical work happens there, e.g. the patient is created, has an encounter, an appointment, a booking or a program registration XXX [are the last two true? I thought it was simplified down to just being encounters], or is edited on a mobile device. Or a user does it deliberately. This is specified in `specs/sync/marking-patients-for-sync.md`. Marking for sync creates a `patient_facilities` entry, which is a record like any other, and syncs to central.

There is no way to unmark for sync. Removing one by hand in the database is very occasionally done leave the patient's data sitting on the facility with nothing to clean it up, because the removal itself would not sync (see hard deletes, above). It is best avoided.

## The lookup table

The expensive part of a pull is working out which rows belong to which client. Take a note as an example. It might be attached to an encounter, or to a lab request that is attached to an encounter, or to an imaging request, or directly to a patient, and each of those leads back to a patient who may or may not be marked for sync at the facility asking. Notes are also the biggest table in most deployments. Originally all of this was worked out from scratch for every table, in every session, for every client.

The lookup table takes that work out of the session. `sync_lookup` is a denormalised copy of every record that syncs: the record itself as JSON, the scope columns that say who should receive it, and a tick. A scheduled task keeps it up to date, every 20 seconds by default, and a pull becomes a single indexed query against one table. It is specified in `specs/sync/lookup-table.md`.

The trade-off is a delay. A change on central cannot be pulled until the next build has copied it into the lookup table. One consequence is easy to miss: **the pull in a session does not see what that same session just pushed.**

### A build

A build is one run of the scheduled task. `updateLookupTable` in `CentralSyncManager.js` drives it, and the per-model work is in `updateLookupTable.js`.

1. **Tick-tock, then wait for pending edits** below that tick. The tick becomes the build's new cursor. After the wait, every source row up to that tick is committed and visible.
2. **Copy what has changed**, in one repeatable read transaction. For each model, every source row changed since the previous cursor is inserted or updated in the lookup table, with its tick set to `-2` for now. The same transaction rebuilds rows for patients flagged after a merge, heals rows flagged as drifted (see [Drift and healing](#drift-and-healing)), and stores the new cursor.
3. **Stamp the new rows**, in a second, short transaction after the first has committed: tick-tock, and set every `-2` row to that tick (the separate step is important; see below).

Step 3 is separate for a reason. A lookup row needs a tick that is later than any `pullUntil` central has already handed out, otherwise a client whose cursor has moved past it would never be sent it. But a build can run for a long time, and has no way of knowing in advance when it will commit. So it writes its rows with a placeholder, and gives them their real tick right at the end, in a transaction that holds the clock for only a moment. The alternative would be to hold the clock for the whole build, which would stop every session from starting.

In the meantime, rows at `-2` are invisible to pulls, because a pull only asks for ticks above its cursor.

The very first build is a special case. It gives each lookup row the tick of the record it was copied from, not a new one, so that clients which already hold the data do not see the whole database as changed. Central will not sync with anyone until that first build has finished.

### Not sending a client its own changes

Without some care, everything a client pushed would come straight back to it on a later pull. This is known as an echo. It is harmless, but wasteful.

To avoid it, when a build copies a row, it checks whether the row's tick matches a push recorded in `sync_device_ticks`. If it does, the row was last written by that device's push, and the lookup row records the device (`pushed_by_device_id`). That device's pulls then skip the row. If anything else changes the row later, it gets a different tick, the match no longer holds, and the row goes to everyone again.

This relies on a push's tick being unique to that push, which is what the two tick-tocks in [Persisting a push](#persisting-a-push) are for.

### Drift and healing

The lookup table is a copy, and a copy can drift from its source. A build only looks at rows whose tick has moved, so anything that changes a row without moving its tick is a risk. There are three cases:

- **Writes with the trigger off:** These are migrations. On central, a second trigger notices these and flags the lookup row as needing a rebuild. Each build then heals flagged rows. A healed row keeps its existing tick, so clients that already hold the record do not pull it again. An upgrade does not finish while any row is still flagged.
- **Hard deletes:** The lookup row is flagged in the same way, and removed by the next build.
- **Scope changed from elsewhere:** Some changes move who should receive a row without touching the row itself. A patient merge is the example: the records under the merged patient now belong to a different patient, but their own rows have not changed. Neither trigger sees this. The merge flags the patients involved for a rebuild, and a migration can flag a whole model.

## Conflict resolution

A conflict is when the same record has been changed in two places between syncs. The two versions only ever meet in one place: on central, when it saves a push and finds the record already exists.

- **Last push wins:** For most records, central takes the incoming record and replaces what it had. It does not compare ticks.
- **Field-by-field merge:** For one model, fields are merged individually. A model can carry `updatedAtByField`, which records the tick each field was last changed at. Central then merges the two versions field by field, keeping whichever has the higher tick for each. Only `patient_additional_data` does this. It was built as a trial, and has not been extended, because conflicts have not caused enough trouble to justify the extra cost on every write.
- **Clients take central's answer:** A client never resolves a conflict itself. When a client saves a pull, it overwrites what it has with what central sent. There is one safeguard: before saving, a facility server checks whether any record it is about to overwrite has been edited locally since its push snapshot was taken. If so, it abandons the whole session. Next session that edit is pushed, central resolves it, and the facility pulls the result.

It would be natural to assume that the highest tick wins everywhere, since that is what a logical clock is usually for. Outside the field-by-field merge, it does not. A facility that syncs late can overwrite an edit that has a higher tick.

This is known, and has been left alone on purpose. Neither rule knows the real order the edits were made in, so both are arbitrary when there is a genuine conflict, and changing the rule would change behaviour everywhere at once. It is not something to "correct" as part of other work.

> [!WARNING]
> There is a known, open problem here. In a genuine conflict, the lookup table's delay breaks the last step. The client that pushes wins on central, as it should. But the pull in the same session reads the lookup table, which still holds the other side's older version, so the client is sent that and saves it over its own. Central then never sends the client its own version back, because it recognises it as that client's push. The client and central end up holding each other's version. The same happens with the field-by-field merge. See [Dragons](dragons.md).

## Concurrency

Central serves many clients at once, from several processes, while the admin panel, imports and scheduled tasks all write to the same tables. All coordination happens in the database and never in a process's memory, because another process would not see it.

Four mechanisms do nearly all of the work: the clock row lock, the private tock, pending edits and the pending flag. Each has a section below, followed by notes on isolation levels, lock keys and capacity.

### The clock row lock

Tick-tocking is an update to a single row. When a transaction updates a row, the database locks that row until the transaction ends, and any other update to it has to wait. So a tick-tock made inside a transaction stops every other tick-tock until that transaction finishes.

Reading the clock never waits, though. A reader just sees the last committed value. That is what lets a transaction hold a tick nobody else can see.

Three things hold the clock this way:

- The persist transaction, for the whole persist.
- The lookup build's stamping transaction, for a moment.
- An import, for the whole import.

The first two do not take a lock explicitly. It follows from where their tick-tock sits. An import takes the same row lock on purpose.

Starting a session, starting a pull snapshot, starting a lookup build and persisting a push all begin with a tick-tock, so all of them queue behind whichever of those three is running. This is what people mean by "you can't sync during an import", and it is why central only persists one push at a time.

### The private tock

Described under [Persisting a push](#persisting-a-push): a tick that only one transaction can ever write with.

### Pending edits

In-flight locks and pending edits are two halves of one mechanism. A write takes an in-flight lock on the tick it is stamping with (see [The trigger](#the-trigger)). A pending edit is a write that is still holding one, i.e. it has stamped a row but not yet committed. Waiting for pending edits means waiting for those locks to be released.

This solves a specific problem. Suppose a transaction stamps a row with tick 7, and then stays open for a while. A pull comes along with a `pullUntil` of 10. It cannot see the uncommitted row, so it does not send it, and the client records that it is complete up to 10. Then the transaction commits. The row is at tick 7, behind the client's cursor, and will never be sent. Imports made this a real problem, because they run for a long time and commit everything at once.

The fix is the in-flight lock the trigger takes in its third step. It is an advisory lock (a lock on an arbitrary number, not on a row or a table), taken in shared mode and keyed on the tick being stamped. It lasts until the transaction ends.

Anything that is about to treat "everything up to tick T" as complete first looks up which ticks below T have an in-flight lock held, and waits for each one to be released (`waitForPendingEdits`). Once they are, every transaction that stamped a row with an earlier tick has finished. Central waits like this before a lookup build and before a pull snapshot. A facility server does the same before its push snapshot.

The pull still needs this wait even though it reads from the lookup table, because it also reads `patient_facilities` directly to find newly marked patients. Without the wait, a patient marked in a slow transaction could be missed permanently.

### The pending flag

Described under [A build](#a-build): lookup rows are written at `-2`, and stamped afterwards.

### Isolation

A transaction's isolation level controls what it can see of other transactions' work. The default, read committed, lets each statement see whatever has been committed by the time it runs.

Snapshots need something stricter. They run at repeatable read, where the whole transaction sees the database as it was at one instant. That way every table is read as at the same moment, and a child record cannot be copied without its parent. The pull snapshot, the lookup build, the facility's push snapshot and the facility bootstrap all work this way.

Inside one of these, only read tables that other things write to. If a repeatable read transaction writes a row that something outside it also writes, the database raises a serialisation failure, and nothing in sync retries those. The session row is the one to watch, since every poll from the client updates it. That is why updates to the session sit just outside these transactions.

Everything else in sync runs at read committed, and pending edits depend on that. At a stricter level, a transaction sees the clock as it was at its first statement, however long it then runs, while the trigger only takes its in-flight lock at the first write to a synced table. In between, nothing marks that tick as in use, and a snapshot can go past it. So a transaction at repeatable read or serializable that writes synced rows has to hold the clock itself. The importer runs at serializable and does that, which is why it locks the clock row.

### Advisory lock keys

Advisory locks are shared across the whole database, and identified only by a number. In-flight locks use the tick itself as the number, so plain integers belong to them. Every other use (the lock that marks a session as processing, the lock around creating a session, and several outside sync) gets its number by hashing a string.

It is worth keeping to that convention. The two ranges do overlap, and the trigger does not check whether it actually got its in-flight lock, so if a hashed key ever matched a tick in use, an edit would go untracked.

### Capacity

Separately from keeping things correct, central limits how much runs at once, with `sync.maxConcurrentSessions` and `sync.numberConcurrentPullSnapshots`. Devices that cannot start yet wait in a queue, with urgent requests first, and then whoever has gone longest without syncing. Every lock held is also a database connection held, so these limits need to fit within the connection pool.

## The facility server as a client

The code is in `packages/facility-server/app/sync/`, and `FacilitySyncManager.js` drives it. The sync loop runs in its own process. When the API process wants a sync, it asks over a local connection.

### When it syncs

A facility server syncs on a schedule, every minute by default. It also syncs straight away when a user asks, or when a patient is marked for sync.

If a sync is requested while one is already running, one follow-up sync is queued to run as soon as the current one ends, and everyone who asked waits for that same follow-up. The follow-up is needed because the running sync took its snapshot before the request came in, so it cannot contain whatever prompted the request (e.g. the newly marked patient).

A brand new facility does one extra thing first. It fetches a small "bootstrap" of users, roles, settings and reference data, so that people can log in while the first full sync is still running. This is specified in `specs/sync/bootstrap.md`. Bootstrap reads central's tables directly, not the lookup table, and it does not set the pull cursor. So the first real sync pulls everything again, over the top of it.

### Push

1. **Swap the clock.** Read the current local tick, then replace it with the tick central issued for this session. From here on, new local writes are stamped with the new tick.
2. **Wait for pending edits** on the old tick, so that every transaction that stamped a row with it has finished.
3. **Take the snapshot.** In a repeatable read transaction, read every row in a pushable table whose tick is above the push cursor. There is no scope filter going up: everything changed locally is pushed. The snapshot is held in memory, which is fine because a facility only ever pushes what has changed since last time.
4. **Send it**, in pages, with each record's changelog rows attached. The page size adjusts itself based on how long the last page took.
5. **Wait for central to persist it.**
6. **Delete local copies** of any "push to central then delete" records.
7. **Store the push cursor**, which is the old tick from step 1.

Step 7 happens before the pull starts, and is not inside any transaction. So a push counts as done whatever happens to the pull afterwards.

### Pull

1. **Ask central to build the snapshot**, and wait until it is ready.
2. **Download it** in pages into a local snapshot table. Staging it in a table means a first sync does not have to fit in memory, and the real tables are never left half updated.
3. **Check for local edits since the push** (`assertIfPulledRecordsUpdatedAfterPushSnapshot`). If any record about to be overwritten has been edited locally since the push snapshot, the session fails here, as described under [Conflict resolution](#conflict-resolution).
4. **Save everything in one transaction.** Audit logging is paused and constraints are deferred. The records are saved with `saveIncomingChanges`, the same function central uses to persist a push. Central's changelog rows are inserted. Finally `pullUntil` is stored as the pull cursor.

Two details in step 4 exist to stop pulled records being mistaken for local edits and pushed back to central:

- **Incoming tick:** Pulled rows are written with a tick of `-1`, which the trigger stores as `-999`.
- **Deletes ride along:** Deletes and restores are written in the same statement as the rest of the record. A separate delete statement would not carry the `-1`, so the trigger would stamp it as a local edit.

The cursor is stored inside the same transaction as the records for a similar reason. If it were stored separately and that failed, the records would be pulled and saved a second time.

### Its cursors

A facility server keeps three values in `local_system_facts`: its current tick, its push cursor and its pull cursor. The push cursor is the tick from before the session, and the pull cursor is `pullUntil`. The web app reads both cursors to decide whether a patient is fully synced, so what they mean is visible to users.

## The mobile app as a client

The code is in `packages/mobile/App/services/sync/`, and `MobileSyncManager.ts` drives it. Mobile uses TypeORM on SQLite. It speaks the same protocol as a facility server, but shares almost none of the code. This section covers where mobile differs. Anything not mentioned works as described for the facility server, above.

### What is the same

- Push first, then pull, using the same routes and the same pattern of background steps and polling.
- The same three cursors, with the same meaning (see [Its cursors](#its-cursors)).
- The session's tick becomes the local clock at the start of the push, and the push cursor is stored after the push and before the pull (see [Push](#push)).
- The pull is saved in one transaction, together with the pull cursor (see [Pull](#pull)).

### No triggers

Mobile has none of the sync triggers. Instead, a listener on the base model stamps `updatedAtSyncTick` just before an insert or update, when the write goes through an entity's `save()`. A write that goes around the model, e.g. raw SQL, a bulk update or a migration, is not stamped and will not be pushed.

This is the one place where the "database triggers, not ORM hooks" principle does not hold. On mobile, anything that writes to a synced table has to go through the model.

Pulled records are a deliberate exception. They are written with hand-built SQL that leaves the tick column out entirely. A new row gets the column default of `-999`, and an existing row keeps the tick it had.

Mobile is also missing two of the facility server's safeguards:

- **No wait for pending edits:** Mobile takes its push snapshot without waiting. In principle, a save that reads the tick just before the push swaps it could be written with the old tick after the snapshot was taken, and never be pushed. The window is small, because mobile has a single database connection, but nothing closes it.
- **No check for local edits since the push:** If a record is edited locally between the push snapshot and the pull being saved, the pulled version overwrites it.

### What it sends and receives

- A device serves a single facility, and tells central it is mobile (`isMobile`).
- It tells central which tables it wants. Central has no list of what a mobile device holds.
- It holds fewer tables than a facility server. For patients, it pulls those marked for sync at its facility, which is the same set as every other device at that facility.
- It keeps no changelog. Central writes the audit rows itself when it persists a mobile push, and does not send changelog rows down to mobile.
- "Sync all lab requests" never applies to mobile.
- Push requests are compressed.

### Pulling

There are two different pull paths, and which one runs depends on whether the device has a pull cursor yet.

- **Initial sync (no cursor):** Each page is saved as it arrives, all inside one transaction, with no staging. The user cannot do anything useful until the first sync finishes anyway, so there is no harm in the database being part-written while it runs, as long as a failure rolls everything back.
- **Incremental sync (every sync after that):** The pull is staged first, then saved from staging in one transaction. Staging lives in a separate, throwaway SQLite file attached alongside the main database. That is just for speed, since it keeps the staging writes out of the main database's journal. If anything goes wrong, the file is deleted and the pull is done again.

On both paths, foreign key checks are deferred until the transaction commits, so it does not matter what order records arrive in. If the commit fails, mobile then works out which record was the problem.

### Schema changes

On the servers, a data migration runs on every server and nothing needs to sync (see [Migrations and sync](#migrations-and-sync)). Mobile does the same where it can.

Sometimes it cannot. The usual case is a new table on mobile that the servers already have data for. Then the migration writes down the table's name locally, the next pull asks central to send that table from the beginning, and the note is cleared in the same transaction that saves what comes back.

### Lifecycle

Mobile syncs every five minutes while the app is open. It also syncs straight away when the user asks, or marks a patient for sync. Nothing runs in the background.

If a sync is requested while one is running, the request is dropped. Unlike on the facility server, it is not queued.

The screen is kept awake for the length of a sync (`specs/sync/mobile-keep-awake.md`). If the app is killed part way through, the cursors have not moved, so the next sync just does the work again.

## Migrations and sync

Migrations run with the sync tick trigger switched off. A local system fact is set before the batch of migrations and cleared afterwards. Rows that a migration changes keep their existing ticks, and so are not synced.

The reason is that every server runs the same migrations. If a data migration is deterministic, i.e. the same input always gives the same output, then it produces the same result on central and on every facility, each in place, without anything being sent. Syncing the result as well would move the same rows across the network for no benefit, and for a big table that could be most of the database.

A few things follow from this:

- **Deterministic only:** A data migration has to give the same result everywhere. If its result depends on something that differs between servers, the servers will quietly end up disagreeing.
- **The lookup table has to match:** Central's lookup table has to end up holding the migrated version. A facility that marks a patient for sync next week will pull that patient's history from the lookup table, and it needs to match what the migration produced. Writes made while the trigger is off flag the lookup rows they touch, and the next build heals them (see [Drift and healing](#drift-and-healing)). If a migration changes who should receive a row without writing to the row itself, it has to flag the model or the patients for a rebuild.
- **A failed batch leaves the trigger off:** It stays off until a later batch succeeds, and a server in that state does not stamp anything it writes.
- **Mobile is separate:** It has its own migrations and no trigger. See [Schema changes](#schema-changes).

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

Nearly every sync setting is a key in a config file, not a setting in the database. This is true on both servers. These are the ones that change what sync does, as opposed to how fast it goes:

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

The first two are rollout flags, left over from when the lookup table was introduced. They are due to be removed, along with the path they switch to.
