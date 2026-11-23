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

### Compatibility within a minor

- Every release in a minor runs under the definition of any other release in that minor.
- A release changes its definition, and the parts of Tamanu a definition drives (its routes and commands among them), only in ways that keep this true.
- The one exception is a release that restores compatibility an earlier release in the minor broke by mistake. It may break compatibility with that earlier release's definition in doing so.

> [!NOTE]
> What a definition must say can change between minor versions, as it did when configuration files went. Holding a definition to its own minor, and every release in a minor to every definition in it, means a server never runs a release under a definition that does not know that release's needs.

## Crossing a minor version

- An upgrade across minor versions updates the definition and the version together, in one change.
- The upgrade then runs under the new definition, which knows what the new release needs.
- Updating the definition to another minor's while the version is set to a release of the current minor is refused, with the same reason, unless the version changes with it.

## The upgrade

- A definition's **upgrade** [gate](overview.md#borrowed-terms) is keyed on the version, so changing the version upgrades the server, whether an operator sets it or a definition update moves its default.
- The new release's images are pulled before anything is stopped. A failed pull leaves the server running its current version, untouched, and the upgrade is retried.
- Once the images are present, every part that connects to the database is stopped. The web app and patient portal go on serving the current release.
- The new release's migrations then run against the database.
- When the migrations succeed, the new release's parts are started, and the web app and patient portal move to the new release.

### Moving to an older release

- Moving to an older release in the same minor runs the same way as an upgrade.
- Migrations the older release does not know are left in place.

### Retrying an upgrade

- A failed upgrade is retried automatically, at growing intervals.
- An operator retries it at once by running the upgrade gate, and stops the retries by cancelling a run, until they run the gate again or change the version.
- A retry starts again from pulling the images, and steps already done are done again without harm.

### Checking the migrations

- The upgrade checks that the database has no migrations pending for the version set: after migrating, and before starting a part that is not running.
- A check that finds migrations pending runs the upgrade again before the parts start, so a database restored from a backup taken before an upgrade is migrated again.

## When migrations fail

- When the new release's migrations fail, the server's parts stay stopped and the upgrade fails, with a fault that carries the migration's error.
- The parts stay stopped through retries and restarts of the host, until an upgrade succeeds.
- The previous release is not started again automatically. An operator restores the database, fixes forward by setting a release whose migrations succeed, or moves back to the previous release, which runs as [moving to an older release](#moving-to-an-older-release) does.

> [!NOTE]
> A previous release runs against a partly migrated database when the migrations that ran are backward compatible with it. Whether they are depends on the migrations, which the definition cannot tell, so the choice is the operator's.
