# Sync session test cases

Automated cases live in `packages/central-server/__tests__/sync/syncFacilityAccess.test.js`.

## Pull scope

Verifies spec: SYNC#pulling.

- [x] A pull naming the facilities the session started for succeeds and its snapshot completes
- [x] A pull naming no facilities uses the session's own facilities
- [x] A pull naming a facility the session did not start for is refused, alone or alongside an allowed one

## Session ownership

Verifies spec: SYNC#session-ownership.

- [x] Another user cannot read, pull, push, error or end a session they did not start
- [x] The same user on a different device cannot use the session either
- [x] Refused calls leave the owner's session usable

## Manual

- [ ] A facility server on the patched central completes a full sync (push and pull) as normal
- [ ] A mobile device on the patched central completes a full sync as normal
- [ ] A device mid-sync during the upgrade is refused once, then its next sync completes
