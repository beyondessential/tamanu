---
id: ASLEEP
---

# Serving central while asleep

Applies to central's supervisor answering the changes-pending check and serving logins and token refreshes against a copy of the tables login reads, held in its own PostgreSQL, while central's database is down; a facility server's supervisor instead [wakes its server for any request that counts as activity](sleep-and-wake.md), and [which requests are served at each point of a sleep or a wake](sleep-and-wake.md#serving-checks-and-logins-between-states) is specified with them.

## The copy

- The copy holds an allowlist of tables: `users`, `devices`, `refresh_tokens`, `roles`, `permissions`, `facilities`, `settings`, `user_login_attempts`, `user_facilities` and `local_system_facts`. It also holds the structure of the `logs` schema, empty, so the audit triggers have somewhere to write.
- Only allowlisted tables are copied, so a new table holding patient data is never copied by default.
- The copy's schema is generated once per Tamanu release, at build time, by migrating an empty database and pruning it to the allowlist. It ships with the supervisor.
- The schema loads into the oldest PostgreSQL major version that a supported platform may provide to the supervisor.
- The login, token check and changes-pending check tests run in CI against a copy built from the allowlist, so a change to any of them that reads a table outside the allowlist fails with a missing relation.
- The copy is made at sleep, after the api and web have stopped, so nothing writes to those tables while it is taken.
- The data is loaded into the copy with triggers off, so `updated_at`, sync ticks and audit rows hold their source values and the load writes no audit rows.
- Each table is created and filled in a statement of its own, so the supervisor's PostgreSQL never needs a large lock table.
- At copy time the supervisor records a checksum of each table that login only reads.
- From the moment the copy is complete, the copy records which rows of `devices`, `refresh_tokens` and `user_login_attempts` each write creates or changes.
- The copy is deleted once it has been handed back.

## Logins and refreshes

- While central is asleep, the supervisor serves central's login and token refresh with Tamanu's own handlers, against the copy.
- A login or refresh served from the copy gives the same response as central would give against the real database: the same role, permissions, allowed facilities, localisation and settings.
- Access and refresh tokens issued by the supervisor work against central after the hand-back, with no new login.
- Failed logins are recorded in the copy and count towards lockout as they would at central.
- A write to the copy is on durable storage before the request that made it is answered, so a crash of the supervisor or its host loses nothing awaiting hand-back.
- A login from a device that is not in the copy would register a new device, and that device needs an initial sync anyway, so such a login wakes central. The request gets the waking response.
- A login with no device, as integrations and FHIR clients make, wakes central and gets the waking response, since what follows it needs central.

> [!NOTE]
> Running Tamanu's own login and refresh code unchanged is what keeps a supervisor-served response identical to central's, so the supervisor never becomes a second implementation of login that can drift from the real one.

## Changes-pending check

- While central is asleep, the supervisor answers the [changes-pending check](../../sync/changes-pending-check.md) from the highest real-change sync tick it held at sleep, checking the caller's access token against the copy. The answer is the same one central would give.
- Recording the device as seen writes to the copy, so it reaches the real database with the hand-back.

> [!NOTE]
> Answering the check without the database is what keeps a device with nothing to sync from waking central at all, which is the point of the sleep.

## Handing back

- On wake, once the database is ready and before any other part starts, the supervisor writes back to the real database every row of `devices`, `refresh_tokens` and `user_login_attempts` that the copy recorded as created or changed.
- The rows are written with the real database's triggers on, so sync ticks and audit rows come out as they would for any normal write.
- Devices are updated on conflict by id, and refresh tokens by user and device. Login attempts are only inserted, so lockout counts stay correct.
- A device's last-seen time is written back only when it is later than the value in the real database.
- Before writing back, the supervisor checks that each table login only reads is unchanged in the copy since copy time, by comparing checksums. A mismatch is reported as an error, and the hand-back of the three written tables still goes ahead.
- The hand-back writes by the columns that the copy and the real database have in common, so a copy made by the previous release can be handed back before a rollout's migrations run.
- Repeating a hand-back that was interrupted writes the same end state as running it once.
- The copy is deleted only after the hand-back has committed.
