---
id: ASLEEP
---

# Serving central while asleep

While central's database is down, central's supervisor answers the changes-pending check and serves logins and token refreshes, so a device with nothing to sync does not wake central. It runs Tamanu's own login and refresh code, unchanged, against a copy of the tables login reads, held in the supervisor's own PostgreSQL. What login writes to the copy is handed back to the real database when central wakes.

This applies to central's supervisor. A facility server's supervisor wakes its server for any request that counts as activity (see `platform/supervisor/sleep-and-wake.md`).

## The copy

- [ ] The copy holds an allowlist of tables: `users`, `devices`, `refresh_tokens`, `roles`, `permissions`, `facilities`, `settings`, `user_login_attempts`, `user_facilities` and `local_system_facts`, plus the `logs` schema that the audit triggers write to. A table outside the allowlist is never copied, so a new table holding patient data is not copied by default.
- [ ] The copy's schema is generated once per Tamanu release, at build time, by migrating an empty database and pruning it to the allowlist. It ships with the supervisor.
- [ ] The schema loads into the oldest PostgreSQL major version that a supported platform may provide to the supervisor.
- [ ] The login test suite runs in CI against a copy built from the allowlist, so a change to login that reads a table outside the allowlist fails with a missing relation.
- [ ] The copy is made at sleep, after the app has stopped, so nothing writes to those tables while it is taken.
- [ ] The data is loaded into the copy with triggers off, so `updated_at`, sync ticks and audit rows hold their source values and the load writes no audit rows.
- [ ] Each table is created and filled in its own statement rather than in one large transaction, so the supervisor's PostgreSQL never needs a large lock table.
- [ ] At copy time the supervisor records a checksum of each table that login only reads, and the time the copy was made, by the copy's own clock.
- [ ] The copy is deleted once it has been handed back.

## The supervisor's database role

- [ ] The supervisor connects to the real database with its own role, not the application's.
- [ ] That role can read the tables in the allowlist, can write `devices`, `refresh_tokens` and `user_login_attempts`, and can read the highest real-change sync tick and the scheduled-task records the supervisor needs. It has no other access.

## Logins and refreshes

- [ ] While central is asleep, the supervisor serves central's login and token refresh with Tamanu's own handlers, against the copy.
- [ ] A login or refresh served from the copy gives the same response as central would give against the real database: the same role, permissions, allowed facilities, localisation and settings.
- [ ] Access and refresh tokens issued by the supervisor work against central after the hand-back, with no new login.
- [ ] Failed logins are recorded in the copy and count towards lockout as they would at central.
- [ ] A login from a device that is not in the copy would register a new device, and that device needs an initial sync anyway, so such a login wakes central. The request gets the same response as any request during a wake.
- [ ] Every other request that counts as activity wakes central (see `platform/supervisor/sleep-and-wake.md#waking`).

## Changes-pending check

- [ ] While central is asleep, the supervisor answers the changes-pending check (see `sync/changes-pending-check.md`) from the highest real-change sync tick it read at sleep. The answer is the same one central would give.
- [ ] The supervisor checks the caller's access token from the copy, as central would.
- [ ] Each check updates the calling device's last-seen time in the copy, so it reaches the real database with the hand-back.

## Handing back

- [ ] On wake, once the database is ready and before any other part starts, the supervisor writes back to the real database every row in `devices`, `refresh_tokens` and `user_login_attempts` that was created or updated in the copy after the copy was made.
- [ ] The rows are written with the real database's triggers on, so sync ticks and audit rows come out as they would for any normal write.
- [ ] Devices are updated on conflict by id, and refresh tokens by user and device. Login attempts are only inserted, so lockout counts stay correct.
- [ ] A device's last-seen time is written back only when it is later than the value in the real database.
- [ ] Before writing back, the supervisor checks that each table login only reads is unchanged in the copy since copy time, by comparing checksums. A mismatch is reported as an error, and the hand-back of the three written tables still goes ahead.
- [ ] The hand-back writes by the columns that the copy and the real database have in common, so a copy made by the previous release can be handed back before a rollout's migrations run.
- [ ] Repeating a hand-back that was interrupted writes the same end state as running it once.
- [ ] The copy is deleted only after the hand-back has committed.
