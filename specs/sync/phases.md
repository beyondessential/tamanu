---
id: PHASES
---

# Initial sync phases

A facility server's first sync pulls the whole of its share of the central database, which for a facility with a long history of patients is hours of work.
It runs in three phases, each a sync session of its own, so that each capability of the facility becomes available as soon as the data it needs has arrived.
Every sync after the first is a single unphased session pulling the changes since the facility's pull cursor.

## The phases

- [ ] The first sync runs in three phases, in order: boot, catalogue, then records.
- [ ] The boot phase carries the data a facility server needs to authenticate a user and start serving requests: facilities, users, roles and their permissions, settings, departments, locations and location groups, and translated strings.
- [ ] The boot phase also carries reference data, because a facility record names its catchment as a reference data record and so cannot arrive before it.
- [ ] The catalogue phase carries the rest of the data that is not scoped to a patient: reference data relations, programs and surveys, scheduled vaccines, and templates.
- [ ] The catalogue phase also carries patient records themselves, without the data recorded against them, together with the records marking which patients are synced to this facility.
- [ ] The records phase carries the data scoped to a patient or an encounter: encounters, notes, vitals, lab requests and tests, imaging, invoices, documents, appointments, and program responses.
- [ ] A user can log in once the boot phase has completed, search for and open patients once the catalogue phase has completed, and see a patient's clinical history once the records phase has completed.

## Declaring a model's phase

- [ ] Each model that pulls from central belongs to exactly one phase, declared on the model alongside its sync direction so that the composition of each phase is readable from the model itself.
- [ ] A model that does not declare a phase belongs to the records phase, so a model introduced without a phase arrives last rather than early.
- [ ] A model belongs to a phase no earlier than the phase of every model it holds a foreign key to, so that each phase can be saved without a reference to a record that has not arrived.
- [ ] The dependency ordering that governs the order records are saved in is the same ordering this constraint is checked against.

## Running the phases

- [ ] A facility that has never completed a pull begins its first sync at the boot phase, and from then until the first sync is complete each sync run performs the phase the facility is at.
- [ ] A sync run performs one phase, and requests from central only the tables belonging to that phase.
- [ ] A phase that completes advances the facility to the next phase and starts a sync run for it, without waiting for the next scheduled sync.
- [ ] A facility that has completed the records phase performs unphased syncs from then on.
- [ ] A phase that fails is retried from the beginning of that phase, and the phases already completed are not repeated.
- [ ] A facility restarted partway through its first sync resumes at the phase it was at.
- [ ] A phase for which central has no session capacity available leaves the facility at that phase, to be retried on the next scheduled sync.
- [ ] While a facility's first sync is incomplete it reports its last synced tick to central as though it has never synced, so the sync queue continues to give it priority until all three phases have landed.

## What a phase pulls

- [ ] A phase pulls its own tables from the beginning of the sync timeline, since those tables have not been pulled before.
- [ ] A phase also pulls every earlier phase's tables from the tick the phase before it was snapshotted up to, so that changes made on central while the earlier phases ran arrive with the phase that needs them.
- [ ] Both parts are taken in one snapshot at one tick, and are saved in one transaction in dependency order, so a record never lands before something it references.
- [ ] Without the catch-up a record in a later phase could reference a record created on central after an earlier phase was snapshotted — a clinician, a location, a patient — and the phase would fail on a reference to a row that was never pulled. That failure would not clear on retry, because each retry snapshots at a later tick and misses the same row again.

## The pull cursor across phases

- [ ] A phase records the tick central snapshotted it up to, which is where the next phase resumes the earlier phases' tables from.
- [ ] A phase's records and its progress through the phases are saved together, so a phase either lands whole or is retried whole.
- [ ] On completion of a phase, every table belonging to that phase and the phases before it is current as of the tick that phase was snapshotted up to.
- [ ] Completing the records phase sets the facility's pull cursor to the tick that phase was snapshotted up to, and the facility's record of its phase progress is then discarded.

## Snapshotting a phase

- [ ] Central snapshots for a session only the tables the session asks for, so a phase's snapshot holds its own tables and the earlier phases' catch-up, and completes in proportion to that rather than the facility's whole share.
- [ ] A client tells central when it is performing an initial sync, rather than central inferring it from the session pulling from the beginning of the timeline, because a phase of an initial sync resumes the earlier phases from a later tick.
- [ ] The setting that widens a facility's snapshot to every lab request in the deployment stays off for the whole of an initial sync, however many sessions it takes, so a facility's first sync never carries the deployment's lab history. It applies from the first sync after that.
- [ ] A session may ask for a set of tables that excludes every patient-linked table, and a snapshot pass left with no tables of its own contributes no records to the snapshot.

## Reporting progress

- [ ] The facility's sync status reports which phase of the first sync it is performing, and reports no phase once the first sync is complete.
- [ ] Each phase logs which phase it is and how many tables it covers when it starts, and its phase when it completes, so the time each phase took on a deployment is recoverable from the logs.
- [ ] A user who attempts to log in while the boot phase is still in progress is told the server is completing its first sync, distinctly from being told they have no access to any facility on the server.
