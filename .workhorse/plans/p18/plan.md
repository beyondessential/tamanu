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
- `ability` is derived with a memo from that user and the permissions the device holds for them (`backend.permissions.getForUser`), so it exists whenever a usable session does. The permissions sit on a service, not in anything React tracks, but a remote sign-in stores them just before the provider sets the new user, so rebuilding when the user changes picks them up. The notes first had `ability` as state set at restore and sign-in; the memo does the same with no second piece of state to keep in step.
- Permissions are held per user (release 2.69, merged in from main while this card was open). A sign-in for a user with none stored is refused before the session changes. A stored session whose user has none is ended as a log out would end it, before anything renders: the provider holds its children back until that has happened, so no screen sees a signed-in user with no `ability`, and there is no navigator to reset. Main does the same from an effect after the first screen has rendered.
- `settings`, `resetPasswordLastEmailUsed` and `preventSignOutOnFailure` stay as they are: separate, in memory only.
- The context keeps its current names (`checkFirstSession`, `setUserFirstSignIn`, `isUserAuthenticated` and the rest), so the thirty existing `useAuth()` callers are untouched. `SignIn.tsx` reads `checkFirstSession()` in place of `authSelector`.
- `useSelector(authUserSelector)` becomes `useAuth().user` in the twelve files that use it.
- The context value is memoised, and the functions on it are stable where their dependencies allow. Today the value is a fresh object on every provider render, which was hidden because the user-reading screens subscribed to Redux instead. With those screens moving onto the context, an unmemoised value would re-render them on every provider render.
- `withAuth` and `containers/Auth.tsx` go. `HomeScreen` takes `user` from `useAuth()` in place of the HOC prop.

### The one behaviour change

Today the provider's copy of `user`, and `ability` with it, is restored at launch only when a token is also stored. A device that logs out (tokens discarded), signs in offline, then closes and reopens the app comes up signed in on the home screen with a null `ability`, and the screens that call `ability.can(...)` have no guard for that. Read from the code, not reproduced on a device.

With one `user`, `ability` is restored whenever a user is, tokens or not. Decided with Tom: let the refactor fix this instead of writing the token condition back in. The Mobile app session spec carries a criterion for it under Opening the app.

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
- The restored state itself is not stored again. redux-persist wrote it back straight after rehydrating, which replaced an entry it had failed to read with the initial state. Leaving the entry alone until something changes means a passing storage error does not cost the device its session.
- Writes go through a small queue in the storage helper so two changes in quick succession land in order. redux-persist serialises its writes, and Keychain writes are slow enough that an out-of-order pair is possible without it.
- Both providers do this through one hook, `useStoredState`, over a `createStoredState(storage, key)` helper that owns the parse and the write queue.
- `store/secureStorage.ts` moves to `helpers/secureStorage.ts` as a plain helper, without the redux-persist `Storage` type.
- The provider's effect that hands tokens to the central server waits for the read, so it does not clear the connection's tokens on mount and set them again a moment later.

## Storage format and the update path

Decided with Tom: an update from a build that kept this state in Redux does not carry the session or the selection over. Nothing reads the state those builds stored, and nothing removes it. The notes first kept redux-persist's keys and had the reader unwrap its format, and that version passed the signed-in upgrade on the emulator before it was dropped.

- The session is in the Keychain under the service `tamanu.session`, and the selected patient in AsyncStorage under `selectedPatient`, both as plain JSON: the session object as held in state, and `{ selectedPatient }`.
- The keys have to differ from redux-persist's `persist:auth` and `persist:root`. Its format wraps each value in a JSON string of its own, so a plain read of an old entry would come back with the text `"true"` for `signedIn` and a string for `user`.
- After the update, the device opens on the log in screen with the welcome introduction to show again and no patient selected. A device signed out for inactivity loses its stored tokens with the rest, so its background sync stops until someone signs in. The linked facility, the server address and recently viewed are separate AsyncStorage entries and are kept.
- The entries those builds left stay on the device unread: the old tokens in the Keychain, and in `persist:root` the last selected patient's record in plain text. Removing them was offered and declined.
- The Mobile app session spec's criterion that an update keeps the session holds from this build on, so it is unchanged. The one-off sign-out belongs in the release notes.
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

- [x] `storedState` helper: plain JSON parse, queued writes
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

- [x] Typecheck shows no errors beyond the ones already on main (543 against 547 at the merge base, none from this card). Main's shared `common.tsconfig.json` targets `es2025`, which the repository's TypeScript 5.9 and TypeScript 6 both reject, so the check runs with those targets lowered for the run only
- [x] Mobile jest suite passes (532 tests after the old-format tests went, run with three workers)
- [x] Lint passes on the mobile package with no errors
- [x] Android JavaScript bundle builds, so every import resolves under Metro, with no Redux package in it
- [x] Run on an emulator, including the update from the previous build: every device case passed (see Device run and the test cases)

> The full jest suite fails a handful of unrelated suites on this machine at the default eight workers, on the base as well as on this branch. Each passes on its own and the whole suite passes at three workers.

## Testing

- `AuthProvider`: restore from storage, restore of a user with no token (ability present), sign in online and offline, sign out, inactivity sign-out keeping tokens, the welcome introduction flag, and what is written to storage after each. Rendered with the mocked Keychain already in `jest.setup.ts`.
- `SelectedPatientProvider`: set, clear, restore, the recently viewed update, and what is written.
- `useSurveySubmitMutation.spec.tsx` drops its `react-redux` mock for a mock of the hook. The note in that file about react-redux resolving a second copy of React no longer applies.
- `SearchPatientTabs.spec.tsx` drops its `containers/Patient` mock.
- `NewPatientScreen.spec.tsx` renders a navigator, which needs jest to resolve one copy of React: navigation's dependencies are hoisted to the repository root, where the web app's older React sits. `jest.config.js` maps `react` to the mobile package's copy.
- On a device: the card's test focus list, with the update check done by installing this build over the previous one while signed in with a patient selected. [Device run](#device-run) is the brief for it.

## Device run

The cases are under "On a device" in the test cases. The rig below is set up on the developer's Intel Mac, and most of the session and selected patient cases have passed on it. This section is the brief for running them on a machine that has an Android emulator, with an agent driving the app through `adb` (screenshots, the view hierarchy, taps and typing) or Maestro.

### What the machine needs

- Android Studio with an emulator on Android 12 or later, and `adb` on the path. Match the emulator's architecture to the machine: arm64 on Apple silicon, x86_64 on Intel.
- To build the app: Node 26, the Android SDK for API 36 and NDK 27.1.12297006. The first build compiles every native module's C++ and is slow. Pass `-PreactNativeArchitectures=arm64-v8a` (or `x86_64`) to Gradle to build the one architecture the emulator runs.
- A central server on this release. A rig lease gives one, with facilities, users and reference data seeded, and needs Postgres on the machine. Its address is `info.centralUrl` in the lease, and its accounts are listed there too.

### Builds

Two builds, from two checkouts:

- **The previous build**: main without this card, from a worktree of `origin/main`. It still keeps its state in Redux under redux-persist's keys, and it is on the same version as this branch, so one central server accepts both.
- **This build**: the card's branch.

The card removes only JavaScript packages, so the native side of the two builds is the same, and one debug package serves both. A debug build loads its JavaScript from Metro, so the checkout Metro runs from is the build under test. Upgrading is: reinstall the package over itself with `adb install -r` (which keeps the app's data, as a store update does), switch Metro to the card's checkout, and launch. Building a second package would add half an hour and test nothing more.

The emulator reaches the machine's own `127.0.0.1` at `10.0.2.2`, and a debug build offers "Local central server (port 3000)" at `http://10.0.2.2:3000` on the log in screen. A small HTTP proxy on the machine's port 3000 passes that to the lease's central server, so neither checkout needs a `serverOverrides.json` edit. The app remembers the server it first signed in to, so the second build carries on against the same one.

Release builds are the closer check but need CI, since a release build made without the signing secrets is unsigned. A pull request deployment builds this branch's package wired to its own central server and posts the link on the pull request. The previous build would come from running the Android packaging workflow by hand with that same server, from a branch that is not `main`, because a run on `main` publishes its package.

### The rig on this machine

Everything except the repository changes lives in the card's rig work directory (`workhorse-local rig workdir`), which is cleared with the card.

- **Toolchain.** Node 26 from nvm, a Temurin JDK 17 in the work directory (the machine's default Java is 11, which this Gradle refuses), and NDK 27.1, build tools 36 and the command-line tools added to the SDK.
- **Emulator.** An AVD named `tamanu-rig`: Pixel 5, Android 13, x86_64, 3 GB, hardware keyboard on, run headless with software rendering and animations off. Error dialogs are suppressed, because System UI stalls under load on this 4-core machine and its "isn't responding" dialog sits over the app.
- **Builds.** The previous build is a detached worktree at the merge base with main, `0561d172e1`, inside the work directory. Gradle's `assembleDebug` for `x86_64` only took 28 minutes cold.
- **Server.** A lease held as `device-run/central` for eight hours, with the forwarder above. The accounts are the rig's: `admin@tamanu.io` / `admin`, plus a practitioner and a reception user. Link the device to `facility-1`. The rig seeds no patients, so register one.
- **Driving.** Shell scripts beside each other in the work directory's `scripts/`: `env.sh` (sourced by the rest), `emulator-up.sh`, `metro.sh prev|this|stop`, `app.sh install|launch|stop|clear|logcat`, `ui.sh` (the screen's labels and tap centres from a view hierarchy dump), `tap.sh "<label>"`, `type.sh "<field>" "<text>"`, `shot.sh <name>`, `storage.sh` (the app's AsyncStorage entries; the Keychain is encrypted and not readable), `db.sh "<sql>"` (the app's own SQLite database), `login.sh <email> <password>`, `tab.sh <tab>`, `central.sh on|off`, `hidekb.sh`, `scroll.sh` and `slowtype.sh`. The bottom tab bar reports no position to the dump, so its tabs are tapped by position: Home, Sync, Patient, Reports and More across the bottom at y 2188.
- **Driving pitfalls.** The soft keyboard is switched off (`show_ime_with_hard_keyboard` 0), because its glide typing read swipes as words and its autocomplete changed what was typed. Pick from a dropdown by tapping the listed option, not by typing its text: typed text alone leaves the value unset and the form refuses to submit without saying why off screen. Android's back button leaves a form when no keyboard is up.
- **Maestro** is downloaded too, for writing flows as files rather than driving step by step, but nothing uses it yet.

Setting it up turned up three things outside the card's own code:

- The rig recipe could no longer seed against current main: with no `NODE_ENV`, the servers count as a deployment, so they make no development key file and refuse weak token secrets. The recipe now makes a key file and token secrets once per build.
- Metro cannot resolve a package-exports subpath with no extension, so `@tamanu/utils/calculationExpression`, which arrived with the 2.69 merge, stopped every debug and release bundle of the mobile app. Main fixed it in #11846, after this card last merged main. It is cherry-picked onto the branch, and applied uncommitted in the previous build's worktree.
- A debug build of this branch bundles with none of the Redux packages in it, and the previous build's bundle has them, which confirms the two Metro servers are serving what they should.

### Order

1. **Update.** Install the previous build, sign in online, choose a facility, pass the welcome introduction and select a patient. Install this build over it with `adb install -r`. It opens on the log in screen, and signing in leads into the welcome introduction.
2. **Relaunch.** Close this build fully and reopen it, and watch the sync that starts at launch through to the end. The launch read was moved to overlap the backend starting, and only a device shows whether the tokens reach the central server connection in time.
3. **Session and selected patient cases**, in the order the test cases list them.
4. **Out-of-date app**, staged through the forwarder as below.

A debug build cannot be relaunched in aeroplane mode, because it loads its JavaScript from Metro over the network. For the offline cases that need a relaunch, `central.sh off` stops the forwarder instead, which leaves the central server unreachable while Metro still answers.

### Where the run stands

Every device case has run and passed. Results are in the test cases and in comments on the card with screenshots.

Some cases were staged rather than waited out:

- **Inactivity.** The thirty minutes is a constant measured against the clock, so the emulator's clock was moved forward thirty-one minutes (`adb root`, then `date -u`, with automatic time off and back on afterwards). Left untouched, the app signed out within the minute's check; brought back from the background, it signed out on returning. `adb root` restarts the device's debug connection, which drops Metro's port forward, so `adb reverse tcp:8081 tcp:8081` again afterwards.
- **A rejected session.** The rig's central server was given a one-minute token lifetime (`auth.tokenDuration` in its settings table), the device signed in online, and its refresh token was deleted from `refresh_tokens`. The next sync is refused and the refresh fails, which raises "Sync inactive" on the home and patient screens. Delete the setting afterwards.
- **An out-of-date app.** Central decides that from a file in its build and reads the update address at startup, so it was not touched. The port 3000 forwarder is an HTTP proxy, and while a file named `outdated` sits in the work directory it answers every mobile request but log in with central's own out-of-date response. The rig has no package at the update address, so the banner takes its "no update available" form.
- **A form writing back to patient fields.** The rig's programs have none, so one question on the nutrition form was turned into a `PatientData` question writing the first name, in the rig's central database, and synced down.

In a debug build with the hardware keyboard, R pressed twice reloads the JavaScript, which leaves the database connection open and every screen failing with "DataSource is not set for this entity" until the app is restarted. Only type with a field focused.

Vitals keeps only the first character of a number typed one key at a time, on main as well as here. It is recorded on the card as needing a card of its own, as is the mobile typecheck being unable to run on main's shared TypeScript config.

### Recording it

Tick each case in the test cases as it passes. Where one fails, file an issue on the card with the screenshot and the `adb logcat` lines that show it, and leave the case unticked.

## Left as it is

- A log in the central server refuses signs the device out even from the log in screen, so a wrong password on a device that was signed out by inactivity discards its tokens and stops its sync. The Mobile app session spec now says so.
- A rejection for the app's version belongs to in-app updates, which arrived from main while this card was open. The auth provider leaves the session alone and records the update to fetch, and the Mobile app session spec says so by pointing at the Mobile app updates spec.
- The launch sync can still start before the stored tokens reach the central server connection, as it can today. It fails on authentication and the next scheduled sync picks up.
- A token refreshed mid-session is not written back to storage.
- Scheduled sync does not restart after a log out and log in within one run. Recorded on the card as an issue needing its own card.
