# Test cases: admin panel settings re-read and logout clearing

## Admin panel follows settings changes (verifies spec: BTEL)

- [x] Central's front-end settings endpoint serves central settings when no facility is given (`central-server/__tests__/settings/frontEndSettings.test.js`)
- [x] Central's front-end settings endpoint still serves a facility's settings when one is given (same file)
- [x] The settings refresh runs for a session with no facility, and drops a response that lands after the user or facility changed (`web/__tests__/store/refreshSettings.test.js`)
- [ ] Signed in to the admin panel, turn `telemetry.enabled` on in the settings editor: within a few seconds the saved `settings` in local storage shows it on, and telemetry batches start reaching central without a reload
- [ ] Turn it back off: the saved setting follows and batches stop

## Logout clears the saved setting (verifies spec: BTEL)

- [ ] With telemetry on, log out of the clinical app: the saved `settings` entry is gone from local storage and the login screen sends no telemetry
- [ ] Same for the admin panel
- [ ] Same after an idle timeout logs the user out
