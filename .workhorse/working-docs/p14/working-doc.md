---
status: draft
---

# Sync documentation for agents

Working doc for P14: what we learned from checking the sync orientation sessions against the code, and what documentation to write from it. The evidence is in `ledger/` beside this file; IDs like `CLK-04` point at entries there.

## Where the groundwork stands

- The three orientation sessions were split into eleven areas and each was checked against main (`22d3edaa36`) with file and line references. About 360 claims in all.
- The concurrency questions the sessions left open were worked through separately in `ledger/00-concurrency-analysis.md`.
- One suspected bug was reproduced in a throwaway test (`ledger/12-conflict-repro.md`).
- The fix history was mined into 105 past problems, each with cause, where the guard lives now, and the lesson (`ledger/10-history-server.md`, `ledger/11-history-clients-runbooks.md`).
- `specs/sync/` already holds nine specs. The overview spec is a stub. The lookup table spec says the build has two passes; it has three (`LKP` drift).

| Ledger | Area |
| --- | --- |
| `00` | Concurrency analysis (written by hand, not a claim check) |
| `01` | Clock, ticks, flags, the sync tick trigger |
| `02` | Advisory locks, isolation levels, pending edits, capacity and queue |
| `03` | Sync routes, session start, receiving a push, ending a session |
| `04` | Persisting a push, hooks, merge, deletes and restores |
| `05` | Pull snapshot on central, model filters, reading the lookup table |
| `06` | Building the lookup table |
| `07` | Facility server as a client |
| `08` | Mobile as a client |
| `09` | Model sync config, trigger installation, migrations, settings |
| `10`, `11` | Fix history, server and clients; runbook check |
| `12` | Conflict reproduction |

## What the sessions had wrong, or the code has moved on from

Only the ones that change how sync should be explained. Minor drift is in each ledger's Drift section.

### Conflict resolution

- Record-level conflicts are not "highest tick wins". Central takes the incoming record with no comparison: last push wins. Ticks are compared only per field, and only `patient_additional_data` opts in (`CLK-04`, `PSH-01`). The session reached this conclusion itself by the end; the opening framing is the part to drop.
- Incoming sync hooks do change data. The first account in the sessions was right and the later correction was wrong (`PSH-13`).
- Field-level merge does not flag the merged row for repull. Only hook changes are flagged (`PSH-35`).

### The clock and locking

- "Persist takes a lock on tick-tocking" is true, but there is no explicit lock. The tick-tock is an update of the clock row; inside a transaction it holds that row's lock until commit. Holders are the persist transaction, the importer (an explicit `FOR UPDATE`), and the lookup table's stamping transaction (`CLK-13`, `LCK-07`).
- "You can't sync during an import" is the importer's row lock on the clock, not the advisory locks. It blocks session prepare, pull snapshot start, lookup build and persist. Pushing into a snapshot table, polling, and pulling a built snapshot carry on (`LCK-07`).
- `pullUntil` is the tick from the pull's own tick-tock, the same tick the pending-edits wait uses. There are not two ticks. The snapshot has no upper bound, so newer data can be sent and is sent again next time (`PLL-30`).
- A client gets one tick per session. Central tick-tocks about six times per session or build, for its own purposes (`CLK-03`, `CLK-29`).
- The trigger special-cases only `-1`. `-999`, `0` and `-2` are stamped with the current tick like any other value. The table in `llm/docs/initial-overview.md` is misleading on `0` and omits `-2` (`CLK-21`).
- Migrations disable the sync tick trigger with a plain statement before the batch and re-enable it after. It is not transaction-scoped, and a failed batch leaves it disabled (`CLK-16`).
- A repeatable read serialisation failure is raised at the conflicting statement, not at commit, and nothing in sync retries one (`LCK-33`).
- The rule that plain integers are reserved for tick locks is not written down and not followed: hashed keys share the range (`LCK-35`).

### Sessions and snapshots

- Snapshot tables and the marked-for-sync patient tables are ordinary tables in the `sync_snapshots` schema, not temporary and not in `public` (`SES-07`, `PLL-22`).
- Only mobile declares which tables it wants and which to resync from scratch. The facility server sends neither (`SES-04`, `PLL-12`).
- Nothing checks that the device connecting to a session is the device that started it (`SES-28`).
- `DELETE /sync/:id` is not idempotent on main; that change is on an unmerged branch (`SES-42`).
- Streaming is off by default and facility-only. From reading, the pull stream route looks broken after the first batch and reads two settings at paths the schema does not declare (`SES-26`, `PLL-15`).
- The snapshot timeout defaults to off, and when on it throws inside a timer callback, which cannot abort the snapshot (`LCK-28`).
- Capacity is two config limits, both 4: sessions and concurrent pull snapshots. The queue is urgent first, then lowest last-synced tick, not arrival order (`LCK-09`, `LCK-16`).

### Lookup table

- The first build runs in one repeatable read transaction like every other build. Syncs are refused until it finishes (`LKP-14`).
- The pending flag exists so that a long build does not hold the clock row lock for its whole length, not so that readers are not blocked (`LKP-42`).
- "All record types are for patients" is the normal case for the full pass of every pull, not a cold path (`PLL-51`).
- `avoidRepull` and `lookupTable.enabled` are config keys, not settings. The test config turns the lookup table off, so most central sync tests exercise the old path (`LKP-30`, `PLL-39`).
- The old model-level filters are not dead: the facility bootstrap reads through them, and the presence of `buildPatientSyncFilter` is what marks a model as patient-linked (`PLL` drift).
- The old path and the lookup path disagree about notes on lab requests when sync-all-lab-requests is on (`PLL-48`).

### Models and migrations

- There are five sync directions, not four: do not sync, push, pull, bidirectional, and push to central then delete. Mobile has no equivalent of the last (`MDL-03`).
- No constant defines "reference data" for sync. A table syncs everywhere when its filter returns nothing to filter on; facility-scoped tables such as settings and `patient_facilities` do not (`MDL-05`).
- Composite primary keys do exist in the database on a few syncing tables (`patient_facilities`, `patient_field_values`, `patient_program_registrations`, `translated_strings`). Sync works because each also has a stored generated `id` column, which is what sync uses (`MDL-10`).
- Hard deletes still never reach clients, but central now flags the lookup row when a source row is hard-deleted (`MDL-09`).
- The rule files tell a migration author nothing about the sync tick trigger being off or about the lookup table (`MDL` surprises).
- Patients are marked for sync on more paths than the sessions listed: appointments, location bookings, program registration, mobile edits and patient merge as well (`MDL-21`).

### Clients

- Mobile has no sync triggers. A TypeORM listener stamps the tick, and there is no equivalent of waiting for pending edits. "Robustness via database triggers" is a server-side principle (`MOB-21`).
- The unsafe pragma for mobile initial sync is still shipped, behind a setting that defaults to off (`MOB-32`).
- On the facility, a follow-up sync queued behind a running one is never urgent, and never runs if the one ahead of it fails (`FAC-20`).
- Bootstrap leaves the pull cursor unset, so the first real sync pulls everything again over the bootstrapped rows (`FAC` answers).
- PSK is "pre-shared key" (`FAC-53`).

## The open questions from the sessions, answered

| Question | Answer | Where |
| --- | --- | --- |
| Can a pull slip past the lookup table's stamping transaction? | No. The tick-tock inside it holds the clock row lock until commit, so the pull's own tick-tock queues behind it. The code comment is right. | `00` F1 |
| Do rows changed by merge escape avoid-repull? | No, and it is wider than merge. Reproduced. | `00` F2, `12` |
| Is record-level resolution highest tick or last sync? | Last push. | `00` F3 |
| Can the pending-edits wait in the pull be removed? | No. The pull still reads `patient_facilities` by source tick to find newly marked patients. | `00` F4 |
| Is `removeEchoedChanges` redundant with the lookup table? | Yes. The ticks it compares can never be equal on that path. | `00` F5 |
| Is the persist tick-tock really "purely for a unique tick"? | That uniqueness is what avoid-repull attribution rests on. Both persist tick-tocks are load-bearing. | `00` F6 |
| Is persist the only thing that blocks tick-tock? | No: also the importer and the lookup stamping transaction. | `CLK-13` |
| Does the whole user row, password hash included, sync everywhere? | Yes, to every facility and mobile device. Only four bookkeeping columns are excluded from sync, for every model. The scope that hides the password from queries does not affect sync. | `MDL` Q4 |
| Are facility push snapshots in memory? | Yes. | `FAC` answers |
| How are incoming and outgoing snapshot rows told apart? | A `direction` column in one table per session. | `SES` answers |
| Does the clock start at 0 or 1, and does parity hold? | Starts at 1. Central's own writes are odd, ticks handed to clients are even. | `CLK` answers |
| Does `connectToSession` check the device? | No. | `SES-28` |
| What was decided in the discussion linked from `saveIncomingChanges`? | Nothing. Nobody knew why the `data.id` filter exists, so it stayed. | `PSH` Q3 |
| Is the "duplicate creates" comment still true? | Its stated cause is gone; duplicates can still come from the full and regular passes overlapping. | `PSH-29` |
| Which models opt into field-level merge? | Only `patient_additional_data`. Settings does not. | `PSH` Q5 |
| Why does the initial lookup build use source ticks? | So clients do not re-pull unchanged records after a rebuild. Inferred; the code only states the mechanism. | `LKP` answers |
| Why is the lookup table not a materialised view? | Nothing in code, specs or PRs says. | `LKP` answers |
| What does unmarking a patient for sync leave behind? | Not settled by the code. No path unmarks a patient except patient merge, which hard-deletes and recreates the rows. The patient's data would stay on the facility, since nothing carries a removal. No runbook or spec covers it. | `MDL-22` |
| Why was the "edited after push" check switched off in 2024? | Not recorded anywhere found. On again since Aug 2025. | `FAC-46` |

## Problems found

Filed as issues needing cards:

- **Conflict divergence** (reproduced, critical). In a true conflict the pushing device and central end up holding each other's version.
- **Trigger reads the tick before locking it** (read, very small window).
- **Two runbooks have drifted** (restored-from-backup, restart loop).

Found by reading, not yet filed. Each needs a decision on whether to file:

- [ ] Pull stream route passes a numeric cursor where a base64 one is expected, and the stream routes read settings at undeclared paths (`SES-26`, `PLL-15`, `LCK-19`). Streaming is off by default.
- [ ] Snapshot timeout throws inside a timer and cannot abort the snapshot; may crash the process (`LCK-28`, `HIS-14`).
- [ ] A lost `sync_lookup_ticks` row if the process dies between the lookup build commit and the stamping transaction, leaving a gap in changelog attachment (`00` F1 residual).
- [ ] Create-session lock checks capacity before taking the lock and not again after (`LCK-18`).
- [ ] The sync-all-lab-requests settings query ignores soft-deleted settings (`PLL` surprises).
- [ ] `deleteRedundantLocalCopies` hard-deletes pushed rows without checking for edits after the push snapshot (`FAC` surprises, `HIC-53`).
- [ ] A queued follow-up sync on the facility is dropped if the running sync fails (`FAC-20`).
- [ ] Mobile reads one `tablesForFullResync` row while migrations insert a new row each time (`HIC-20`).
- [ ] Mobile's batch-update fallback still uses `Promise.all`, the shape fixed for inserts (`MOB` surprises).
- [ ] A pull model with no `buildSyncLookupQueryDetails` fails every lookup build, and nothing checks for one (`LKP` surprises, `MDL-07`).
- [ ] Turning the lookup table off is not a safe fallback: the old path has no sensitive-network scoping (`MDL` surprises).
- [ ] Nothing stops two lookup refreshers overlapping across processes (`LKP` surprises).
- [ ] `sync_lookup.encounter_id` is never populated; `SYNC_LOOKUP_PENDING_UPDATE_FLAG` is a dead constant; a leftover debug `log.warn` on every sync request (`buildSyncRoutes.js:105`).
- [ ] Two known fixes sit on unmerged branches: crash-safe push acknowledgement and the whole-table `updated_at_by_field` aggregate (`HIS-08`, `HIS-32`).

## Proposed documentation

### Two documents, one checklist, and pointers

**1. Sync overview.** The mental model and the why. Agents can read the how from the code; this says what the code is trying to guarantee.

- What sync guarantees: each phase lands whole or not at all; work is done from a point-in-time snapshot; central is the only place conflicts are resolved and the only owner of the clock; clients know their own cursors and say what they want; each client holds a subset; re-applying the same data is safe.
- Vocabulary: sync client, session, tick and tock, cursor, snapshot table, lookup table, marked for sync, direction, the flag values.
- The clock: tick-tock, who gets which half, what the trigger does, what a client's tick means between syncs, why ordering is coarse and why that has been acceptable.
- A session end to end, as a numbered sequence across client and central, marking which steps return early and are polled.
- What syncs where: the four directions; global, patient, facility, sensitive network and lab-request scope; what a model declares.
- The lookup table: what it replaced, how it is built, the pending flag, device attribution, self-healing, and the lag it introduces.
- Conflict resolution as it is: last push wins per record, per-field merge for one model, clients take central's answer, and the abort when a pulled record was edited locally after the push snapshot.
- Concurrency: the four mechanisms (clock row lock, private tock, pending edits, pending flag), then a table of what waits on what.
- The clients: facility, then mobile as a list of differences, including that mobile has no triggers.
- Migrations and sync: the trigger is off, each server migrates its own data, and what that means for the lookup table.
- A map of the code and a table of the settings and config keys.

**2. Dragons.** Organised by invariant, not by history. Each entry: the rule, why it exists, what breaks if it goes, where the guard lives, and the PRs that taught it.

- Ticks and the clock (tick uniqueness, never hand-stamp, both persist tick-tocks, the tick-tock inside the stamping transaction).
- Pending edits (every write to a synced table goes through the trigger; what waits and why; the `patient_facilities` read).
- Echoes and attribution (the `-1` sentinel in the same statement as the write; device tick commits with the rows; post-persist steps run after the transaction on purpose).
- Deletes and restores (soft only; the decision rides on the record's own write; client `deletedAt` is discarded).
- The lookup table (it is a copy and it drifts; null scope means everyone; migrations and the rebuild flag; BEFORE triggers and generated ids; migration timestamp order).
- Snapshots and sessions (the snapshot transaction only reads; errors must reach the client through the session row; cleanup on every path; locks hold pool connections).
- Constraints and apply order (creates before updates; deferred constraints; two writers of "the same" row).
- Bounded work (no whole-table aggregates feeding a paged query; no spread of unbounded arrays; batch, pause, cap).
- Mobile (the listener is not a trigger; deferred foreign keys; resync by request).
- "Looks removable and is not" and "looks load-bearing and is not", lifted from `00`.
- Known open holes, each linked to its issue, so nobody documents the intended behaviour as the actual behaviour.

**3. A short checklist rule**, for coding and review agents both: what to check when a change adds a synced model, adds a write path to a synced table, writes a data migration on synced tables, or touches the sync code itself. Drawn from the checklist candidates at the end of `10` and `11`, cut to what is checkable.

**4. Pointers**, so the right agent finds them without every agent paying for them:

- A line in `AGENTS.md` naming the docs, without the `@` that would load them into every session.
- A two-line `CLAUDE.md` in each sync code directory (`packages/database/src/sync`, `packages/central-server/app/sync`, `packages/facility-server/app/sync`, `packages/mobile/App/services/sync`) pointing at them, so they load when an agent works there. `packages/database/CLAUDE.md` already does this for migrations.
- A sync prompt for Review Hero in `.github/review-hero/prompts/`, carrying the checklist.
- Fix the sync tick flag table in `llm/docs/initial-overview.md` and cut that section down to a pointer.

### Specs

Not proposed for this card beyond two small things: correct the lookup table spec where it has drifted (two passes, attribution, the pending flag), and decide whether the overview spec stub stays a stub. Conflict resolution and the session phases are the obvious candidates for real specs later, but conflict resolution should not be specified until the divergence bug has a decision.

## Decisions

- The docs live in `llm/docs/sync/` as `overview.md` and `dragons.md`, reached by pointer: a plain line in `AGENTS.md`, a short `CLAUDE.md` in each sync code directory, and a Review Hero prompt. Not loaded into every session.
- The dragons doc lists known open problems on main, each linked to its issue and removed when its fix merges.
- The unfiled problems stay in the list above for now. Come back to them before the card closes.
- The overview is drafted first, on its own. The dragons doc follows once the overview's framing is agreed.
- Specs may be built out at the end of the card, from the agreed docs.

## Open questions

- [ ] Whether the reasons recorded as inference match memory: source ticks on the initial lookup build; why the pending-edit check was off in 2024.
- [ ] Whether to do the remaining walkthrough topics the sessions skipped, or whether the ledgers now cover them (database schemas, model sync config, sync directions are in `09`).
- [ ] Sync-all-lab-requests and sensitive networks: the sensitive networks spec says a facility syncing all lab requests receives every lab request "ahead of patient and network scoping", and the code does that. So lab requests, their tests and their encounters from inside a sensitive network reach any such facility outside it. Specified, but was the confidentiality consequence a deliberate choice?
- [ ] The design notes for a different sync-all-lab-requests and the dropped sync-all-vaccines behaviour: worth recording in the overview as known intent if they can be found, since the code has no trace of the vaccine one.
