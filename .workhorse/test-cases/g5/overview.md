# Test cases: retry and reporting on the sync trigger hop

The reported failure was transient and environmental, so there is no regression case to cover.
These verify the retry and error reporting added to the api → sync process hop.

## Unit

- [x] A trigger that fails to reach the sync process on the first attempt succeeds on a retry.
- [x] Once retries are exhausted, the error names the address tried and the underlying reason,
      not the bare `fetch failed`.
- [x] A host resolving to several addresses reports the failure for every address tried.
- [x] A bodyless status request sends no `Content-Type` header.

## Manual

- [ ] With the sync process stopped, a manual sync from the patient listing shows a toast naming
      the configured sync address rather than "TypeError: fetch failed".
- [ ] Restarting the sync process while a manual sync is triggered still completes the sync —
      the retry rides over the tail of the restart rather than surfacing an error.
- [ ] A manual sync that runs longer than 10s still reports "Sync is taking a while, continuing in
      the background..." and completes; the retry adds no request timeout.
- [ ] The facility log records each retry attempt and the final unreachable error with its cause.
