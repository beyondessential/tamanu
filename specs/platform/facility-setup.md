---
id: FSETUP
---

# Facility server setup

Applies to the setup wizard a facility server serves in place of the login screen while it has no central server configured, and to the setting-up state it holds from then until its first sync completes.

## Setup wizard

- The wizard shows while the server has no central server configured, either through its environment or through an earlier wizard run.
- The wizard asks for the central server address, the email and password of a central administrator, and the facilities the server serves.
- The wizard is only available to requests from local or private network addresses.
- The wizard refuses to run on a server that is already configured.
- The credentials entered must belong to a central administrator with full access. Central uses them to mint a dedicated sync user for this server, and the server does not store them.
- The wizard then logs in to central as the minted sync user, to confirm its credentials work.
- If central cannot be reached, rejects the administrator's credentials, cannot mint the sync user, or refuses the sync user's login, the wizard reports it and the server stays unconfigured.
- The server's configuration (central address, sync credentials, and facilities) is saved in one transaction.
- Once setup succeeds, the wizard gives way to the setting-up screen.

## Setting-up state

- A facility server is setting up while it is configured and its first sync has not completed, that is, while its pull cursor is unset.
- A server with sync turned off is never setting up.
- The server's liveness check reports whether it is setting up, alongside whether setup is required.

## Setting-up screen

- While the server is setting up, the web app shows the setting-up screen in place of the login screen, whether or not the browser holds a session.
- The screen tells the visitor the facility is being set up and asks them to wait.
- The screen checks periodically whether the first sync has completed. When it has, it gives way to the login screen.
- The screen follows the server's state rather than the browser session, so a visitor who closes the page and returns sees it for as long as the server is setting up.

> [!NOTE]
> A facility server cannot log anyone in until its first sync has brought down its users, roles and facilities, so the screen holds visitors ahead of the login screen rather than letting them sign in to a server that would refuse them.
