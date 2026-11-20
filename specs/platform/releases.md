---
id: REL
---

# Moving a server between releases

Applies to what a central or facility server checks of its database when it starts, moving a server to an older release than the one that last migrated its database, and how far apart the releases of servers and clients that work together can be.

## Starting against a database

- A server refuses to start while its database has migrations pending, that is, migrations the release carries that have not run. It starts once they have run, or when it is told to run them on start or to skip the check.
- Migrations that have run but that the release does not carry are left in place, and do not stop it starting.
- A server does not compare its release with the release that last migrated its database.

## Moving to an older release

- A server can be moved to any older release, within its minor version or across minor versions, and nothing refuses the move.
- The older release runs against the database as the newer release left it, with the newer release's migrations still in place.
- Whether the older release works there depends on whether the migrations it does not carry are backward compatible with it.
- An operator who would rather not leave them in place reverts them with the newer release before moving, since the older release does not carry them and cannot revert them. Reverting a migration that cannot restore what it changed loses that data.
- Moving forward again to a release whose migrations have already run does not run them again. Data the older release wrote in the meantime has not been through what those migrations did to existing rows.
- Whether to move to an older release, and how, is the operator's decision.

> [!NOTE]
> BES does not offer technical support for a server moved to an older release, and an operator who does so carries the risk. That is a statement about support, not about what Tamanu does: moving back has worked in practice, and is left open so an operator can take a server back when a release goes wrong. A refusal would take that option away without making any move safer, since only the operator can tell whether the migrations involved allow it.

## Backward-compatible migrations

- Migrations are written to stay backward compatible with earlier releases where they can, so that an earlier release keeps working against the database they leave.
- A migration that cannot stay backward compatible, because the change it makes needs to break it, is still made.
- A migration that breaks backward compatibility is marked as doing so in its source, with what an earlier release trips on, so an operator can find the breaking migrations between two releases by searching for the marker.

> [!NOTE]
> Backward compatibility is best effort, not a guarantee at any level, including between patch releases of one minor. Keeping to it most of the time is what makes moving back a workable option.
>
> The marker is a first pass, not a verdict. It is written by hand, so a marked migration may turn out harmless to the release in question, and an unmarked one may still break it. It narrows what an operator reads before moving back; it does not decide for them.

## Release compatibility across servers

- A central server accepts facility servers, the web app and mobile devices only on a release in its own minor version.
- A facility server accepts the web app only on a release in its own minor version.
- A release can raise the lowest release it accepts within its minor, when an earlier release in the minor turns out to be incompatible with it.
- A facility server moved to an older release in another minor stops syncing with its central server until the two are back in one minor.
