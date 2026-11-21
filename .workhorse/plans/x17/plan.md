# Remove the facility bootstrap

## Approach

Drop the `POST /api/sync/bootstrap` endpoint and everything that fetches or applies it, and hold visitors on the setting-up screen ahead of login until the first sync completes.
The setting-up state already keys on the pull cursor being unset (`isSettingUp` in `serverConfig.js`, reported on `/public/ping`), so it stays as it is.

## Decisions

- The wizard still logs in as the minted sync user after minting it, as a credentials check, but fetches nothing. A failure leaves the server unconfigured.
- The wizard no longer logs the administrator in. On success the app goes straight to the setting-up screen with no session, then to the login screen once the first sync completes.
- The setting-up screen sits ahead of the login screen in `App.jsx` and loses its Log out button. It shows whether or not the browser holds a session.
- Session start on central keeps the awaited facility access check from `assertUserCanSyncFacilities`: the check it replaced never awaited `canAccessFacility`, so it never refused.
- Facilities that already applied a bootstrap need no cleanup: those rows are marked last updated elsewhere and the first sync overwrites them.
- The setting-up screen's copy falls back to English, since translated strings only arrive with the first sync.

## What goes

- Central: the `/bootstrap` route in `buildSyncRoutes.js`, `buildFacilityBootstrap.js`, and their tests (`facilityBootstrap.test.js`, the bootstrap cases in `syncFacilityAccess.test.js`)
- Constants: `BOOTSTRAP_TRANSLATION_STRING_IDS` and `BOOTSTRAP_TRANSLATION_STRING_ID_PREFIXES`
- Facility: `facilityBootstrap.js`, `CentralServerConnection.fetchBootstrap`, the sync manager's `bootstrap()` and `hasBootstrapped`, the wizard's fetch and apply, and their tests
- Web: the wizard's post-setup login, and the setting-up screen's Log out button

## Build checklist

- [ ] Central and constants: remove the bootstrap route, builder, translation constants and tests; inline the awaited facility access check back into session start
- [ ] Facility: remove `applyBootstrap`, `fetchBootstrap` and the sync manager's bootstrap; the wizard logs in as the sync user without fetching; tests
- [ ] Web: setting-up screen ahead of login without Log out; wizard no longer logs in; tests
- [ ] Test cases file
