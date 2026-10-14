# Initialise database during facility setup wizard

## Approach

A fresh facility can't be logged into until its first sync lands, because login resolves a user's facilities, role and permissions against local tables that are still empty.
Rather than changing sync (the phased first sync in PR #10649 ran into exactly that at review), the facility fetches a small bootstrap bundle from central before its first sync: just enough for the unchanged login path to succeed.
The first sync still pulls from the beginning of the timeline and overwrites every bootstrapped row with its current version, so sync itself is untouched and the full pull stays self-consistent.

## Central: bootstrap endpoint

- Sync-user authenticated (sync client scope), takes the server's facility ids like a pull does.
- Reads each table with that model's own sync filter (see implementation notes), and returns records in the same shape a pull does, so the bundle is what sync would send for those tables.
- Record types: facilities, the reference data rows referenced by `facilities.catchment_id` (only those, not all reference data), users (with password hashes, so local-login fallback works), user facilities, roles, permissions, settings (global plus these facilities), and a subset of translated strings.
- Translated strings: all languages, filtered to the ids the pre-sync screens use: `languageName` and `countryCode` (needed to list languages), plus prefixes for login, forgot/reset password, splash, setup, facility selection, validation and general actions. The prefix list lives in constants next to the endpoint. Drift only costs an English fallback on a transient screen.
- No patient data.

## Facility: applying the bundle

- Rows are written the way a pull writes them: `updatedAtSyncTick` set to the incoming-from-central flag, so they settle as last-updated-elsewhere and are never pushed back; audit paused and deferred sync safeguards on, as in the first-sync persist.
- The pull cursor is not touched.

## Who fetches it

- **Wizard:** after minting the sync user, logs in as that sync user (proving the minted credentials end to end), fetches the bundle, then writes the setup facts and the bundle in one transaction under the existing setup advisory lock. Configured and bootstrapped can never diverge. The wizard then logs the admin in with the credentials they just entered.
- **Sync process:** before a sync session, if the pull cursor is unset, fetches and applies the bundle. Covers env-configured servers (which never run the wizard) and a server whose wizard fetch was lost. A failed bootstrap is logged and the session runs anyway: the bootstrap is a convenience and must never hold up the first sync.

### Concurrency

The two paths don't overlap by construction: the sync process only sees a wizard-configured server once the wizard's transaction (facts plus bundle) has committed, and the wizard refuses to run on an env-configured server.
Even so, bootstrapping is idempotent and always current: the bundle is a fresh read of central, and the first sync's persist and cursor write share one transaction, so a bootstrap can never land stale data over a completed first sync.
No "bootstrapped" marker is needed; see implementation notes for how often the sync process fetches it.

## Pre-first-sync state

- The state is "configured, pull cursor unset". No new fact.
- `/public/ping` reports it, alongside `setupRequired`.
- Web: after login, and ahead of facility selection, a logged-in user sees the setting-up screen, polled until the first sync completes, with a log out action. It is a `StatusPageWithHeroImage` (as `UnsupportedBrowserStatusPage` uses), which already has the wizard's split layout with left-aligned text; it needs to accept children for the filled Log out button. Bring it in line with the Figma frame for this screen: heading 38px, description 14px, button 14px text with 8px/20px padding and no minimum width. Content positioning stays as the component has it. This also restyles `UnsupportedBrowserStatusPage`, which shares the component. The heading carries the animated ellipsis from `LoadingStatusPage`; left-aligned, the dots grow to the right without shifting the heading. Everyone is held there; there's nothing to let people into early.
- Because the screen is driven by server state, closing the wizard and coming back lands on the same screen.

## Follow-up

Progress reporting on the setting-up screen is a separate card in the breakdown.

## Implementation notes

- **Central reads source tables, not the lookup table.** Every bootstrap model except settings syncs everywhere (`buildSyncFilter()` returns null), and settings has its own filter. Reading source tables with each model's `buildSyncFilter()` mirrors the models path of the outgoing snapshot, and works whether or not the lookup table is enabled (it is off in the test config). The lookup table can lag its sources slightly, so the first pull may briefly carry an older copy of a bootstrapped record than the bootstrap did; the next sync settles it.
- **The facility saves with `saveChangesForModel`**, which takes records directly, in dependency order, inside `withDeferredSyncSafeguards` with audit paused, as the first-sync persist does. No throwaway snapshot table needed.
- **The sync process bootstraps once per process start**, before its first sync attempt while the pull cursor is unset, and retries on later attempts only if that failed. Bootstrapping before every attempt would refetch on every scheduled tick while the facility waits in central's sync queue.
- **A server with sync turned off is never setting up**, so a development server without sync isn't stuck on the setting-up screen.
- **The liveness check stops reading the pull cursor once it has seen it set.** `/public/ping` answered without the database before this card; a completed first sync stays completed, so after setup it goes back to not touching the database, and a database it can't reach reports not setting up rather than failing the check.

## Build checklist

- [x] Constants: bootstrap translation string ids and prefixes
- [x] Central: `POST /api/sync/bootstrap` (sync client device, same user checks as starting a session), building records from source tables
- [x] Central tests: contents, facility scoping of settings, catchment-only reference data, translation filter, record shape, auth
- [x] Facility: `applyBootstrap` (save records as pulled) and `CentralServerConnection.fetchBootstrap`
- [x] Facility: wizard logs in as the minted sync user, fetches the bootstrap, saves facts and bootstrap in one transaction
- [x] Facility: sync manager bootstraps before its first attempt while the pull cursor is unset; failure logged, session runs
- [x] Facility: `/public/ping` reports `isSettingUp`
- [x] Facility tests: apply bootstrap (tick flag, idempotent, deletions), sync manager bootstrap behaviour, ping
- [x] Web: `StatusPageWithHeroImage` takes children, Figma sizing; `SettingUpStatusPage` with animated ellipsis and Log out
- [x] Web: App holds logged-in users on the setting-up screen and polls; wizard logs the admin in, new success copy
- [x] Specs: align Facility bootstrap and Facility server setup with the implementation notes above
- [x] Test cases file
