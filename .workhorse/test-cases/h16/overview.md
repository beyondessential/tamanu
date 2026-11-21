# Public lab result lookup: test cases

## Whitelists

- [x] With default settings, a lookup for a published request in the COVID category returns no requests (verifies spec: LPUB)
- [x] With the request's category and test type listed, a lookup returns the test date, patient initials and result value (verifies spec: LPUB)
- [x] With only the category listed, a lookup returns the test date and initials with no results (verifies spec: LPUB)
- [x] With the category and test type listed, a lookup for a request not yet published returns the test date and initials with no results (verifies spec: LPUB)
- [x] A deployment that set the whitelists in its local config keeps them after upgrading (config fallback and upgrade step lift them into settings)

## Lookup limit

- [x] Lookups that find nothing still count towards the limit, and the one past it is refused (verifies spec: LPUB)
- [x] On a running central server, the lookup is refused once the configured number of lookups per window is used, and the refusal carries the cross-origin header when an allowed origin is set (verifies spec: LPUB)
- [x] Changing the lookup limit settings takes effect after a restart
