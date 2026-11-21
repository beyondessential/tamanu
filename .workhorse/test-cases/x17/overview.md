# Remove the facility bootstrap

Scenarios covering the setup wizard and the setting-up screen once the bootstrap is gone.

## Setup wizard

- [ ] After minting the sync user, the wizard logs in as it and saves the configuration (verifies spec: FSETUP)
- [ ] When central refuses the minted sync user's login, the wizard reports it and the server stays unconfigured (verifies spec: FSETUP)
- [ ] A successful setup leaves the wizard by refreshing the server status, without logging anyone in (verifies spec: FSETUP)
- [ ] A failed setup keeps the wizard open with the error shown (verifies spec: FSETUP)

## Setting-up screen

- [ ] A logged-out visitor to a setting-up server sees the setting-up screen, not the login screen (verifies spec: FSETUP)
- [ ] A browser that still holds a session sees the setting-up screen while the server is setting up (verifies spec: FSETUP)
- [ ] Once the first sync completes, the setting-up screen gives way to the login screen (verifies spec: FSETUP)
- [ ] The setting-up screen tells the visitor the facility is being set up and offers no Log out button (verifies spec: FSETUP)

## Central

- [ ] Central refuses a sync session naming a facility the sync user cannot access
- [ ] `POST /api/sync/bootstrap` no longer exists on central

## Manual

- [ ] On a fresh facility server, run the wizard against a real central: the browser lands on the setting-up screen, then on the login screen once the first sync completes, and logging in works
- [ ] On a fresh server configured through its environment, opening the web app before the first sync completes shows the setting-up screen
