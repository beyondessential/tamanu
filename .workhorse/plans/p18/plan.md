# Remove Redux from the mobile app

A behaviour-preserving refactor of `packages/mobile`. The auth session moves into `AuthProvider` as React state, the selected patient gets a context of its own, and every Redux package leaves the mobile app. What the app has to keep doing is recorded in the Mobile app session spec (MSESS) and the Selected patient on mobile spec (MSELP).

## What exists today

- One store (`App/ui/store/index.ts`) with two slices and no middleware. The auth slice is persisted to the Keychain, the patient slice to AsyncStorage, both through redux-persist. `PersistGate` in `stacks/Root.tsx` holds the first render until both are read back.
- `AuthProvider` is already the place every auth action lives (`signIn`, `signOut`, `signOutClient`, `reconnectWithPassword`). It receives the slice's state and action creators as props through `withAuth`, and keeps a second copy of `user`, plus `ability`, in its own state.
- The two copies of `user` are read by different screens. Twelve files read the Redux copy through `authUserSelector`. Six read the context copy through `useAuth().user`. About twenty read `useAuth().ability`, none with a null guard.
- The selected patient is read through `withPatient` (35 files, all function components), `useSelector(state => state.patient)` (10 files), and one `store.getState()` in `NewPatientScreen`. It is set from 8 places and by `useSurveySubmitMutation` through `useDispatch`.
- Nothing outside `App/ui` imports a Redux package, and nothing outside React reads the store.

## Auth state in the provider

- `AuthProvider` holds the persisted session as one state object: `token`, `refreshToken`, `user`, `signedIn`, `isFirstTime`. One object rather than five `useState` calls so a sign-in that sets three fields is one state change and one write to storage.
- There is one `user`, the one in the session. The provider's second copy goes.
- `ability` is derived from that user and `backend.permissions.data` with a memo, so it exists whenever a user does. `permissions.data` is a plain property on a service, not something React tracks, but a remote sign-in replaces it just before the provider sets the new user, so rebuilding when the user changes picks it up. The notes first had `ability` as state set at restore and sign-in; the memo does the same with no second piece of state to keep in step.
- `settings`, `resetPasswordLastEmailUsed` and `preventSignOutOnFailure` stay as they are: separate, in memory only.
- The context keeps its current names (`checkFirstSession`, `setUserFirstSignIn`, `isUserAuthenticated` and the rest), so the thirty existing `useAuth()` callers are untouched. `SignIn.tsx` reads `checkFirstSession()` in place of `authSelector`.
- `useSelector(authUserSelector)` becomes `useAuth().user` in the twelve files that use it.
- The context value is memoised, and the functions on it are stable where their dependencies allow. Today the value is a fresh object on every provider render, which was hidden because the user-reading screens subscribed to Redux instead. With those screens moving onto the context, an unmemoised value would re-render them on every provider render.
- `withAuth` and `containers/Auth.tsx` go. `HomeScreen` takes `user` from `useAuth()` in place of the HOC prop.

### The one behaviour change

Today the provider's copy of `user`, and `ability` with it, is restored at launch only when a token is also stored. A device that logs out (tokens discarded), signs in offline, then closes and reopens the app comes up signed in on the home screen with a null `ability`, and the screens that call `ability.can(...)` have no guard for that. Read from the code, not reproduced on a device.

With one `user`, `ability` is restored whenever a user is. Decided with Tom: let the refactor fix this instead of writing the token condition back in. The Mobile app session spec carries a criterion for it under Opening the app.

## Selected patient context

- A new `SelectedPatientContext` in `App/ui/contexts/`, with a `SelectedPatientProvider` and a `useSelectedPatient()` hook returning `selectedPatient` and `setSelectedPatient`.
- `setSelectedPatient` does what the reducer did: sets the patient (or null), and for a patient with an id calls `addPatientToRecentlyViewed`. That function moves out of the duck unchanged, including its early return when the patient is already first in the list.
- The setter is stable (`useCallback`) and the value memoised, so a screen that only sets the patient does not re-render for an unrelated reason.
- One context, not a split state/setter pair. The selection changes on navigation, not while a screen is being used, so the extra re-render of setter-only screens is not worth a second context.
- The provider sits inside `NavigationContainer` and above `Core`. It has no dependency on auth, which matches the selection outliving sign-out.
- The in-app update provider that main added (`UpdateProvider`) sits inside it, directly above the idle layer, where main had it.

## Reading storage at launch

- Each provider renders nothing until its stored state has been read, which is what `PersistGate loading={null}` does today.
- Both reads start as the app loads, from `App/index.tsx`, and each provider picks up the result when it mounts. redux-persist read at module load too, so the reads ran alongside the backend starting. The notes first had each provider start its own read on mount, which put the two reads one after the other behind the backend, and left the launch sync, which starts with the backend, further ahead of the stored tokens reaching the central server connection than it is today.
- A preloaded read is handed over once. A provider that mounts again, as it does when `BackendProvider` re-initialises, reads storage afresh, behind any write still in the queue so it cannot read back what was stored before that write.
- The hook settles what the state starts as on its first render, so a caller passing a fresh object each render cannot send the read round again.
- A read that fails, finds nothing, or has not settled after five seconds starts from the initial state (signed out, welcome introduction not shown, no patient), as redux-persist does.
- After the read, each provider stores its state whenever it changes, from an effect. This is the external-store case the coding rules allow an effect for, and it means no setter can forget to persist.
- The restored state itself is not stored again. redux-persist wrote it back straight after rehydrating, which replaced an entry it had failed to read with the initial state. Leaving the entry alone until something changes means a passing storage error, or an entry from an earlier build that this reader gets wrong, does not cost the device its session.
- Writes go through a small queue in the storage helper so two changes in quick succession land in order. redux-persist serialises its writes, and Keychain writes are slow enough that an out-of-order pair is possible without it.
- Both providers do this through one hook, `useStoredState`, over a `createStoredState(storage, key)` helper that owns the parse and the write queue.
- `store/secureStorage.ts` moves to `helpers/secureStorage.ts` as a plain helper, without the redux-persist `Storage` type.
- The provider's effect that hands tokens to the central server waits for the read, so it does not clear the connection's tokens on mount and set them again a moment later.

## Storage format and the update path

Decided with Tom: keep the storage keys, write plain JSON, and have the reader accept redux-persist's format as well.

- The session stays in the Keychain under the service `tamanu-persist.persist:auth`, and the selected patient in AsyncStorage under `persist:root`. Keeping the keys means an update needs no migration step and leaves no old entry to clean up.
- redux-persist's format is a JSON object whose values are each a JSON string, plus a `_persist` entry. For the session that is `token`, `refreshToken`, `user`, `signedIn` and `isFirstTime`. For the root entry it is a single `patient` value holding `{ selectedPatient }`.
- The reader tells the two apart by the `_persist` entry. With it present, each other value is parsed a second time and `_persist` is dropped. Without it, the object is used as read.
- The plain shapes are the session object as held in state, and `{ selectedPatient }`.
- An entry in the old format is replaced with the plain one the first time the state changes after an update, not at launch. The legacy branch has to stay in the reader for as long as devices can update from a build that used Redux.
- The parse is a pure function with its own unit tests for both formats, a missing entry, and an entry that does not parse.
- Downgrade is not a concern. Android will not install an older build over a newer one without an uninstall, which clears both stores.

> A restored patient is a plain object, not a `Patient` model instance, and its dates are strings. That is already true after any relaunch today, so screens reading the selected patient already cope with it.

## Consumer migration

- `withPatient(Component)` becomes a `useSelectedPatient()` call in the component body, and the `compose` wrapper goes with it. All 35 are function components, so none needs restructuring.
- `useSelector(state => state.patient)` becomes the hook in the 10 files that use it.
- `NewPatientScreen` keeps its mount-time snapshot, taken from the hook: `useState(selectedPatient)`. The snapshot exists so that clearing the selection on the way back does not blank this screen while its stack is still mounted.
- That snapshot depends on the screen mounting after the selection is set. Registration calls `setSelectedPatient` and then `navigation.navigate` in the same tick, after an `await`. Navigation state lives in a `useSyncExternalStore`, which React renders at sync priority, while the selection is ordinary state set at default priority. React 19 renders both priorities in one pass, so the screen mounts with the patient already selected. `NewPatientScreen.spec.tsx` covers this with the real provider under a navigator, and fails when the selection is moved to transition priority.
- `useSurveySubmitMutation` reads the selected patient's id and the setter from the hook. Its reload after a submit calls the setter, so it re-enters recently viewed as it does today (a no-op when the patient is already first).
- `SearchPatientTabs` calls the hook like every other caller, and its spec mocks the hook the way it already mocks the settings and translation hooks. The notes first kept a props-taking `DumbSearchPatientTabs` for the spec; that split existed only because a connected component could not be rendered under jest.
- `setSelectedPatient` accepts the `Patient` model as well as `IPatient`. The model is meant to implement the interface but is not assignable to it, because the two disagree on the type of `village.visibilityStatus`. Callers passed models through untyped props before, so typing the setter as `IPatient` alone would have added type errors at each of them.
- `interfaces/ReduxStoreProps.ts`, `helpers/selectors.ts`, `containers/Patient.tsx` and `store/ducks/` are deleted. `WithPatientStoreProps` and similar prop types that screens extend are replaced by the hook's return type or dropped where the props no longer exist.

## Sequencing

One pull request, built in commits that each leave the app building and its tests passing. The two slices persist under separate keys, so each can leave the store on its own.

1. Auth: session state and storage into `AuthProvider`, `authUserSelector` and `authSelector` callers onto `useAuth()`, `withAuth` removed. The store is left holding the patient slice only.
2. Selected patient: the context and provider, then every `withPatient`, `useSelector`, `useDispatch` and `store.getState()` caller onto the hook. The store, `Provider` and `PersistGate` go in this commit too, because the store and the new provider would otherwise both write to `persist:root`.
3. Removal: the `reactotronRedux()` plugin, the seven packages from `packages/mobile/package.json`, the Redux parts of `App/ui/README.md`.
4. ~~A `no-restricted-imports` entry for the Redux packages in the mobile block of `eslint.config.js`.~~ Added, then removed. The web app's Redux removal (H17) ships in the same release, after which the packages are gone from the workspace and an import fails to resolve on its own, so the rule only covered the gap between the two cards merging.

The root `react-redux` override in the top-level `package.json` stays. The web app still depends on it until H17 lands.

## Checklist

### Auth

- [x] `storedState` helper: parse both formats, queued writes
- [x] `useStoredState` hook
- [x] `secureStorage` moved out of the store folder
- [x] Session state, storage and memoised value in `AuthProvider`
- [x] `authUserSelector` and `authSelector` callers onto `useAuth()`
- [x] `withAuth`, the auth duck and `helpers/selectors.ts` removed; store left with the patient slice
- [x] Specs: `storedState`, `AuthProvider`, `useSurveySubmitMutation` updated

### Selected patient

- [x] `SelectedPatientContext` with provider and `useSelectedPatient()`
- [x] Provider mounted in `Root.tsx`
- [x] `withPatient` callers onto the hook
- [x] `useSelector(state => state.patient)` callers onto the hook
- [x] `NewPatientScreen` and `useSurveySubmitMutation` onto the hook
- [x] Prop types that extended the store's types
- [x] Store, `Provider` and `PersistGate` gone from `Root.tsx`
- [x] `containers/Patient.tsx`, `interfaces/ReduxStoreProps.ts`, `store/` deleted
- [x] Specs: `SelectedPatientProvider`, `NewPatientScreen`, `useSurveySubmitMutation`, `SearchPatientTabs`

### Removal

- [x] `reactotronRedux()` removed
- [x] Seven packages removed from `packages/mobile/package.json`, lockfile updated
- [x] Redux removed from `App/ui/README.md`

### Guard

- [x] `no-restricted-imports` for the Redux packages in the mobile lint block, since removed (see Sequencing)

### Checks

- [x] Typecheck shows no errors beyond the ones already on the base (480 on the base, 477 now with main merged in, none from this card)
- [x] Mobile jest suite passes (68 suites, 513 tests with main merged in, run with three workers)
- [x] Lint passes on the mobile package with no errors
- [x] Android JavaScript bundle builds, so every import resolves under Metro, with no Redux package in it
- [ ] Run on a device or emulator, including the upgrade from the previous build

> The full jest suite fails a handful of unrelated suites on this machine at the default eight workers, on the base as well as on this branch. Each passes on its own and the whole suite passes at three workers.

## Testing

- `AuthProvider`: restore from storage in both formats, restore of a user with no token (ability present), sign in online and offline, sign out, inactivity sign-out keeping tokens, the welcome introduction flag, and what is written to storage after each. Rendered with the mocked Keychain already in `jest.setup.ts`.
- `SelectedPatientProvider`: set, clear, restore, the recently viewed update, and what is written.
- `useSurveySubmitMutation.spec.tsx` drops its `react-redux` mock for a mock of the hook. The note in that file about react-redux resolving a second copy of React no longer applies.
- `SearchPatientTabs.spec.tsx` drops its `containers/Patient` mock.
- `NewPatientScreen.spec.tsx` renders a navigator, which needs jest to resolve one copy of React: navigation's dependencies are hoisted to the repository root, where the web app's older React sits. `jest.config.js` maps `react` to the mobile package's copy.
- On a device: the card's test focus list, with the upgrade check done by installing this build over the previous one while signed in with a patient selected.

## Left as it is

- A log in the central server refuses signs the device out even from the log in screen, so a wrong password on a device that was signed out by inactivity discards its tokens and stops its sync. The Mobile app session spec now says so.
- A rejection for the app's version belongs to in-app updates, which arrived from main while this card was open. The auth provider leaves the session alone and records the update to fetch, and the Mobile app session spec says so by pointing at the Mobile app updates spec.
- The launch sync can still start before the stored tokens reach the central server connection, as it can today. It fails on authentication and the next scheduled sync picks up.
- A token refreshed mid-session is not written back to storage.
- Scheduled sync does not restart after a log out and log in within one run. Recorded on the card as an issue needing its own card.
