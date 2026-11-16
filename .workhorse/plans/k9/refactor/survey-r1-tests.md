# Test survey, round 1 — central endpoints (K9)

2480 lines of test against 1342 of product. I read every file listed, plus the product code
(`CentralEndpointSelector.js`, `CentralServerConnection.js`, `applyCentralEndpoints.js`,
`SyncLoginBackoff.js`, `setupCentralEndpointSelector.js`, `centralEndpoint.ts`, `sync.js`,
`integrity.js`), and checked `packages/shared/src/test-helpers`, each package's
`__tests__/utilities.js`, and `@tamanu/fake-data` for anything reusable.

## Headline

**There is no large pool of fat here.** The ratio is explained by the feature, not by waste: the
behaviour is a state machine over a network with four failure modes (unreachable, refused, locked
out, central's own error) crossed with three process roles (owner, follower, standalone) and a
session-in-progress flag. Most tests are 6–14 lines and assert one thing.

Realistic saving with coverage intact: **~180–210 lines, about 8%**. The single biggest item
(~85) is one shared fixture module; the rest is a dozen small, certain wins. I found **no case
where a whole test file should go**, and **one genuinely vacuous assertion**.

What is *not* a finding, despite the brief: the IP-range and URL cases in
`centralEndpoint.test.ts` are **already** `it.each` tables, as are the settings-schema accept/reject
cases and `isLoginRefusal`. That ground is covered.

---

## Ranked candidates

### 1. One shared central-endpoint fixture module

**Files:** `packages/facility-server/__tests__/sync/CentralServerConnection.test.js`,
`centralEndpoints-integration.test.js`, `CentralEndpointSelector.test.js`,
`setupCentralEndpointSelector.test.js`, `../services/websocketClientService.test.js`,
`../services/initTimesync.test.js`

Nothing in `packages/shared/src/test-helpers`, `packages/facility-server/__tests__/utilities.js`
or `@tamanu/fake-data` fits any of this, so a new file is warranted — new at
`packages/facility-server/__tests__/sync/centralEndpointFixtures.js`.

Four things are built from scratch in two to five places each:

**(a) A probing selector over a fake fetch — the real win.**
`CentralServerConnection.test.js:322-350` (29 lines), `centralEndpoints-integration.test.js:~88-110`
(24), `websocketClientService.test.js:35-42` (8) all construct a `CentralEndpointSelector` whose
`createProbeClient` is a `TamanuApi` pointed at the test's fake fetch. They differ only in device
id and `canProbe`.

```js
export const makeProbingSelector = ({
  models = makeFactModels().models,
  hosts = [A, B],
  inUse,
  canProbe,
  deviceId = 'test',
  fetch,
} = {}) => {
  const selector = new CentralEndpointSelector({
    models, hosts, inUse, canProbe,
    getDeviceId: () => deviceId,
    getProbeSettings: async () => ({ recheckIntervalMs: 60_000, probeTimeoutMs: 100 }),
    createProbeClient: ({ host }) => {
      const client = new TamanuApi({
        endpoint: `${host}/api`, agentName: SERVER_TYPES.FACILITY,
        agentVersion: '0.0.0', deviceId,
        logger: { debug() {}, info() {}, warn() {}, error() {}, log() {} },
      });
      client.fetchImplementation = fetch;
      return client;
    },
  });
  setCentralEndpointSelector(selector);
  return selector;
};
```
~22 lines replacing 61. **Net −39.**

**(b) An in-memory `LocalSystemFact`.** Written out five times:
`CentralEndpointSelector.test.js:13-22` (`makeFacts`), `CentralServerConnection.test.js:324-329`
(inline in `makeSelector`), `setupCentralEndpointSelector.test.js:14-19`,
`initTimesync.test.js:4-13`, `websocketClientService.test.js:37`.

```js
export const makeFactModels = (initial = {}) => {
  const store = new Map(Object.entries(initial));
  return {
    store,
    models: { LocalSystemFact: {
      get: async key => store.get(key) ?? null,
      set: async (key, value) => void store.set(key, value),
    } },
  };
};
```
~10 lines replacing ~32. **Net −22.** (Leave `serverConfig.test.js`'s `makeModels` alone — it also
carries `LocalSystemSecret` and a `secretError` path, and it predates the branch.)

**(c) The response builders.** `fakeResponse/fakeSuccess/fakeFailure/fakeProblem` already existed in
`CentralServerConnection.test.js:30-51`; `centralEndpoints-integration.test.js:28-40` re-invented
them as `jsonResponse`. Move the originals to the fixture module and import in both. **Net −13.**

**(d) The sync JWT.** `CentralServerConnection.test.js:83-96` and
`centralEndpoints-integration.test.js:120-128` both sign a jose token with the same key, issuer and
audience. One `makeSyncToken({ userId, deviceId })` (~12 lines). **Net −11.**

**Not worth sharing:** the fake networks themselves (`respond` at
`CentralServerConnection.test.js:303-315` vs `fakeCentral` at
`centralEndpoints-integration.test.js:46-84`). One is a four-route stub, the other implements the
sync handshake; a shared transport plus a `routes` map comes out roughly line-neutral and makes
both harder to read. Leave them local.

**Lines saved:** ~85 net. **Risk of losing coverage:** low — pure extraction, no assertion touched.
**Confidence:** high on (a), (b) and (d); medium on (c) (it means a pre-existing file importing
from a new fixture module, which some reviewers dislike).

---

### 2. Merge the four refused-login tests into two

**File:** `CentralServerConnection.test.js:435-445`, `458-470`, `471-483`, `484-495`

Two pairs share identical arrange-and-act and differ only in which assertions they make:

- `458 fails with the original error when every endpoint refuses` and
  `471 does not ask the endpoint that refused again, however the walk ends` — both are
  `hosts = { [A]: 'refuses', [B]: 'refuses' }; await connection.connect()`. One asserts the error
  type and that the selector stayed; the other asserts `loginsAt(A) === 1, loginsAt(B) === 1`.
- `435 walks to the next endpoint when the first refuses the login` and
  `484 does not ask the endpoint that refused again when the walk finds another` — both are
  `hosts[A] = 'refuses'; await connection.connect()`. One asserts the selector moved to B and the
  connection has a token; the other asserts the login counts.

Fold each pair into one test carrying **all four assertions**. Nothing is dropped; the merged test
reads better because the login counts and the outcome are the same story.

**Lines saved:** ~24. **Risk:** low (no assertion removed). **Confidence:** high.

---

### 3. Table the three "pauses further logins" cases

**File:** `CentralServerConnection.test.js:501-541`

`pauses further logins…`, `also pauses a connection to a single endpoint` and
`pauses a connection with no selector at all` are byte-for-byte the same body under three selector
shapes.

```js
it.each([
  ['with a list of endpoints', () => makeSelector()],
  ['with a single endpoint', () => makeSelector({ list: [A] })],
  // no list to name hosts in, so whatever host the config gives refuses
  ['with no selector at all', () => { hosts = new Proxy({}, { get: () => 'refuses' }); }],
])('pauses further logins %s, failing at once without contacting central', async (_, setUp) => {
  setUp();
  await expect(makeConnection().connect()).rejects.toBeProblemOfType(
    ERROR_TYPE.AUTH_CREDENTIAL_INVALID,
  );
  calls.length = 0;

  await expect(makeConnection().connect()).rejects.toMatchObject({ type: ERROR_TYPE.RATE_LIMITED });
  expect(calls).toEqual([]);
});
```

Three readable rows, not twenty opaque tuples. Leave
`542 lets calls that need a login fail during the pause` out of the table — it varies a different
axis (`fetch` instead of `connect`), and forcing both axes into one table would hurt.

**Lines saved:** ~26. **Risk:** low. **Confidence:** high.

---

### 4. A local `initWithFacts` in the serverConfig central-hosts block

**File:** `packages/facility-server/__tests__/serverConfig.test.js:159-224`

Four of the five new tests repeat the same seven-to-ten-line
`initWith(makeModels({ facts: { ...baseFacts, … }, secrets: { [FACT_SYNC_PASSWORD]: 'pw' } }))`.

```js
const initWithFacts = extraFacts =>
  initWith(makeModels({
    facts: { ...baseFacts, ...extraFacts },
    secrets: { [FACT_SYNC_PASSWORD]: 'pw' },
  }));
```
Each call site drops to one line: `await initWithFacts({ [FACT_CENTRAL_ENDPOINTS]: '{not json' });`.
The SYNC_URL case (which deliberately has no secret) stays inline.

**Lines saved:** ~18. **Risk:** low. **Confidence:** high.

---

### 5. Trim the backoff schedule re-asserted through the connection

**File:** `CentralServerConnection.test.js:555-578` and `579-599`

- `tries again once the pause has passed, and pauses for longer if refused again` — the second
  half (the 120s → 600s growth, lines 568-578) is exactly
  `SyncLoginBackoff.test.js:'multiplies the pause by five for each refusal in a row, up to the maximum'`,
  which asserts the whole six-step sequence `[120, 600, 3000, 3600, 3600, 3600]` directly. The
  connection-level claim worth keeping is the first half: the pause expires and the next
  `connect()` really reaches central.
- `ends the pause and the schedule when a login succeeds` — the trailing "the schedule starts over"
  block (lines 591-598) is
  `SyncLoginBackoff.test.js:'ends the pause and starts the schedule over after a successful login'`.
  Keep the first half: a successful login through the connection ends the pause.

Also rename both, since the "and …" in each title is the half being removed (house rule: a name
containing "and" is doing two things).

**Which level keeps it:** the unit (`SyncLoginBackoff.test.js`) — the schedule is arithmetic on a
clock, and testing it through two `CentralServerConnection`s and a fake network only makes it
slower and more fragile. The connection's own obligation — that it calls `recordRefusal` and
`recordSuccess` at the right moments — is proven by the first half of each test and by
`501 pauses further logins` and `600 pauses after a lockout as well`.

**Lines saved:** ~18. **Risk:** medium — this is the one proposal that deletes assertions rather
than merging them. **Confidence:** medium. If a reviewer objects, drop this one; it is the least
valuable per line of the set.

---

### 6. Table the merge-order cases in applyCentralEndpoints

**File:** `packages/facility-server/__tests__/sync/applyCentralEndpoints.test.js:98-137, 171-178`

Four tests differ only in which scope holds which list and what comes out: `drops an endpoint
already present at an earlier position`, `uses each hosted facility's entries in turn`,
`ignores another facility's entries`, `drops invalid entries rather than failing the list`.

```js
it.each([
  { name: 'drops an endpoint already present earlier, however it is spelled',
    facility: { [FACILITY_A]: [A, 'https://B.example.com/'] }, global: [B, A, C],
    expected: [A, B, C] },
  { name: 'uses each hosted facility’s entries in turn, then the global ones',
    facility: { [FACILITY_A]: [A], [FACILITY_B]: [B] }, facilityIds: [FACILITY_A, FACILITY_B],
    global: [C], expected: [A, B, C] },
  { name: 'ignores another facility’s entries',
    facility: { [OTHER_FACILITY]: [B] }, global: [A], expected: [A] },
  { name: 'drops invalid entries rather than failing the list',
    global: ['not a url', 'http://public.example.com', A], expected: [A] },
])('$name', async ({ facility = {}, global = [], facilityIds, expected }) => {
  for (const [id, list] of Object.entries(facility))
    await setEndpoints(list, SETTINGS_SCOPES.FACILITY, id);
  await setEndpoints(global, SETTINGS_SCOPES.GLOBAL);
  const selector = makeSelector({ working: new Set(expected) });

  await apply(selector, facilityIds);

  expect(await recorded()).toEqual(expected);
});
```

Leave the other nine tests alone — they assert different outcomes (`applied/reason`, `probed`,
`hosts`, `inUse`), not merge order.

**Lines saved:** ~15. **Risk:** low. **Confidence:** medium — this is the one table whose value is
marginal. Named-object rows keep it readable, but 15 lines is a thin return for losing locality.
Take it or leave it.

---

### 7. Fold the follower-mode connection tests

**File:** `CentralServerConnection.test.js:753-790`

`still uses the endpoint the sync process chose` (782-789) is
`follows the selector when it moves between calls` (408-421) with `canProbe: false`. Either make
the earlier test an `it.each` over `[{}, { canProbe: false }]`, or merge the `adopt`-then-`fetch`
assertion into `768 does not walk when its login is refused`.

The other two follower tests (754, 768) stay: they prove the *connection* doesn't bypass the
selector, which `CentralEndpointSelector.test.js:'in a process that only follows'` cannot show.

**Lines saved:** ~8. **Risk:** low. **Confidence:** medium.

---

### 8. Small trims in setupCentralEndpointSelector

**File:** `packages/facility-server/__tests__/sync/setupCentralEndpointSelector.test.js`

- `starts the recheck timer for an owner only` (57-67): its owner half repeats
  `expect(first.closeHooks).toHaveLength(1)` from the first test (43). Keep only the standalone
  half. **−4**
- The follower test's `expect(context.closeHooks).toHaveLength(1)` (78) is a weaker proxy for the
  claim the next line already proves (`selector.current()` picked up the published host). **−1**

**Lines saved:** ~5. **Risk:** low. **Confidence:** medium.

---

## Defects found while surveying (no lines saved, worth fixing in the loop)

1. **A vacuous assertion.** `setupCentralEndpointSelector.test.js:52`:
   `expect(later.canFailOver()).toBe(owner.canFailOver())` — the line above asserts
   `expect(later).toBe(owner)`, so this compares a value with itself and cannot fail. The claim the
   test name makes ("does not let a later follower take over an owner") is that the owner is still
   able to probe: `expect(owner.canFailOver()).toBe(true)`.

2. **A floating promise in a synchronous test.** `websocketClientService.test.js:52`:
   `selector.adopt([A, B], B)` is not awaited and the test function is not `async`. It passes only
   because `CentralEndpointSelector.#use` happens to assign `#current` before its first `await`;
   reordering two lines in the product would make the test fail for the wrong reason, and the
   rejected promise would escape. Make the test `async` and `await` it.

3. **A name that promises more than the body checks.**
   `packages/central-server/__tests__/admin/syncLastCompleted.test.js`:
   `it.each(['endpoint', 'endpointReportedAt'])('can sort by %s')` only asserts `toHaveSucceeded()`.
   It proves the zod `orderBy` enum accepts the new columns, which is worth having — rename it to
   say so (`accepts %s as an order column`), or assert the resulting order.

4. **A brittle internal count.** `CentralServerConnection.test.js:656-668` asserts
   `attemptsAtA === 3`, hard-coding `FAILOVER_BACKOFF.maxAttempts` from
   `CentralServerConnection.js`. Export the constant and assert against it: same strength, and it
   stops being a false failure when the constant is tuned. (Loosening it to `toBeLessThan(15)`
   would weaken the test — don't.)

---

## Files that are already the right size

Say this plainly, because it is most of the branch:

- **`packages/utils/__test__/centralEndpoint.test.ts` (171).** Already fully tabled: 13 internal
  names, 17 internal IPs, 16 public hosts, 11 malformed URLs, one case per line. Nothing to do.
- **`packages/facility-server/__tests__/sync/SyncLoginBackoff.test.js` (153).** Eleven tests, no
  duplicated scaffolding, one shared `pausedFor()` reader, `isLoginRefusal` tabled. Tight.
- **`packages/settings/__tests__/schema.test.js` (+46).** Accept/reject lists already `it.each`,
  one `getLeaf` helper. Nothing to do.
- **`packages/central-server/__tests__/sync/centralEndpointReporting.test.js` (136).** Six
  endpoint-to-endpoint cases over one `startSync` helper and the standard `createTestContext` /
  `fake()` / `toHaveSucceeded` idiom; ~60 of the lines are the one-off `beforeAll` that provisions a
  device and logs it in. Correct as written.
- **`packages/facility-server/__tests__/services/initTimesync.test.js` (43).** One test, one claim
  (the URL is read per exchange, not captured). Minimal.
- **`packages/facility-server/__tests__/database/integrity.test.js` (+37).** Four cases, four lines
  of arrange each, extends an existing suite's fixtures.
- **`packages/central-server/__tests__/admin/settings.test.js` (+85).** Has its `saveEndpoints`
  helper and one table already. Only micro-saving available: a `withRequireHttps()` wrapper for the
  repeated `Setting.set(...)` + `settingsCache.reset()` pair, worth ~4 lines — not worth the churn.
- **`packages/facility-server/__tests__/sync/centralEndpoints-integration.test.js` (224).** Four
  tests over ~90 lines of fake central. Each proves something **no unit test can**: that
  `FacilitySyncManager` really wraps the session in `beginSession`/`endSession`, that
  `applyCentralEndpoints` is really called off the back of a completed session, and that the
  reported endpoint really reaches the `POST /sync` body. Not redundant with the unit tests of
  those pieces — keep all four. Only the shared-fixture extraction (item 1) touches it.
- **`packages/facility-server/__tests__/sync/CentralEndpointSelector.test.js` (502).** The longest
  new file, but 35 tests at ~14 lines each with one good `makeSelector` factory, and the product
  class genuinely has ten public methods crossed with the pause, the session flag and the follower
  role. Only item 1(b) applies. The two session-race tests (`stops probing once a session starts`,
  `does not move when a session started while it was probing`) both monkeypatch `selector.probe`;
  a 5-line `beginSessionAfterProbe(selector)` helper would save ~6 — below the noise floor.

## Deliberately not proposed

- **Deleting any test.** No case on the branch is covered identically elsewhere.
- **Replacing `applyCentralEndpoints.test.js`'s hand-rolled selector stub (18 lines) with a real
  `CentralEndpointSelector`.** It would save ~14 and remove a fake, but `probe()` reaches
  `getSyncConfig()` and the test would then depend on serverConfig state it currently doesn't.
  Medium risk for a small return — flagging it as an option, not a recommendation.
- **A shared fake-central network.** The two fakes differ enough that unifying them is
  line-neutral and less readable. See item 1.
