# Refactor survey, round 1: altitude

Lens: code shaped by the order it was written in rather than by its problem. Judged against
`specs/sync/central-endpoints.md` and the "As built" decisions in `.workhorse/plans/k9/plan.md`,
which are taken as settled.

## Headline

The facility side (selector, connection, backoff, setup, apply, serverConfig) is ~790 lines
including comments, roughly 550 without. A from-scratch build of the same behaviour, knowing
everything up front and keeping the settled decisions, lands around 500. The gap is ~50 lines, and
it is spread over small reconciliations, not one wrong shape. The main thing the brief asked me to
look for, that "try endpoints until one works" is built four times, is not the case: there is one
loop (`CentralEndpointSelector.firstPassing`) with three callers and one consumer. Details below,
including what I considered and rejected, because several of the obvious "bigger" simplifications
would change behaviour or move lines rather than remove them.

Ranked by (lines saved × confidence) / risk.

---

## 1. Drop `#hostInUse`; it duplicates `TamanuApi#host`

**Files:** `packages/facility-server/app/sync/CentralServerConnection.js`

`#hostInUse` is set alongside `setEndpoint(apiEndpointOf(host))` and read in four places. `TamanuApi`
already exposes `get host()` as `new URL(endpoint).origin`, and every host that can reach the
selector is already an origin string: list entries are `${protocol}//${url.host}` from
`parseCentralEndpoint`, the wizard records `new URL(host).origin`, `parseSyncUrl` returns
`parsed.origin`, and `configHost()` returns `.origin`. So `this.host === this.#hostInUse` always,
and the comparison in `#followSelectedEndpoint` (`host === this.#hostInUse`) is the same test with
`this.host`.

Replace:

```js
#hostInUse;                                   // field
this.#hostInUse = host;                        // ctor
log.info(..., { from: this.#hostInUse, to: host });
this.setEndpoint(apiEndpointOf(host));
this.#hostInUse = host;
skip: refused ? [this.#hostInUse] : [],
get endpoint() { return connection.#hostInUse; },
```

with `this.host` throughout. The `get endpoint()` getter keeps its purpose (read at serialisation)
as `return connection.host`.

- **Lines saved:** ~8
- **Risk:** low. The only way it breaks is a host source that is not an origin; I checked all four.
  Tests already assert on `connection.host`, so the existing connection tests cover it.
- **Confidence:** 0.85

## 2. Settings plumbing in `setupCentralEndpointSelector`: read the `sync` subtree once, drop the duplicate defaults

**Files:** `packages/facility-server/app/sync/setupCentralEndpointSelector.js`

The four settings are read by four separate `reader.get('sync.x')` calls, each with a
`?? DEFAULT_X` fallback, and the four defaults (300, 5, 120, 3600) are copies of the schema
`defaultValue`s in `packages/settings/src/schema/facility.ts`. `ReadSettings.get` already returns
values merged over schema defaults, so the fallbacks never fire on the facility reader. They fire
only on the `context.settings.global` branch, which is reached when `getServerFacilityIds()` is
empty; every production caller runs after `isServerConfigured()`, which requires facility ids, so
that branch is a test accommodation (`setupCentralEndpointSelector.test.js` passes
`settings: { global: { get: async () => undefined } }`).

Replace the four constants, `readSetting`, `readProbeSettings` and the backoff `getSettings` with:

```js
const [facilityId] = getServerFacilityIds();
const readSyncSettings = () => context.settings[facilityId].get('sync');

const readProbeSettings = async () => {
  const sync = await readSyncSettings();
  return {
    recheckIntervalMs: sync.centralEndpointRecheckIntervalInSeconds * 1000,
    probeTimeoutMs: sync.centralEndpointProbeTimeoutInSeconds * 1000,
  };
};

setSyncLoginBackoff(
  new SyncLoginBackoff({
    getSettings: async () => {
      const sync = await readSyncSettings();
      return {
        initialDelayMs: sync.syncLoginRefusedInitialPauseInSeconds * 1000,
        maxDelayMs: sync.syncLoginRefusedMaxPauseInSeconds * 1000,
      };
    },
  }),
);
```

`SyncLoginBackoff.DEFAULT_SETTINGS` stays: it serves the default singleton used by connections
opened before any selector exists (the boot integrity check), which is a real case.

- **Lines saved:** ~15 (four constants and the fallback arithmetic)
- **Risk:** low. Behaviour is identical wherever a facility reader exists. The setup test needs its
  context to carry `settings[facilityId]` with values instead of relying on the fallbacks. If the
  `subCommands/sync.js` path can run with a host but no facility ids, keep the
  `facilityId ? ... : context.settings.global` selection (two lines) and still drop the constants.
- **Confidence:** 0.75

## 3. `probe()` returns the error, not a bespoke result object

**Files:** `packages/facility-server/app/sync/CentralEndpointSelector.js`

`probe` returns `{ ok, reason, credentialsRefused, lockedOut }`; `firstPassing` reads `ok`,
`credentialsRefused` and `lockedOut`, and `reason` is consumed only by `probe`'s own log line and by
one unit test. The classification (`isLoginRefusal`, `RATE_LIMITED`) already exists as functions the
caller can apply. Return `null` on success and the error on failure:

```js
async probe(host) {
  ...
  try { await client.login(...); log.info(...); return null; }
  catch (error) { log.warn(... reason: error.detail ?? error.message ...); return error; }
}

// firstPassing
const error = await this.probe(host);
if (!error) { backoff.recordSuccess(); return host; }
credentialsRefused ||= isLoginRefusal(error);
if (error.type === ERROR_TYPE.RATE_LIMITED) break;
```

- **Lines saved:** ~8, plus the `@returns` type
- **Risk:** low. Logging is unchanged. The `probe` unit test asserts the result shape and changes
  to assert on the returned error.
- **Confidence:** 0.8

## 4. `readEffectiveCentralEndpoints` reimplements `dedupeCentralEndpoints`

**Files:** `packages/facility-server/app/sync/applyCentralEndpoints.js`,
`packages/utils/src/centralEndpoint.ts`

`dedupeCentralEndpoints` (utils, 8 lines) normalises, drops invalid entries and dedupes in order.
It has no product caller; `readEffectiveCentralEndpoints` carries the same loop by hand (12 lines)
with one difference, a `log.warn('applyCentralEndpoints: ignoring invalid endpoint', ...)` per
dropped entry. With the helper the function becomes:

```js
const endpoints = dedupeCentralEndpoints([...facilityLists.flat(), ...globalList]);
```

The trade is the warn line. An invalid entry can only arrive by bypassing central's save
validation (`validateCentralEndpointsSave` rejects the same `normaliseCentralEndpoint` failures), so
the warn is for a hand-edited settings row. If the logging contract has to hold, give
`dedupeCentralEndpoints` an optional `onInvalid` callback and the saving falls to ~6 lines. The
test `drops invalid entries rather than failing the list` does not assert on the log.

`isValidCentralEndpoint` has no caller outside its test either; that is the dead-code lens, noted
for the other surveyor.

- **Lines saved:** ~10 without the warn, ~6 with it
- **Risk:** low; medium only if the warn is considered part of the logging contract
- **Confidence:** 0.6

## 5. Small reconciliations

**`follow()` mutates `#hosts`** (`CentralEndpointSelector.js:261`). A follower prepends the
published host to its list when absent. Nothing reads a follower's `hosts`: `hasAlternatives` and
`canFailOver` are short-circuited by `canProbe`, and `applyCentralEndpoints` runs only where a
`FacilitySyncManager` exists. The line keeps a list consistent for nobody. Drop it. 1 line,
confidence 0.8, risk low (the `follow` tests check `current()` and publish calls, not `hosts`).

**`integrity.js` `parseEndpoints` duplicates `serverConfig.js` `parseEndpointsFact`.** Both parse
`FACT_CENTRAL_ENDPOINTS` from JSON with an array check. Export one (without the warn, or with) and
use it in both. Note that `ensureHostMatches` must keep reading the fact directly rather than
`getCentralHosts()`: with `SYNC_URL` set, `hosts` is `[env.host]` and `includes(configuredHost)`
would be true, which would skip both the mismatch check and the first-boot seed write. ~6 lines,
confidence 0.7, risk low.

**`normaliseCentralEndpoint` parses twice.** `parseCentralEndpoint` builds the canonical string
from a `URL`, then `normaliseCentralEndpoint` does `new URL(parsed.endpoint)` to get `protocol`
and `hostname` back. Returning `hostname`/`protocol` alongside `endpoint` from the parse (or
inlining the http check into the parse behind a flag) saves the re-parse. ~3 lines, confidence
0.6, risk low.

**`adopt` and the list fact.** The selector publishes `FACT_CENTRAL_ENDPOINT_IN_USE` itself, but
`applyCentralEndpoints` writes `FACT_CENTRAL_ENDPOINTS` and then calls `selector.adopt`. Moving the
list write into `adopt` makes the selector the owner of both facts. Net lines ~0; cohesion only.
Optional.

---

## Already about as small as it should be

These are the places the brief pointed at. I looked for the one-thing version in each and either
found it already built or found that the smaller-looking alternative changes behaviour.

### "Four mechanisms" is one loop with three callers and one consumer

- `firstPassing(hosts, { skip, shouldStop })` is the only login loop. It owns the backoff gate
  (`isOpen`), the round-counts-once rule (`recordRefusal` after the loop), the lockout early exit
  and the per-host log lines.
- `walk` = `firstPassing(all hosts)` then `#use`. `recheckEarlier` = `firstPassing(earlier hosts,
  shouldStop: busy)` then `#use`. `applyCentralEndpoints` = `firstPassing(supplied)` then `adopt`.
  Each wrapper is 8–12 lines and differs only in which slice it passes and what it does with the
  winner.
- `CentralServerConnection` does not walk; it fails fast on its own endpoint (3 attempts), asks
  the selector to walk, follows the result, and retries once. That is the consumer, not a fourth
  loop.
- `SyncLoginBackoff` is a gate and counter the loop consults, not a retry loop of its own.

The one redundancy that remains is at runtime, not in code: on a failover the chosen endpoint gets
a throwaway probe login and then the live connection's login. Making the live client do the walk
would remove the second login but would need a second strategy for rechecks and list verification,
which the plan settles must not disturb the live auth state. That is a net gain in code, so I do
not propose it.

### `connect()`'s three-way shape is load-bearing

It looks like it could be one path ending in `#loginRecordingRefusals`. It cannot: in the failover
branch the first login's refusal must not be recorded before the walk, because `firstPassing`
refuses to start while paused and the spec requires the other endpoints to be tried (one may be a
different Tamanu). The `RATE_LIMITED` special case before the walk is likewise required (a lockout
must not start a walk, since every probe counts against the account). Folding either in changes
behaviour.

### Roles, fact publishing and follower polling

The follower needs `current()` and a `change` event; the owner needs everything. A separate
~30-line follower class would let the main selector lose `#canProbe`, three guards and `follow()`
(~22 lines): net about zero. Polling the fact is forced by `new CentralServerConnection({ deviceId })`
being a synchronous constructor called per request in the API process, so the endpoint has to be
available without an await; the 15-second cache is the smallest thing that satisfies that. The
`endpointRole` parameter threaded through `setupSyncRuntime` is one argument, not a layer.

### Changing `TamanuApi` to take `endpoint: () => string`

Considered: a resolver called at the top of `TamanuApi.fetch` would absorb `#followSelectedEndpoint`
and its three call sites (~20 lines), at the cost of ~10 lines in the shared client plus an
override of `setEndpoint` in the connection to clear `#loginData` and log. Net ~-10, and it adds a
mode to a client shared by web, mobile and the patient portal for one consumer. The lazy follow in
the connection is the right place. Not proposed.

### Recheck timer as a `ScheduledTask`

`startRechecking` (30 lines) re-reads the interval each tick so the setting applies live. A
`ScheduledTask` would be a similar size and would move the interval from
`sync.centralEndpointRecheckIntervalInSeconds` into the schedules subtree, which is a settings
change. Not proposed.

### `serverConfig.js` holding `hosts`, `sync.host = hosts[0]` and `canUseCentralEndpoints`

Three copies of the list exist (boot snapshot in `serverConfig`, live in the selector, durable in
the fact), but each has a reader with a different lifetime: `serverConfig` is what the boot-time
integrity check and the no-selector fallback use, the selector is what connections use, the fact is
what survives a restart. Having the selector read the fact itself would remove ~25 lines from
`serverConfig` and add ~10 to setup, but it moves the env > fact > config precedence out of the
one module that owns it. Not proposed. The `fromConfig` special case for a list-recorded host is
two lines and correct.

### `validateCentralEndpoints.js`

The leaf re-validation exists because `PUT /settings` does not validate the body against the
scoped schema at all; a general check would replace these 14 lines, but would start rejecting
other saves that are accepted today. Out of scope for this branch. The HTTPS-in-effect check is
already minimal.

### Central reporting, `Device`, admin `sync.js`, `SyncView.jsx`, migrations

Each is a few lines doing one thing. Nothing to take out.

---

## Summary table

| # | Candidate | Files | Lines | Risk | Confidence |
| --- | --- | --- | --- | --- | --- |
| 1 | `#hostInUse` → `this.host` | CentralServerConnection.js | ~8 | low | 0.85 |
| 2 | One `sync` read, drop duplicate defaults | setupCentralEndpointSelector.js | ~15 | low | 0.75 |
| 3 | `probe()` returns error or null | CentralEndpointSelector.js | ~8 | low | 0.8 |
| 4 | Use `dedupeCentralEndpoints` | applyCentralEndpoints.js | ~6–10 | low/med | 0.6 |
| 5 | Small reconciliations (follow hosts, parseEndpoints, double parse) | selector, integrity.js, serverConfig.js, centralEndpoint.ts | ~10 | low | 0.7 |

Total realistic saving: ~45–50 lines of product code, all low risk, all testable with the existing
suites plus small fixture changes in `setupCentralEndpointSelector.test.js` and the `probe` unit
test. No candidate changes product behaviour, API responses, data or (with the `onInvalid` option
on #4) logging.
