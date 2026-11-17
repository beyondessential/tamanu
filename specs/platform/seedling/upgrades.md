---
id: SDUPG
---

# Upgrading under a Seedling definition

Applies to the version parameter of Tamanu's [Seedling definitions](overview.md), which versions it accepts, and the upgrade that changing it performs.

## Version parameter

- A definition's version parameter names the Tamanu build its server runs, by the tag of that build's images.
- A [published definition](publishing.md#published-version) defaults its version to the build it was published with. A definition run from the repository has no default, and its version must be set.
- A published definition accepts any release in the same minor version as the build it was published with, older or newer, and that build itself. A build that is not a release is in the minor of the Tamanu version it carries.
- A published definition refuses a version in any other minor, with a reason saying that the definition for that minor is needed.
- A definition run from the repository accepts any image tag as its version, such as the build of a branch.

> [!NOTE]
> What a definition must say can change between minor versions, as it did when configuration files went. Holding a definition to its own minor means a server never runs a release under a definition that does not know that release's needs.

## Crossing a minor version

- An upgrade across minor versions updates the definition and the version together, in one change.
- The upgrade then runs under the new definition, which knows what the new release needs.
- Updating the definition to another minor's while the version is set to a release of the current minor is refused, with the same reason, unless the version changes with it.

## The upgrade

- Changing the version upgrades the server in a single operation.
- The new release's images are pulled before anything is stopped. A failed pull leaves the server running its current version, untouched.
- Once the images are present, the definition tells the supervisor that an upgrade has started, and stops every part of the server but the supervisor.
- While the parts are stopped, the supervisor answers requests with its [upgrading response](../supervisor/overview.md#upgrades).
- The new release's migrations then run against the database.
- When the migrations succeed, the new release's parts are started. Once they are ready, the supervisor is replaced with the new release's, which serves normally.

### Moving to an older release

- Moving to an older release in the same minor runs the same way as an upgrade.
- Migrations the older release does not know are left in place.

### Retrying an upgrade

- A definition offers a **Retry upgrade** action, which runs the upgrade to the version already set.
- Retrying an upgrade that failed starts again from pulling the images, and steps already done are done again without harm.

## When migrations fail

- When the new release's migrations fail, the server's parts stay stopped and the operation fails, with a fault that carries the migration's error.
- The supervisor goes on answering with its upgrading response.
- The previous release is not started again automatically. An operator restores the database, fixes forward by setting a release whose migrations succeed, or moves back to the previous release, which runs as [moving to an older release](#moving-to-an-older-release) does.

> [!NOTE]
> A previous release runs against a partly migrated database when the migrations that ran are backward compatible with it. Whether they are depends on the migrations, which the definition cannot tell, so the choice is the operator's.
