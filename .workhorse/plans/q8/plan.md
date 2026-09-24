# Initialise database during facility setup wizard

## Approach

A fresh facility can't be logged into until its first sync lands, because login resolves a user's facilities, role and permissions against local tables that are still empty.
Rather than changing sync (the phased first sync in PR #10649 ran into exactly that at review), the facility fetches a small bootstrap bundle from central before its first sync: just enough for the unchanged login path to succeed.
The first sync still pulls from the beginning of the timeline and overwrites every bootstrapped row with its current version, so sync itself is untouched and the full pull stays self-consistent.

## Central: bootstrap endpoint

- Sync-user authenticated (sync client scope), takes the server's facility ids like a pull does.
- Reads from `sync_lookup` with the same facility filtering the outgoing snapshot uses, and returns records in the same shape a pull does, so the bundle is by construction what sync would send for those tables.
- Record types: facilities, the reference data rows referenced by `facilities.catchment_id` (only those, not all reference data), users (with password hashes, so local-login fallback works), user facilities, roles, permissions, settings (global plus these facilities), and a subset of translated strings.
- Translated strings: all languages, filtered to the ids the pre-sync screens use: `languageName` and `countryCode` (needed to list languages), plus prefixes for login, forgot/reset password, splash, setup, facility selection, validation and general actions. The prefix list lives in constants next to the endpoint. Drift only costs an English fallback on a transient screen.
- No patient data.

## Facility: applying the bundle

- Rows are written the way a pull writes them: `updatedAtSyncTick` set to the incoming-from-central flag, so they settle as last-updated-elsewhere and are never pushed back; audit paused and deferred sync safeguards on, as in the first-sync persist.
- `saveIncomingChanges` reads from a session snapshot table, so the bundle needs either a throwaway snapshot table or a per-model persist entry point that takes records directly. Decide at implementation.
- The pull cursor is not touched.

## Who fetches it

- **Wizard:** after minting the sync user, logs in as that sync user (proving the minted credentials end to end), fetches the bundle, then writes the setup facts and the bundle in one transaction under the existing setup advisory lock. Configured and bootstrapped can never diverge. The wizard then logs the admin in with the credentials they just entered.
- **Sync process:** before a sync session, if the pull cursor is unset, fetches and applies the bundle. Covers env-configured servers (which never run the wizard) and a server whose wizard fetch was lost. A failed bootstrap is logged and the session runs anyway: the bootstrap is a convenience and must never hold up the first sync.

### Concurrency

The two paths don't overlap by construction: the sync process only sees a wizard-configured server once the wizard's transaction (facts plus bundle) has committed, and the wizard refuses to run on an env-configured server.
Even so, bootstrapping is idempotent and always current: the bundle is a fresh read of central, and the first sync's persist and cursor write share one transaction, so a bootstrap can never land stale data over a completed first sync.
No "bootstrapped" marker is needed; the sync process re-fetching a small bundle on each first-sync attempt is cheap.

## Pre-first-sync state

- The state is "configured, pull cursor unset". No new fact.
- `/public/ping` reports it, alongside `setupRequired`.
- Web: after login, and ahead of facility selection, a logged-in user sees the setting-up screen (reusing `StatusPage`), polled until the first sync completes, with a log out action. Static heading: not the `LoadingStatusPage` ellipsis animation, which shifts the centred heading as it grows. Everyone is held there; there's nothing to let people into early.
- Because the screen is driven by server state, closing the wizard and coming back lands on the same screen.

## Follow-up

Progress reporting on the setting-up screen is a separate card in the breakdown.
