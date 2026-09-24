---
id: FSETUP
---

# Facility server setup

A facility server started with no central server configured serves a setup wizard in place of the login screen.
The wizard connects the server to central. From then until its first sync completes, the server is setting up: users can log in, and are held on a setting-up screen until the facility's data has arrived.

## Setup wizard

- [ ] The wizard shows while the server has no central server configured, either through its environment or through an earlier wizard run.
- [ ] The wizard asks for the central server address, the email and password of a central administrator, and the facilities the server serves.
- [ ] The wizard is only available to requests from local or private network addresses.
- [ ] The wizard refuses to run on a server that is already configured.
- [ ] The credentials entered must belong to a central administrator with full access. Central uses them to mint a dedicated sync user for this server, and the server does not store them.
- [ ] The wizard then logs in to central as the minted sync user and fetches the facility bootstrap (see `sync/bootstrap.md`). If this fails, the wizard reports that the server could not be set up, and the server stays unconfigured.
- [ ] The server's configuration (central address, sync credentials, and facilities) and the bootstrap are saved in one transaction, so a server is never configured without its bootstrap.
- [ ] Once setup succeeds, the wizard logs the administrator in with the credentials they entered, which takes them to the setting-up screen.

## Setting-up state

- [ ] A facility server is setting up while it is configured and its first sync has not completed, that is, while its pull cursor is unset.
- [ ] The server's liveness check reports whether it is setting up, alongside whether setup is required.
- [ ] Logging in while the server is setting up follows the same path as at any other time: through central, falling back to local credentials when central cannot be reached.

## Setting-up screen

- [ ] A logged-in user on a server that is setting up sees the setting-up screen ahead of facility selection, whatever their role.
- [ ] The screen tells the user the facility is being set up and asks them to wait.
- [ ] The screen checks periodically whether the first sync has completed. When it has, the user carries on to facility selection as after any login.
- [ ] The screen offers a way to log out.
- [ ] The screen follows the server's state rather than the browser session, so a user who closes the page and returns, or logs in afresh, sees it for as long as the server is setting up.
