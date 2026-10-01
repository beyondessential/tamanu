# Initialise database during facility setup wizard

Scenarios verifying that a new facility can be logged into before its first sync completes, and that users are held on the setting-up screen until it does.

## Bootstrap contents (central)

- [x] The bootstrap carries facilities, users, user facility links, roles and permissions (verifies spec: FBOOT)
- [x] Users carry their password hashes (verifies spec: FBOOT)
- [x] Reference data is limited to facility catchments (verifies spec: FBOOT)
- [x] Settings are global plus the requested facilities' only (verifies spec: FBOOT)
- [x] Translated strings are limited to the language list and the pre-sync screens' prefixes, in every language (verifies spec: FBOOT)
- [x] The bootstrap carries no patient-linked record types (verifies spec: FBOOT)
- [x] Each record has the shape of a pulled change, including deleted records marked as deleted (verifies spec: FBOOT)
- [x] A request without facility ids is refused (verifies spec: FBOOT)
- [x] A request without a sync client device is refused (verifies spec: FBOOT)

## Applying the bootstrap (facility)

- [x] Bootstrapped records are saved as last updated elsewhere, so they are never pushed back (verifies spec: FBOOT)
- [x] Records are saved in dependency order whatever order central sends them in (verifies spec: FBOOT)
- [x] Applying again replaces records with their current versions (verifies spec: FBOOT)
- [x] Deleted records are saved as deleted (verifies spec: FBOOT)
- [x] The pull cursor is left alone (verifies spec: FBOOT)
- [x] A bootstrap that fails to apply leaves none of it saved (verifies spec: FBOOT)
- [x] A bootstrapped user can log in, and sees the server's facilities as available (verifies spec: FSETUP)
- [ ] The first sync overwrites bootstrapped records with their current versions, with no errors from records already present (verifies spec: FBOOT)

## When the facility bootstraps

- [x] The sync process fetches and applies the bootstrap in a transaction before its first sync session while the pull cursor is unset (verifies spec: FBOOT)
- [x] The sync process does not bootstrap once the pull cursor is set (verifies spec: FBOOT)
- [x] The sync process bootstraps once per process start, not before every attempt (verifies spec: FBOOT)
- [x] A failed bootstrap is logged, the sync session still runs, and the bootstrap is retried on the next attempt (verifies spec: FBOOT)
- [ ] A server configured through environment variables (no wizard) can be logged into shortly after it starts, while its first sync is still running (verifies spec: FBOOT)

## Setup wizard

- [x] The wizard logs in to central as the minted sync user with the sync client scope and requests the bootstrap for the entered facilities (verifies spec: FSETUP)
- [x] The configuration and the bootstrap are saved together (verifies spec: FSETUP)
- [x] A bootstrap that can't be fetched leaves the server unconfigured, with an error the wizard shows (verifies spec: FSETUP)
- [x] A bootstrap that can't be saved leaves the server unconfigured (verifies spec: FSETUP)
- [x] On success the wizard logs the administrator in before leaving, so it goes straight to the setting-up screen (verifies spec: FSETUP)
- [x] On failure the wizard shows the error and does not log in (verifies spec: FSETUP)
- [ ] End to end on a fresh server: completing the wizard lands the administrator on the setting-up screen, logged in, with "Server set up successfully." shown (verifies spec: FSETUP)

## Setting-up state and screen

- [x] The liveness check reports setting up while the pull cursor is unset, and not once it is set (verifies spec: FSETUP)
- [x] A server with sync turned off never reports setting up (verifies spec: FSETUP)
- [x] Once it has seen the first sync completed, the liveness check stops reading the database for it
- [x] A logged-out user on a server that is setting up sees the login screen (verifies spec: FSETUP)
- [x] A logged-in user is held on the setting-up screen ahead of facility selection, including one whose only facility was selected at login (verifies spec: FSETUP)
- [x] Once the first sync completes, the user carries on to facility selection (verifies spec: FSETUP)
- [x] The setting-up screen tells the user the facility is being set up and offers Log out (verifies spec: FSETUP)
- [ ] The setting-up screen moves on by itself within a few seconds of the first sync completing, without a reload (verifies spec: FSETUP)
- [ ] Closing the browser and returning, or logging in as another user, shows the setting-up screen again while setup continues (verifies spec: FSETUP)
- [ ] A non-admin facility user can log in during setup and is held on the setting-up screen (verifies spec: FSETUP)
- [ ] Login falls back to local credentials during setup when central is unreachable (verifies spec: FSETUP)
- [ ] The setting-up screen matches the Figma frame and mockup: heading with animated dots that don't move the heading, 14px description, filled Log out button
- [ ] The "not available on your browser" screen still looks right with the shared status page's new description and button sizing
- [ ] The login and setting-up screens show in the deployment's language when its translations exist on central (verifies spec: FBOOT)
