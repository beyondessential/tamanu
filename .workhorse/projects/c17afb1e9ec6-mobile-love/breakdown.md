# Mobile Love card breakdown

Cards are grouped loosely by thread: sync, performance, over-the-air updates, data loss, then the smaller items. Ordering is indicative — prioritisation sits with the FDE. Investigation-heavy cards are sized to deliver a written finding plus whatever fix falls out of it; where a finding is likely to open substantial new work, that work becomes its own card rather than growing the investigation.

## Characterise IRD sync failures from central sync session data

Query the central `sync_sessions` table to establish the shape of IRD's sync problems: clusters of failed sessions, and sessions with long tails in the download or persist-to-local phases. The snapshot phase should be consistent between Karachi and the field, so a long tail there is the signal. Needs nothing from IRD to start. Delivers a written characterisation — which users, which facilities, which phase, how often — that the other sync cards work from.

## Fix mobile sync crashes caused by memory pressure

Around 10% of users have hit crashes during both initial and incremental sync, with a disk-IO error and a database driver error on an index-creation query among the reports. Mobile has a history of initial-sync memory leaks, and removing the write-to-file-then-persist step (needed before 2.54 when SQLite's 999 bind-parameter limit applied) may have raised peak memory. Profile memory across a full sync on a low-spec device and fix what surfaces. Branch off Felix's boot/catalog/records chunking work to avoid conflicts.

## Answer IRD's outstanding sync questions

Several technical questions are owed answers back to Bilal and the field team: exactly what the initial sync downloads (metadata versus all patient submissions) and whether it is scoped per facility or pulls the whole central database, the current payload size and whether GZIP compression is enabled, and whether an interrupted sync resumes from where it dropped or restarts from scratch. Verify each against the code and the running deployment, then send the answers. Where an answer exposes a real weakness — no compression, no resume — raise that as its own card rather than fixing it here.

## Review IRD's facility and sync-scope setup

IRD appear to run a single facility, and the patients marked for sync there drive initial-sync size. Check the central database for how many patients are marked and how much of the sync is encounter history rather than base reference data, then advise IRD on a configuration that syncs considerably less. Configuration advice and a written recommendation, no code change.

## Run an AI-assisted performance sweep over the mobile app

Broad sweep over `packages/mobile` to find and fix obvious performance problems — unnecessary re-renders, unbatched queries, expensive work on the JS thread. Unblocked by the just-finished React Native upgrade. Targets low-spec Android hardware (Oppo-class budget devices), not flagship phones. Ships as one release into `main` covered by a single mobile regression test, rather than scattered hot fixes.

## Fix program and form selector load time

Forms take three to five minutes to appear on a lightly-populated program. An earlier fix worked for one user and the problem recurred for another on v0.5.29, so it did not reach the real cause. Profile the selector against IRD-shaped data on a low-spec device and fix it properly.

## Fix data-entry lag in mobile survey forms

Next-question lag through data entry is reported as no better on v0.5.29. Covers the survey form render path — question transitions, dropdowns, and other selection controls, which are the likely hotspot.

## Add a mobile user-frustration metric

Mobile equivalent of Rohan's desktop click-lag detection and aggregate frustration score, so mobile performance can be quantified and tracked over time rather than judged by feel. Reuse the desktop approach rather than inventing a second one. Whether it deploys this cycle is open; the value is having a measure at all.

## Choose an over-the-air update mechanism for mobile

IRD find manual updates via the provided URL painful and asked for the Play Store. No in-app update mechanism exists today. Weigh Google Play Store, JS-bundle OTA (CodePush or expo-updates style), full APK delivery, and MDM-driven delivery against IRD's constraints: offline campsites, low-spec devices, intermittent connectivity, data residency. Delivers a recommendation and an effort estimate that sizes the implementation.

## Deliver app updates over the air

Implement the chosen mechanism: the update check, the prompt users see, forced versus optional update behaviour, and what happens on devices that have been offline for long stretches. Scope and duration depend on the mechanism card's outcome, and this may run past the cycle. Carries the project's only design work.

## Investigate unsynced forms lost when the mobile app updates

Users report unsynced forms disappearing after an app update, sometimes around fifty at once, and sometimes only some forms vanishing after a sync completes. Working hypothesis is that the upgrade path deletes the old APK and installs the new one, taking the local database with it. Confirm or rule out the hypothesis against the real upgrade path, then fix.

## Investigate desktop forms missing after a data download

Around fourteen or fifteen forms entered through Tamanu desktop did not appear after a data download and had to be re-entered. Distinct from the mobile case and more serious, since it undermines the digital-only record. Progress depends on IRD supplying dates and record details; follow up directly with whoever reported it if nothing lands within a couple of working days.

## Confirm mandatory questions only block submission when visible

Staff at IRD could not progress a form because mandatory questions were blocking submission while hidden by their visibility criteria. Desktop already gates mandatory on visibility, and the mobile survey form appears to derive both its validation schema and its submitted values from visible components only, so the gap may not exist at all. Reproduce the exact survey and question that blocked progression, and close the gap if there is one. IRD have reconfigured around it, so this is a quick-wins item.

## Decide on mobile-to-Iti-device connectivity

Field teams run Tamanu desktop against an Iti device because the mobile app cannot connect to it, so a mobile operator cannot hand a patient to the next station without waiting for internet to sync. This is the real ceiling on mobile's field viability and it was never discussed internally. It leans towards behaviour change and is probably beyond this cycle, so the deliverable is an explicit decision from Edwin and Megan on whether it enters scope — not an implementation.
