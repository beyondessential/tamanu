# Manual sync fails on facility 2 with "TypeError: fetch failed"

## Conclusion: no Tamanu code defect

The configs were correct and the error stopped on its own without any change, so the sync process
was transiently unreachable — a restart by the runtime, an upgrade, or the network. Nothing in
Tamanu's code caused it, and there is no bug to fix.

## Where the error came from

Worth recording, because the message points at the wrong hop. It is not facility → central:

- Web posts `sync/run` to the facility **api** process (`routes/apiv1/sync.js`).
- That calls `FacilitySyncConnection.runSync`, which fetches
  `config.sync.syncApiConnection.host:port` — the separate facility **sync** process.
- `fetch` rejects with `TypeError: fetch failed` when nothing answers there. The api error
  handler puts `error.name` / `error.message` in the response and the web client renders them as
  `"<name>: <message>"`, giving the exact reported string.

The window is real and expected: the sync process only starts listening after
`prepareDatabaseForStartup`, `initReportingStores`, `initDeviceId`, `checkConfig`,
`performDatabaseIntegrityChecks` and `setupSyncRuntime`, while the api process is already up and
serving the web app. A manual sync during that stretch fails exactly this way.

## Hardening (not a fix)

`FacilitySyncConnection` was the only bare `fetch` left in the sync path — everything on the
facility → central path already goes through `fetchOrThrowIfUnavailable` and
`fetchWithRetryBackoff`. So it had no retry, and it surfaced a message that told an operator
nothing. Both are now addressed, reusing the shared helper rather than a second retry loop:

- `fetchOrThrowIfUnavailable` now keeps the cause when it wraps a transport failure. It was
  building `RemoteUnreachableError` from `e.message` alone, which for `fetch` is always the bare
  `fetch failed` — so the refused connection or DNS failure underneath was discarded before any
  caller could report it. That loss is why the retry couldn't simply be the shared helper.
- `FacilitySyncConnection` uses `fetchWithRetryBackoff` (4 attempts, backing off over 1.2s),
  which rides over the tail of a restart or a dropped idle socket. Bounded well inside the 10s
  the api route races a trigger against, so a real failure still reports as one rather than
  being masked as "sync is taking a while". Safe to retry because
  `FacilitySyncManager.triggerSync` folds a concurrent request into the running sync.
- On giving up it names the address tried and the underlying cause
  (`connect ECONNREFUSED 127.0.0.1:4100`), flattening the AggregateError a multi-address hostname
  like `localhost` produces.
- No request timeout: `POST /sync/run` stays open for the whole sync, which legitimately runs for
  minutes. A hanging connect is already bounded by undici's connect timeout.
- Dropped the `Content-Type: undefined` header bodyless GETs were sending.

This does not stop the failure — the sync process being down means the manual sync cannot run.
It means the next occurrence is diagnosable from the message alone.
