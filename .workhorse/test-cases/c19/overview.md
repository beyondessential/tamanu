# Test cases: admin panel settings re-read and logout clearing

## Admin panel follows settings changes (verifies spec: BTEL)

- [x] Central's front-end settings endpoint serves central settings when no facility is given (`central-server/__tests__/settings/frontEndSettings.test.js`)
- [x] Central's front-end settings endpoint still serves a facility's settings when one is given (same file)
- [x] The settings refresh runs for a session with no facility, and drops a response that lands after the user or facility changed (`web/__tests__/store/refreshSettings.test.js`)
- [x] Signed in to the admin panel, turn `telemetry.enabled` on in the settings editor: within a few seconds the saved `settings` in local storage shows it on, without a reload (`e2e-tests/tests/telemetry/telemetrySettings.spec.ts`, TEL-0003)
- [ ] With it on, telemetry batches start reaching central
- [x] Turn it back off: the saved setting follows (TEL-0003)
- [ ] With it off, batches stop

## Logout clears the saved setting (verifies spec: BTEL)

- [x] Log out of the clinical app: the saved `settings` entry is gone from local storage (TEL-0001)
- [x] Logout and idle timeout drop the session's settings from the store (`web/__tests__/store/authReducer.test.js`)
- [ ] With telemetry on, the login screen sends no telemetry after logout
- [x] Same for the admin panel (TEL-0002)
- [ ] Same after an idle timeout logs the user out
