# Blob access control — test cases

Scenarios that verify blob access control (spec: BLAC). Most are central-server
endpoint integration tests extending F2's `packages/central-server/__tests__/blobTransfer.test.js`
(supertest, real routes, seeded references); the pusher-behaviour cases are facility
channel unit tests; the end-user cases sit with the consumer route tests; the last
section is manual multi-server verification. The automated scoping cases run against
a scratch reference table standing in for the consumer hash columns that land with
J2/K2.

## Transfer channel authentication

- [x] Call each transfer operation (availability probe, fetch, offer, content PUT) with no authentication and confirm each is refused. verifies spec: BLAC#transfer-channel-authentication
- [x] Call each transfer operation as an authenticated user whose device lacks the sync-client scope and confirm each is refused. verifies spec: BLAC#transfer-channel-authentication
- [x] Call an availability probe with a sync-client device and confirm it passes the gate and answers. verifies spec: BLAC#transfer-channel-authentication

## Server-to-server fetch scoping

- [x] Fetch a hash referenced by a record within the requesting facility's sync scope, bytes held on central, and confirm the bytes stream. verifies spec: BLAC#server-to-server-fetch
- [x] Fetch a hash central holds that is referenced only by records outside the requesting facility's scope and confirm the response is identical (status and body) to fetching a hash central does not hold. verifies spec: BLAC#server-to-server-fetch
- [x] Probe availability for that same out-of-scope hash and confirm the response is identical to probing an unknown hash. verifies spec: BLAC#server-to-server-fetch
- [x] Fetch a hash referenced only by a record at a sensitive facility from a different facility's device and confirm it answers as absent; fetch from the sensitive facility's own device and confirm it serves. verifies spec: BLAC#server-to-server-fetch
- [x] Fetch a hash referenced by two records, one inside and one outside the requesting facility's scope, and confirm it is served (one in-scope reference suffices). verifies spec: BLAC#server-to-server-fetch
- [x] Fetch a hash whose bytes central holds but which no record references at all and confirm it answers as absent for any facility. verifies spec: BLAC#server-to-server-fetch
- [x] With facility restriction off (user entitled to every facility), a server that declares only its own facility does not get a blob referenced only at another facility — scope follows the declared facilities, not the entitlement. verifies spec: BLAC#server-to-server-fetch
- [x] A request declaring a facility the user cannot access is refused. verifies spec: BLAC#server-to-server-fetch
- [x] A multi-facility server declaring several facilities gets a blob referenced at any one of them, with each declared facility validated against entitlement. verifies spec: BLAC#server-to-server-fetch
- [x] A quarantined blob answers as absent on both availability and fetch, identically to content central does not hold, and the response does not disclose the quarantine. verifies spec: BLAC#server-to-server-fetch

## Server-to-server push gating

- [x] Offer a hash referenced by a synchronised record within the offering server's scope, bytes not yet held, and confirm the offer is wanted. verifies spec: BLAC#server-to-server-push
- [x] Offer a hash no record references and confirm it is refused. verifies spec: BLAC#server-to-server-push
- [x] Offer a hash referenced only by records outside the offering server's scope and confirm it is refused. verifies spec: BLAC#server-to-server-push
- [x] Offer a hash central already holds but which no in-scope record references, and confirm the refusal is indistinguishable from the unexpected-and-absent case (the offer endpoint is not an existence oracle). verifies spec: BLAC#server-to-server-push
- [x] PUT content for an unexpected hash without a prior offer and confirm it is refused with nothing staged (a later expected offer starts from zero received bytes). verifies spec: BLAC#server-to-server-push
- [x] PUT a resumed segment for a hash that is no longer expected and confirm it is refused rather than appended. verifies spec: BLAC#server-to-server-push
- [x] Run the sync-first round trip: offer a blob whose referencing record has not yet synchronised and confirm refusal; synchronise the record; re-offer and confirm the push completes and the blob is admitted. verifies spec: BLAC#server-to-server-push

## Origin pusher behaviour on refusal

- [x] A refused offer fails the push immediately, without the resume loop, so the pusher can move to the next blob. verifies spec: BLAC#server-to-server-push
- [x] A refusal mid-transfer (on a content delivery) fails the push without re-offering and leaves central without the content. verifies spec: BLAC#server-to-server-push

## End-user access

- [ ] Request an attachment as a user without permission on the referencing record and confirm it is forbidden; repeat with permission and confirm the content is served. verifies spec: BLAC#end-user-access
- [x] Request blob content by hash from an end-user session (web login, no sync-client device scope) and confirm it is refused: the store is reachable only through record routes. verifies spec: BLAC#end-user-access

## Manual multi-server verification

- [ ] On a two-facility deployment, upload an attachment for a patient held at both facilities at facility A, let it sync and push, and confirm facility B can open it; confirm a third facility that does not hold the patient gets the awaiting-content presentation, never the bytes.
- [ ] Confirm record synchronisation proceeds normally while blob pushes are being refused (e.g. reference not yet synced): records are never held back by blob gating.
