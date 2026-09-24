---
id: FBOOT
---

# Facility bootstrap

Before a facility server's first sync completes, it holds a bootstrap: a small set of records from central, just enough for the ordinary login path to work.
The bootstrap does not change the first sync, which pulls the facility's full share of central from the beginning of the sync timeline, including every bootstrapped record again.

## Contents

- [ ] The bootstrap carries the facilities, users (including their password hashes), user facility links, roles, permissions, and settings (global, and for the server's facilities) that the facility's own pull would deliver.
- [ ] It carries the reference data records that facilities point to as their catchment, and no other reference data.
- [ ] It carries translated strings in every language, limited to the language list (each language's name and country code) and to the strings on the screens a user sees before the first sync completes: login, password reset, status and setting-up screens, the setup wizard, facility selection, form validation, and general actions.
- [ ] The translated strings are selected by a fixed list of string id prefixes.
- [ ] It carries no patient-linked data.
- [ ] Every reference a bootstrapped record holds to another record resolves within the bootstrap, so it can be saved on its own.

## Serving the bootstrap

- [ ] Central serves the bootstrap to a facility server's sync user, for the facility ids the request names, scoped the same way as that facility's pull.
- [ ] Central builds the bootstrap from the sync lookup table, with the same facility filtering as an outgoing sync snapshot, so a bootstrapped record is the record the facility's pull would carry at that moment (see `sync/lookup-table.md`).
- [ ] Each bootstrapped record has the same shape as a pulled change, including its deletion state.

## Applying the bootstrap

- [ ] The facility saves bootstrapped records the same way it saves pulled records: they are marked as last updated elsewhere, so the bootstrap never causes them to be pushed back to central.
- [ ] The bootstrap is applied in a single transaction; a failed application leaves none of it saved.
- [ ] Applying the bootstrap leaves the pull cursor unset, so the first sync still pulls from the beginning of the sync timeline and overwrites each bootstrapped record with its version at that sync.
- [ ] Applying the bootstrap again replaces each bootstrapped record with its current version from central.

## When a facility bootstraps

- [ ] The setup wizard fetches and applies the bootstrap while configuring the server, in the same transaction that records the server's configuration (see `platform/facility-setup.md`).
- [ ] Before each sync session, a facility server whose pull cursor is unset fetches and applies the bootstrap, and then runs the session. This covers servers configured without the wizard.
- [ ] A failed bootstrap fetch or application is logged, and the sync session runs regardless.
- [ ] Once the pull cursor is set, the facility does not bootstrap again.
