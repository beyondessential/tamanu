# Refactor survey r1 — duplication and reuse

Branch: central endpoint selection (`specs/sync/central-endpoints.md`, CEND).
Scope: `git diff origin/main...HEAD`, product code and tests.
Lens: duplication, and code the branch wrote that rebuilds something the monorepo already has.

Overall: the product code is tight and the two biggest new classes (`CentralEndpointSelector`,
`SyncLoginBackoff`) have no equivalent in the tree. The reuse misses are concentrated in one
place — the IP-range maths in `packages/utils/src/centralEndpoint.ts` — and the duplication is
concentrated in the tests, where five to nine near-identical fakes have been written out longhand.

---

## 1. `isInternalIPv4`/`isInternalIPv6` rebuild `isTrustedSetupSource`, which already uses `ipaddr.js`

**Files**
- `packages/utils/src/centralEndpoint.ts:16-57` (`IPV4_PATTERN`, `isIPv4`, `isInternalIPv4`, `isInternalIPv6`)
- Existing: `packages/facility-server/app/routes/apiv1/setup.js:3,35-58` — `TRUSTED_SOURCE_RANGES` (module-private) and the exported `isTrustedSetupSource(ip)`

**The existing thing.** `setup.js` already decides "is this address in a private, loopback,
link-local or Tailscale range", over the *identical* set of ranges:

```js
ipv4: ['127.0.0.0/8','10.0.0.0/8','172.16.0.0/12','192.168.0.0/16','169.254.0.0/16','100.64.0.0/10'],
ipv6: ['::1/128','fc00::/7','fe80::/10','fd7a:115c:a1e0::/48'],
```

It does it with `ipaddr.process()` + `addr.match(ipaddr.parseCIDR(cidr))`. **`ipaddr.js ^2.4.0` is
already a direct dependency** of `packages/facility-server/package.json:65`. `ipaddr.process()`
also unwraps IPv4-mapped IPv6 natively, so the branch's two hand-written `::ffff:` regexes — the
dotted form *and* the hex-group form WHATWG URL produces — exist only because the parse was
hand-rolled.

**What replaces it.** Add `ipaddr.js` to `packages/utils/package.json` (currently
`@tamanu/constants`, date-fns, decimal.js, es-toolkit, nanoid, temporal-polyfill, zod). Put the
CIDR table and one `isInternalAddress(ip: string): boolean` in `packages/utils/src/` — either a
new `internalAddress.ts` or beside `isInternalHost`. Then:
- `centralEndpoint.ts` drops `IPV4_PATTERN`, `isIPv4`, `isInternalIPv4`, `isInternalIPv6` and calls
  `isInternalAddress(bare)` once (the `host.includes(':')` branch disappears too — `ipaddr.process`
  handles both families).
- `setup.js` deletes `TRUSTED_SOURCE_RANGES` and its `ipaddr` import; `isTrustedSetupSource` becomes
  a one-line wrapper over `isInternalAddress` (keep the export — `setup.js:83` and its tests use it).

The hostname-suffix list, the no-dot rule and the strict endpoint form stay where they are: those
are genuinely new and belong to the endpoint policy, not to address classification.

**Lines saved** ~40 removed (≈35 in `centralEndpoint.ts`, ≈14 in `setup.js`) against ≈18 added. Net **−35 to −40**.
**Risk** low. The ranges are identical and the existing `centralEndpoint` tests enumerate every one.
`ipaddr.process` is *stricter* on malformed input than the branch's regex (which accepts leading
zeros, e.g. `010.0.0.1`), so edge-case verdicts may change for inputs no test covers — a tightening,
not a loosening. `@tamanu/utils` exports per-file (`"./*": "./src/*"`), so web and mobile only pull
`ipaddr.js` if they import this module; neither does.
**Confidence** high.

---

## 2. Five hand-written in-memory `LocalSystemFact` fakes (nine in the package)

**Files (branch)**
- `packages/facility-server/__tests__/sync/CentralEndpointSelector.test.js:13-22` (`makeFacts`)
- `packages/facility-server/__tests__/sync/CentralServerConnection.test.js:323-330` (inline)
- `packages/facility-server/__tests__/sync/setupCentralEndpointSelector.test.js:11-18` (inside `makeContext`)
- `packages/facility-server/__tests__/services/initTimesync.test.js:5-13` (`makeModels`)
- `packages/facility-server/__tests__/services/websocketClientService.test.js:37` (inline one-liner)

Four more already exist on main: `serverConfig.test.js:29`, `FacilitySyncManager.test.js:123`,
`FacilitySyncManager-bootstrap.test.js:29`, `convergeSyncUser.test.js:33`.

**What replaces it.** One exported `makeFactStore(initial = {})` returning `{ store, LocalSystemFact }`
— exactly the shape `CentralEndpointSelector.test.js` already settled on. `packages/facility-server/__tests__/`
already holds non-test helper modules alongside tests (`setupUtilities.js`, `apiv1/surveyResponse/helpers.js`),
so `__tests__/fakes.js` or an export from `__tests__/utilities.js` fits the existing convention and
vitest will not collect it. Nothing comparable exists in `packages/shared/src/test-helpers/`
(`errors`, `permissions`, `rawFiles`, `sync`) or `@tamanu/fake-data` — those build *records*, not
a fact store.

**Lines saved** ≈30 across the five branch files; ≈60 if the four pre-existing copies are converted too.
**Risk** low. **Confidence** high.

---

## 3. A probe client over a fake network, written out twice, verbatim

**Files**
- `packages/facility-server/__tests__/sync/CentralServerConnection.test.js:320-348` (`makeSelector`)
- `packages/facility-server/__tests__/sync/centralEndpoints-integration.test.js:92-113` (`makeSelector`)

The `createProbeClient` body is the same ≈14 lines in both: `new TamanuApi({ endpoint: `${host}/api`,
agentName: SERVER_TYPES.FACILITY, agentVersion: '0.0.0', deviceId, logger: { debug(){}, info(){},
warn(){}, error(){}, log(){} } })` then `client.fetchImplementation = fakeFetch`. The silent-logger
literal alone is repeated character for character.

Three more pieces are duplicated between the same two files and a third:
- **JWT minting** — the `jose.SignJWT(...).setProtectedHeader({ alg: JWT_KEY_ALG, kid: JWT_KEY_ID })
  .setIssuer('test-issuer').setAudience(JWT_TOKEN_TYPES.ACCESS).setExpirationTime('1d')
  .sign(new TextEncoder().encode('test-secret'))` chain, ≈10 lines in `CentralServerConnection.test.js:87-99`
  and ≈8 in `centralEndpoints-integration.test.js:127-134`. (`central-server/__tests__/auth/jwt-validation.test.js`
  and `patientPortalApi/patientPortalAuth.test.js` have their own; they are a different package and
  test the signing itself, so leave them.)
- **Fake `Response` builder** — `fakeResponse`/`fakeSuccess` (pre-existing,
  `CentralServerConnection.test.js:30-47`) and `jsonResponse` (new,
  `centralEndpoints-integration.test.js:29-40`) are the same object with the same
  `headers.get`/`headers.has` shims and the same `x-tamanu-server` default.
- **The `hosts` map fake network** — `respond` (`CentralServerConnection.test.js:290-304`) and
  `fakeCentral` (`centralEndpoints-integration.test.js:46-84`) share the URL-splitting, the
  `calls.push`, the `'down' → throw new TypeError('fetch failed')` and the login / `user/me`
  branches; the integration one then adds the sync-protocol routes.

**What replaces it.** One `packages/facility-server/__tests__/sync/centralEndpointHelpers.js`
exporting `makeSyncToken()`, `jsonResponse()`, `makeProbeClientFactory(fetchImpl)` and a
`makeFakeNetwork({ hosts, calls, routes })` whose `routes` argument is the only part that differs
(the integration file passes the sync-protocol handlers, the unit file passes none). Keep both
suites and every case: this merges *scaffolding*, not coverage.

**Lines saved** ≈70–90.
**Risk** low–medium — the two fake networks must keep their distinct fidelity, so `routes` has to be
a real extension point rather than a flag. If it turns into a flag soup, stop at the probe-client
factory, `jsonResponse` and the token (≈45 lines, risk low).
**Confidence** medium-high.

---

## 4. The recorded-endpoints fact is parsed by hand in three places

**Files**
- `packages/facility-server/app/serverConfig.js:116-127` (`parseEndpointsFact`, logs a warning on malformed)
- `packages/facility-server/app/database/integrity.js:23-30` (`parseEndpoints`, silently returns `[]`)
- `packages/facility-server/app/sync/applyCentralEndpoints.js:66` writes it (`JSON.stringify(supplied)`)
- and again in the test: `packages/facility-server/__tests__/sync/applyCentralEndpoints.test.js:72-75` (`recorded()`)

Two readers, two different malformed-input behaviours, one writer, and no single place that says
what the fact holds.

**What replaces it.** `getRecordedCentralEndpoints(LocalSystemFact): Promise<string[]>` and
`setRecordedCentralEndpoints(LocalSystemFact, hosts)` next to the other endpoint code (e.g. in
`applyCentralEndpoints.js`, or a small `recordedEndpoints.js` beside it). `serverConfig.js` reads it
and keeps its `log.warn`; `integrity.js` calls it instead of its own parse; the test asserts through
the same reader. `LocalSystemFact` has no JSON accessor of its own
(`packages/database/src/models/LocalSystemFact.ts:42-62` is string in, string out), so this is new
shared code, not a reinvention — `FACT_FACILITY_IDS` is parsed by hand the same way at
`serverConfig.js:85`, and could use the same shape later.

**Lines saved** ≈12, and one behavioural inconsistency (warn vs silent) collapses into one decision.
**Risk** low. **Confidence** high.

---

## 5. Three ways to build a central URL from a host

**Files**
- `packages/facility-server/app/sync/CentralServerConnection.js:15-19` — `apiEndpointOf(host)`: `new URL(host)`, `pathname = '/api'`
- `packages/facility-server/app/sync/CentralEndpointSelector.js:296-300` — the same four lines inside `createDefaultProbeClient`
- `packages/facility-server/app/setupSyncRuntime.js:19-20` — `centralTimesyncUrl()`: `${host.replace(/\/*$/, '')}/api/timesync`
- `packages/facility-server/app/services/websocketClientService.js:25,33` — `new URL(host)` for the socket URI

The first two are literally the same expression; the third solves the same problem with string
surgery instead of `URL`, which is why it needs the `replace(/\/*$/,'')`.

**What replaces it.** Export `apiEndpointOf(host)` from `CentralEndpointSelector.js` (or a small
`centralUrls.js` — it is lower-level than either module) and use it in all three:
`createDefaultProbeClient` calls it, and `centralTimesyncUrl` becomes
`` `${apiEndpointOf(getCurrentCentralHost())}/timesync` `` — note `apiEndpointOf` returns a trailing
slash from `URL#toString()`, so the timesync form needs checking against its current output before
the swap.

**Lines saved** ≈8.
**Risk** low–medium: `centralTimesyncUrl` currently produces `https://h/api/timesync`; `new URL(h)`
with `pathname='/api'` stringifies as `https://h/api`, so the join must not double the slash.
`initTimesync.test.js` asserts the exact URL, which is the guard.
**Confidence** high on the first two, medium on folding timesync in.

---

## 6. `TamanuApi` is constructed twice with the same facility-server preamble

**Files**
- `packages/facility-server/app/sync/CentralServerConnection.js:34-58` (the `super({...})` call plus the `faithFetch` gate)
- `packages/facility-server/app/sync/CentralEndpointSelector.js:294-313` (`createDefaultProbeClient`)

Both set `logger: log`, `agentName: SERVER_TYPES.FACILITY`, `agentVersion: version`, a `deviceId`,
and both end with the identical gate:

```js
if (process.env.TAMANU_DISABLE_FAITH_FETCH !== 'true') client.fetchImplementation = faithFetch;
```

The env-var gate in particular should exist once — it is a deployment switch, and two copies can
drift.

**What replaces it.** A `facilityApiDefaults({ deviceId })` returning the four shared fields, and an
`applyFaithFetch(client)` holding the gate, both exported from `faithFetch.js` (which already owns
that concern). `CentralServerConnection` spreads the defaults into its `super()` call and calls
`applyFaithFetch(this)`; `createDefaultProbeClient` does the same and adds its
`defaultRequestConfig`.

**Lines saved** ≈8–10.
**Risk** low — the two option sets are not identical (the probe client adds
`defaultRequestConfig: { timeout, waitForAuth: true, backoff: false }`, the connection its own
`defaultRequestConfig`), so the helper must supply only the four common fields and not try to
unify the request config.
**Confidence** medium-high.

---

## 7. Dead exports in `centralEndpoint.ts`, next to a hand-rolled copy of one of them

**Files**
- `packages/utils/src/centralEndpoint.ts:123-137` — `isValidCentralEndpoint` and `dedupeCentralEndpoints`
- `packages/facility-server/app/sync/applyCentralEndpoints.js:16-40` — `readEffectiveCentralEndpoints`
- `packages/utils/__test__/centralEndpoint.test.ts:138-155` — tests for `dedupeCentralEndpoints`

`isValidCentralEndpoint` has **no caller anywhere** (grepped across `packages/`).
`dedupeCentralEndpoints` has no caller either — only its own test — while
`readEffectiveCentralEndpoints` does exactly its job inline (normalise, drop invalid, drop later
duplicates, keep order), differing only in that it `log.warn`s each rejected entry. So the one
function the branch wrote for this is the one it did not use.

**What replaces it.** Either:
- (a) give `dedupeCentralEndpoints` an optional `onInvalid?: (entry, reason) => void` and have
  `readEffectiveCentralEndpoints` call it with the `log.warn`, deleting its own loop; or
- (b) delete both unused exports and their tests, leaving the inline loop as the only
  implementation.

(a) is better — it keeps the normalisation rule in one package with the tests that enumerate it, and
leaves the facility code reading as merge-then-dedupe. Note `dedupeCentralEndpoints` currently uses a
`Set` and `readEffectiveCentralEndpoints` an array with `includes`: same result, and the `Set` is the
one to keep.

**Lines saved** ≈10 for (a); ≈30 for (b), but (b) loses the unit coverage of the dedupe rule, so prefer (a).
**Risk** low. **Confidence** high.

---

## 8. The probe/recheck defaults are written two or three times each

**Files**
- `packages/settings/src/schema/facility.ts:291-323` — `defaultValue: 300 / 5 / 120 / 3600`
- `packages/facility-server/app/sync/setupCentralEndpointSelector.js:12-15` — `DEFAULT_RECHECK_INTERVAL_SECONDS = 300`, `DEFAULT_PROBE_TIMEOUT_SECONDS = 5`, `DEFAULT_REFUSED_INITIAL_PAUSE_SECONDS = 120`, `DEFAULT_REFUSED_MAX_PAUSE_SECONDS = 3600`
- `packages/facility-server/app/sync/SyncLoginBackoff.js:11` — `DEFAULT_SETTINGS = { initialDelayMs: 120_000, maxDelayMs: 3_600_000 }`
- `packages/facility-server/app/sync/CentralEndpointSelector.js:243` — `intervalMs = 5 * 60_000` in `startRechecking`'s catch

300 seconds is written three times, in two different units (`300` and `5 * 60_000`). Settings readers
already resolve a leaf to its schema `defaultValue`, so the `?? DEFAULT_*` arms only fire on the
no-facility `context.settings.global` path — which cannot be reached while
`setupSyncRuntime`/`setupApiRuntime` run behind `isServerConfigured()` (it requires facility ids).

**What replaces it.** The clearly-right part: delete `CentralEndpointSelector.js:243`'s
`intervalMs = 5 * 60_000` and let `#getProbeSettings` own the fallback — the catch should re-throw
to the caller's `log.warn` or reuse the last known interval, not invent a third copy of the number.
The larger part (dropping the four `DEFAULT_*` constants in `setupCentralEndpointSelector.js`) is a
judgement call: it relies on the reader always being a facility reader. If they stay, keep
`SyncLoginBackoff`'s own `DEFAULT_SETTINGS` as the single source for the pause pair rather than
restating 120/3600 in `setupCentralEndpointSelector.js`.

**Lines saved** ≈4 for the safe part, ≈12 if the constants go.
**Risk** low for the safe part; medium for the rest (it changes what happens when a settings read
fails or a leaf is missing — `setupCentralEndpointSelector.test.js`'s `makeContext` returns
`get: async () => undefined`, so that test depends on the fallbacks and would need updating, which
is a signal the fallbacks are load-bearing for tests if not for production).
**Confidence** high on the `5 * 60_000`; medium on the constants.

---

## 9. Repeated assertions and near-identical cases in `CentralServerConnection.test.js`

**File** `packages/facility-server/__tests__/sync/CentralServerConnection.test.js`

- `rejects.toBeProblemOfType(ERROR_TYPE.AUTH_CREDENTIAL_INVALID)` appears 16 times and
  `rejects.toMatchObject({ type: ERROR_TYPE.RATE_LIMITED })` 8 times, each wrapped over three
  prettier-formatted lines. Two local helpers — `expectRefused(connection)` and
  `expectPaused(connection)` — collapse each to one line.
- The three cases under `after central refuses the credentials` — "pauses further logins…",
  "also pauses a connection to a single endpoint", "pauses a connection with no selector at all"
  (lines 487-532) — have an identical body (connect → expect refused → clear `calls` → connect →
  expect paused → `expect(calls).toEqual([])`) and differ only in the selector arrangement. An
  `it.each` table of `[name, arrange]` keeps all three names and all three assertions.
- The six version-compatibility cases at lines 189-224 (`too low` / `too high` × modern / legacy)
  are four bodies of the same four lines over different fixtures — also an `it.each` table. These
  are **pre-existing**, so only fold them in if the file is being touched anyway.

**Lines saved** ≈45 (≈25 assertions, ≈20 the refusal table); ≈25 more for the pre-existing version cases.
**Risk** low — no case disappears, each keeps its own name and its own assertions.
**Confidence** high.

---

## 10. `devicesById.get(...)` called twice per row

**File** `packages/central-server/app/admin/sync.js:95-98`

```js
endpoint: devicesById.get(session.parameters.deviceId)?.centralEndpoint ?? null,
endpointReportedAt: devicesById.get(session.parameters.deviceId)?.centralEndpointReportedAt ?? null,
```

One `const device = devicesById.get(session.parameters.deviceId)` above the object literal. Two
lookups per row, and the long expression is what hides that they are the same lookup.

**Lines saved** 0–1 (it is clarity, not length).
**Risk** none. **Confidence** high.

---

## 11. Three identical try/catch-and-warn blocks after a sync session — *recommend leaving*

**File** `packages/facility-server/app/sync/FacilitySyncManager.js:248-270`

`convergeSyncUser`, `pullSettingsPsk` and `applyCentralEndpoints` each sit in the same five-line
`try { … } catch (error) { log.warn('FacilitySyncManager.<name>Failed', { error: error.message }); }`.
A `[name, fn]` table and one loop saves ≈8 lines.

**Recommend against.** The log keys would become templated
(`` log.warn(`FacilitySyncManager.${name}Failed`) ``), and Tamanu's support pack greps log keys as
literals (`docs/runbooks/`, `docs/sops/read-logs.md`). Losing grep-ability of
`FacilitySyncManager.pullSettingsPskFailed` costs more at 2am than eight lines are worth. The
comment above the block already explains why they are ordered and why none may fail the sync.
**Confidence** high that this should stay as it is.

---

## Things that only look alike — leave them apart

- **`SyncLoginBackoff` vs `packages/utils/src/retryWithBackoff.ts` (`retryWithBackoff`) and
  `packages/api-client/src/fetchWithRetryBackoff.ts` (`fetchWithRetryBackoff`).** Both existing
  helpers *retry an operation* on a delay schedule; `SyncLoginBackoff` is a process-wide gate that
  *refuses* attempts for a window, carries state across unrelated callers (sync, walks, rechecks,
  list verification), keys that state to the credentials, and throws `RateLimitedError` rather than
  waiting. Nothing in the tree does that — the nearest relative is central's own account lockout in
  `packages/database/src/models/UserLoginAttempt.ts` (`checkIsUserLockedOut`), which is the server
  side of the same problem. The only textual overlap is the one-line schedule
  (`Math.min(max, initial * factor ** n)`), which is not worth sharing. **Keep separate.**
- **`isLoginRefusal` (`SyncLoginBackoff.js:15`) vs `isRecoverable`
  (`packages/errors/src/extractErrorFromFetchResponse.ts`) vs `isEndpointFailure`
  (`CentralServerConnection.js:23`).** Three predicates over `error.type`, three different
  questions: may this be retried at all; did central refuse these credentials; did this endpoint
  stop working. They overlap on `RATE_LIMITED` by coincidence of the error taxonomy, not of
  meaning, and they will change for different reasons. **Keep separate**, and do not try to build
  one classifier over them.
- **`validateCentralEndpoints.js`'s private `isHttpsRequiredOnCentral` vs
  `packages/shared/src/utils/requireHttps.js` (`isHttpsRequired`).** The shared one resolves the
  stored setting; the new one must see the value *in the save being made*, before it is stored.
  Different input, same output type. **Keep separate** — but it is worth one comment line saying so,
  since the names are near-identical and a reader will assume one is a copy of the other.
- **`parseCentralEndpoint` vs `urlSchema`
  (`packages/settings/src/schema/definitions/url.ts`) and `parseSyncUrl`
  (`packages/database/src/services/syncConnectionConfig.js`).** The existing two only check that a
  URL parses, and `parseSyncUrl` deliberately *keeps* credentials. Neither rejects a path, query,
  fragment or credentials, and neither applies a host-based http rule. **Not a duplicate.** (The
  `new URL(x).origin` idiom written inline in `serverConfig.js`'s `configHost`,
  `routes/apiv1/setup.js` and `upgrade/src/steps/…provisionSyncUser.ts` is the loosest shared
  ancestor; converting those is out of this branch's scope.)
- **Unit *and* integration coverage of endpoint failover.** `CentralServerConnection.test.js`
  drives failover through a fake network with no database;
  `centralEndpoints-integration.test.js` drives a whole sync session against a real test context,
  real `FacilitySyncManager`, real settings rows and real facts. The integration file's four cases
  each assert something the unit file structurally cannot (the fact actually written, the setting
  actually read, the session surviving a mid-session recheck). **Keep both** — merge their
  *scaffolding* per finding 3, not their cases.
- **`sync.host` vs `hosts[0]` in `serverConfig.js`.** `getSyncConfig().host` is now derived
  (`hosts[0] ?? null`) and survives for two readers: `subCommands/setupSync.js:48` and the
  `getCurrentCentralHost()` fallback at `CentralEndpointSelector.js:329`. Two accessors for one
  value is mild, and the comment at `serverConfig.js:133` says so. Not worth a change now, but it
  is the thing to delete when `setupSync.js` moves to `getCentralHosts()`.
- **The `orderBy` if/else chain in `packages/central-server/app/admin/sync.js:100-120.`** The branch
  adds two more branches to a chain that was already nine long; a `{ column: comparator }` table
  would be better, but it is pre-existing shape and converting it is a separate change from this
  branch's work.

---

## Ranked summary

| # | Candidate | Net lines | Risk | Confidence |
|---|---|---|---|---|
| 1 | IP ranges → shared `isInternalAddress` on `ipaddr.js` (reuse of `isTrustedSetupSource`) | −35…−40 | low | high |
| 3 | Shared fake-central test harness (probe client, token, `jsonResponse`, network) | −70…−90 | low–med | med-high |
| 2 | Shared `makeFactStore()` test fake | −30 (−60 incl. pre-existing) | low | high |
| 9 | `expectRefused`/`expectPaused` + `it.each` for the refusal cases | −45 | low | high |
| 4 | One reader/writer for the recorded-endpoints fact | −12 | low | high |
| 7 | Use `dedupeCentralEndpoints` in `readEffectiveCentralEndpoints` (or delete the dead exports) | −10 | low | high |
| 5 | One `apiEndpointOf` for the three central-URL builders | −8 | low–med | high / med |
| 6 | Shared facility `TamanuApi` defaults + the `faithFetch` env gate | −8…−10 | low | med-high |
| 8 | Drop the third copy of the 300s recheck default | −4 | low | high |
| 10 | Hoist the duplicate `devicesById.get` | ~0 | none | high |
| 11 | Table-drive the three post-session try/catch blocks | −8 | — | **recommend against** |

Total if 1–10 are taken: roughly **220–250 lines** removed, of which about **145–165 are test
scaffolding** and about **75–85 product code**. No case or assertion is dropped.
