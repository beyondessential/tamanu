# Keep the screen awake during every mobile sync

Move the keep-awake out of `SyncDataScreen` and into `MobileSyncManager`, so it is held for every sync that has a session, whatever started it and whichever screen is showing. Implements the Mobile keep-awake during sync spec (SYNAWK). Native wake lock / foreground service work is out of scope and lives on #H13.

## Design notes

- Today the lock is taken in `SyncDataScreen`'s `SYNC_STARTED` handler and released in its `SYNC_ENDED` handler (`SyncDataScreen.tsx:62,69`). The Sync tab is lazily mounted (react-navigation bottom-tabs default, not overridden in `HomeTabs.tsx`), so the initial sync started from `SelectFacilityScreen`, and periodic and login syncs, run with no lock unless the user has already opened that tab. If the screen unmounts mid-sync the release never runs.
- Every sync, from every trigger, goes through `MobileSyncManager.runSync` (called only from `triggerSync`), so that is the one place to hold it.
- Take the lock immediately before `SYNC_STARTED` is emitted, which is the point a session has been granted. A queued sync returns earlier in `runSync` (the `!sessionId` branch), so it never takes the lock and needs no release.
- Release in a `finally` wrapping everything after `SYNC_STARTED` in `runSync`, rather than from an emitter listener or next to the `SYNC_ENDED` emit in `triggerSync`. Acquire and release then sit in one function, a throwing event listener cannot skip the release, and success and failure both release.
- `@sayem314/react-native-keep-awake` sets and clears `FLAG_KEEP_SCREEN_ON` on the activity window. It is a flag, not a counter, which is fine because only one sync runs at a time.
- The package resolves its native module under jest, so the unit tests need a `jest.mock` for it.

## Build

- [x] In `packages/mobile/App/services/sync/MobileSyncManager.ts`, import `activateKeepAwake` and `deactivateKeepAwake` from `@sayem314/react-native-keep-awake`
- [x] In `runSync`, call `activateKeepAwake()` just before emitting `SYNC_STARTED`, and wrap the remainder of the method (push, pull, end session, snapshot cleanup, last-sync time) in a `try`/`finally` that calls `deactivateKeepAwake()`, keeping the existing inner `try`/`catch` that reports the error to central
- [x] Add a `// spec: SYNAWK` comment at the acquire site
- [x] In `packages/mobile/App/ui/navigation/screens/home/Tabs/SyncDataScreen.tsx`, remove the library import and the `activateKeepAwake()` and `deactivateKeepAwake()` calls from the `SYNC_STARTED` and `SYNC_ENDED` cases

## Tests

- [x] In `MobileSyncManager.test.ts`, mock `@sayem314/react-native-keep-awake` and clear it in the existing `beforeEach`
- [x] Add a `runSync()` test that `activateKeepAwake` is called after `startSyncSession` resolves and before `pushOutgoingChanges`, and `deactivateKeepAwake` is called once after `endSyncSession` (verifies SYNAWK: held from session to end)
- [x] Add a `runSync()` test that `deactivateKeepAwake` is still called once when `pullIncomingChanges` throws (verifies SYNAWK: failure releases)
- [x] Add a `runSync()` test that neither function is called when `startSyncSession` returns no `sessionId` (verifies SYNAWK: a queued sync holds nothing)
- [x] Add a `triggerSync()` test that a sync started through the trigger path takes and releases the lock, so the coverage is of the real entry point and not only `runSync`

## Verify

- [x] Run `npx jest App/services/sync/MobileSyncManager.test.ts` in `packages/mobile`, and confirm the new tests fail with the manager change reverted
- [x] Run `npx eslint` on the two changed files and the test file
- [x] Type-check `packages/mobile`
- [ ] On a device: select a facility from a fresh install and leave the Home tab showing past the screen timeout; the screen stays on until the initial sync finishes, then follows the normal timeout
- [ ] On a device: let a periodic sync start while another tab is showing, and confirm the screen stays awake until it ends
