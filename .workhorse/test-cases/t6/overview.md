# Reference data importer for sensitive networks + guard against removal

Scenarios verifying that networks and facility membership can be administered through the reference
data spreadsheet, and that no import or other write can move a facility out of, or between, networks.
Spec: `specs/sync/sensitive-networks.md` (SENSNET).

Tests live in `packages/central-server/__tests__/importers/sensitiveNetworkImporter.test.js`,
`.../sensitiveNetworkRoundTrip.test.js`, and `packages/database/__tests__/models/SensitiveNetwork.test.ts`.

**These tests have been written but not executed.** `npm install` fails in this worktree — `xlsx` is
declared as a remote tarball from `cdn.sheetjs.com` and remote fetches are disabled here — so there
is no way to run vitest against them. A tick below means a test exists for the scenario, not that it
has been seen to pass. The suite needs a run somewhere with dependencies installed before any of
this is trusted.

## Importing networks

- [x] A network sheet row creates a network with its id, code and name. verifies spec: SENSNET
- [x] A row missing a code, or missing a name, fails on that row. verifies spec: SENSNET
- [x] A row whose code duplicates another network's fails, and likewise for name. verifies spec: SENSNET
- [x] Re-importing a network under its own id with a different code and name updates both. verifies spec: SENSNET
- [x] A user without create and write permission on the network type is refused the import, and a user with it succeeds. verifies spec: SENSNET
- [x] The network sheet is accepted under both its singular and plural tab names, as every other reference data sheet is.

## Enrolling facilities

- [x] A new facility row naming a network is created enrolled in it. verifies spec: SENSNET
- [x] One file defining a network and creating facilities into it imports both, with the facilities enrolled. verifies spec: SENSNET
- [x] Two new facilities naming the same new network both join it. verifies spec: SENSNET
- [x] A facility row naming a network that does not exist fails on that row. verifies spec: SENSNET
- [x] A facility sheet with no network column imports, and existing memberships are untouched. verifies spec: SENSNET

## Refusing membership changes

- [x] **An existing facility in no network, re-imported with a network id, is refused.** This is the case the card exists for, and the one an administrator is most likely to attempt. verifies spec: SENSNET
- [x] An existing facility in a network, re-imported with an empty network cell, keeps its network — the empty cell is not read as a removal. verifies spec: SENSNET
- [x] The same holds when the cell holds an empty string rather than being genuinely blank. Surfaced during implementation: a blank cell produces no key, but an explicit `''` survives the cast and would otherwise be written as a removal and refused. verifies spec: SENSNET
- [x] An existing facility in a network, re-imported naming a different network, is refused. verifies spec: SENSNET
- [x] An existing facility in a network, re-imported naming the same network, imports without complaint — re-importing an unchanged file is not a membership change. verifies spec: SENSNET
- [x] A facility that was the sole member of its network cannot be moved either, so sole membership is not a loophole. verifies spec: SENSNET
- [x] A soft-deleted facility re-imported with a network id is refused, rather than being enrolled by undeletion. verifies spec: SENSNET
- [x] A refused row names the facility and states that only a new facility can be enrolled in a network. verifies spec: SENSNET
- [x] A file whose only fault is one refused facility row imports none of its other rows. verifies spec: SENSNET
- [x] Validating that file without importing reports the same failure and writes nothing. verifies spec: SENSNET

## The guard outside the importer

- [x] Setting a network on an existing facility through the model is refused, so the rule does not depend on the import path. verifies spec: SENSNET
- [x] Clearing an existing facility's network through the model is refused. verifies spec: SENSNET
- [x] Creating a facility already enrolled in a network succeeds. verifies spec: SENSNET
- [ ] The schema card's backfill migration still enrols existing sensitive facilities, because it writes through SQL rather than the model. verifies spec: SENSNET
- [ ] **Incoming sync still applies a facility whose network was set centrally to a facility server that holds it with none.** Surfaced during implementation: sync writes through `Model.update`, which validates against a fake `isNewRecord: true` instance, so the guard returns early. This is the transition the guard refuses, and it has to keep working — a deployment upgrading with sensitive facilities syncs exactly this. verifies spec: SENSNET
- [ ] Provisioning re-applying a facility block that names the facility's current network is not treated as a change, so a repeated deploy does not fail. verifies spec: SENSNET

## Export round-trip

- [x] Exporting reference data emits the network sheet and the facility network column. verifies spec: SENSNET
- [x] Exporting a deployment's reference data and importing it back unchanged leaves every facility's membership intact and raises no refusal. verifies spec: SENSNET

## Provisioning

- [ ] `provision` with the default spreadsheet succeeds with no network sheet present, rather than failing the completeness check. verifies spec: SENSNET
- [ ] A deployment provisioned from the default spreadsheet has no networks and no sensitive facilities. verifies spec: SENSNET

## Upgrade

- [x] A facility sheet still carrying the pre-network sensitivity column imports without error, and the column changes nothing. The importer passes unknown columns through to the model, which drops unrecognised attributes — worth confirming rather than assuming.
