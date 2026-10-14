# Alternative central connection endpoints: test cases

Scenarios for the Central connection endpoints spec (CEND). Ticked cases are covered by automated tests.

## Endpoint setting and validation

- [x] https endpoints are accepted for any host (verifies spec: CEND)
- [x] http endpoints are accepted for names with no dot, the internal suffixes, and private, loopback, link-local and Tailscale IPv4 and IPv6 addresses (verifies spec: CEND)
- [x] http endpoints on public hosts are rejected when the setting is saved (verifies spec: CEND)
- [x] endpoints with a path, query, fragment or credentials are rejected (verifies spec: CEND)
- [x] two spellings of the same endpoint count as one (verifies spec: CEND)
- [x] an http endpoint is rejected on save while central requires HTTPS, including when the same save turns it on (verifies spec: CEND)
- [x] the setting is high risk and declared at global and facility scope (verifies spec: CEND)

## Recorded endpoints on the facility

- [x] the effective list is facility entries then global entries with later duplicates dropped (verifies spec: CEND)
- [x] a server hosting several facilities uses each facility's entries in turn, then the global ones (verifies spec: CEND)
- [x] an empty list leaves the recorded list alone (verifies spec: CEND)
- [x] an identical list changes nothing (verifies spec: CEND)
- [x] a changed list is recorded only once a login at one of its entries succeeds, and the whole list replaces the old one (verifies spec: CEND)
- [x] a list where no entry passes leaves the recorded list in place and is tried again later (verifies spec: CEND)
- [x] SYNC_URL fixes the host and central's list is ignored (verifies spec: CEND)
- [x] the boot-time host check accepts a declared host in the recorded list or equal to the seed host, and still fails for one in neither (verifies spec: CEND)
- [x] forgetting a copied database's server identity removes the recorded list and the endpoint in use (verifies spec: CEND)
- [x] a recorded list is used after a restart, and a malformed one is ignored (verifies spec: CEND)
- [x] a changed list applies to the websocket connection and time synchronisation without a restart (verifies spec: CEND)

## Choosing an endpoint

- [x] connections use an endpoint only after a login at it succeeds (verifies spec: CEND)
- [x] an unreachable first endpoint, or one that refuses the login, moves the facility to the next (verifies spec: CEND)
- [x] an endpoint that stops working mid-use walks the list again from the top and retries the call (verifies spec: CEND)
- [x] when every endpoint fails the original error surfaces under the normal backoff (verifies spec: CEND)
- [x] a locked-out account does not trigger a walk (verifies spec: CEND)
- [x] an endpoint that refused the credentials is not asked again in the same attempt, whether or not the walk finds another (verifies spec: CEND)

## Refused credentials

- [x] after a refusal logins pause, and calls fail at once with a rate-limited error without contacting central, for one endpoint, several, and no selector (verifies spec: CEND)
- [x] the pause grows by five each round up to the maximum, and a round of several refusals counts once (verifies spec: CEND)
- [x] no more than two rounds fit inside the default lockout window (verifies spec: CEND)
- [x] rechecks, walks and list verification probe nothing while paused (verifies spec: CEND)
- [x] a successful login or changed credentials end the pause and restart the schedule (verifies spec: CEND)
- [x] an unreachable endpoint never pauses logins (verifies spec: CEND)
- [x] a session in progress is not moved to another endpoint, by failure retry, re-login or recheck, and nothing is probed during it (verifies spec: CEND)
- [x] a connection in a session stays on its endpoint even when the selector moves during it (verifies spec: CEND)
- [x] on a lower-priority endpoint the facility rechecks earlier ones and moves to the highest that passes (verifies spec: CEND)
- [x] a process without a central connection follows the endpoint in use and never probes (verifies spec: CEND)
- [x] the API process's short-lived central calls neither probe nor publish an endpoint when theirs fails (verifies spec: CEND)
- [x] with a single host nothing is probed (verifies spec: CEND)
- [x] a sync with a dead first endpoint lands on the second and returns to the first after the recheck (verifies spec: CEND)

## Reporting

- [x] a session start reports the endpoint, recorded on the session and the device (verifies spec: CEND)
- [x] a mobile device reports its central address on session start (verifies spec: CEND)
- [x] the reported endpoint is the one the request went to after a failover (verifies spec: CEND)
- [x] an unreadable reported endpoint is ignored rather than refusing the sync (verifies spec: CEND)
- [x] the admin sync page row shows the device's reported endpoint and when, and neither for a device that never reported (verifies spec: CEND)

## Manual

- [ ] Admin panel: edit the list in the settings JSON editor at global and facility scope; an invalid entry shows an error and nothing is saved
- [ ] Admin panel: the sync status page shows the Central endpoint and Endpoint reported columns and they sort
- [ ] Two real facility server processes (API and sync): kill the first endpoint, confirm the API process's timesync and websocket follow the sync process within the follow interval
- [ ] Rotation: add a new name to the list, confirm facilities report it, then remove the old name and confirm sync continues
