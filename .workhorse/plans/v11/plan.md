# In-app APK download and silent update

Build plan for V11, against `specs/platform/mobile-app-updates.md` (MUPD).

## Technical notes

**Nothing blocks the app.** Staff keep working offline while the update downloads, so the update
lives in a home-screen banner beside `SyncInactiveAlert` and in a paused state on the Sync tab,
rather than in a screen of its own. `UpdateProvider` sits above both in `Root.tsx`, because two
independent `useAppUpdate` calls would each run their own download.

**Outstanding state is persisted** in the existing AsyncStorage config (`readConfig`/`writeConfig`),
keyed on the update address central supplied, so closing the app mid-update resumes rather than
losing it. It is cleared by a successful sync, which is the proof the server accepts the version
now running.

**Download is native, not JS.** Resume across app restarts needs range requests appending to a
part-file, which `react-native-fs` can't do. The native module uses OkHttp (already on the React
Native classpath), writes to `files/update/tamanu.apk.part`, and emits progress events.

**Reopening after install** uses an `MY_PACKAGE_REPLACED` broadcast receiver. Android delivers that
to the app whose package was just replaced, which is exactly the moment to post the notification —
the app's own process is gone by then, so nothing in JS can do it.

**minSdk is 31**, so `PackageInstaller`, `canRequestPackageInstalls()` and the session API are
available without legacy branches. `POST_NOTIFICATIONS` still needs a runtime request on 33+.

## Steps

### Settings and endpoint contract

- [x] Point the `metaServer.updateUrls.mobile` default at the package address, leaving the browser
      page at its existing address
- [x] Update the matching `config/default.json5` value and the settings test that asserts it

### Native module

- [x] Manifest: `REQUEST_INSTALL_PACKAGES`, `POST_NOTIFICATIONS`, and the `MY_PACKAGE_REPLACED`
      receiver. No `FileProvider`: the session API takes a stream, not a file address, so the
      provider the legacy install intent would need never comes into it
- [x] `UpdaterModule` — `getStatus`, `getFreeDiskBytes`, `startDownload`, `cancelDownload`,
      `installDownloadedPackage`, `openInstallPermissionSettings`, `clearDownload`
- [x] Resumable download: `Range` header from the part-file's length, append on write, progress
      events, and a declared-size check before the file is handed over
- [x] `UpdateInstalledReceiver` posting the "Tamanu has been updated" notification
- [x] `UpdaterPackage`, registered in `MainApplication`

### JS layer

- [x] `useAppUpdate` hook owning the state machine: downloading → retrying → ready → installing,
      plus the permission ask and the failure states. It stops at ready; staff choose to install
- [x] `UpdateProvider` so the banner and the Sync tab share one download
- [x] Automatic retry with a lengthening gap, and the attempt count that surfaces the manual
      address after three
- [x] Record the outstanding update when `OutdatedVersionError` is raised, leaving the session alone
- [x] Pause sync in `triggerSync` while an update is outstanding, and clear the update state on a
      successful sync so a past install isn't held against a later update
- [x] `UpdateAlert` on the home screen, and `SyncPausedForUpdate` on the Sync tab
- [x] `UpdateModals` — the install confirmation, the installing message, and the failure

### Checks

- [x] Typecheck, lint and unit tests pass. `:app:compileDebugJavaWithJavac` builds the native
      module; eslint is clean; the mobile unit suite passes. The mobile package's `tsc` has 473
      pre-existing errors in this environment (workspace packages aren't built, so
      `@tamanu/constants` does not resolve) — none in the files this card touches
- [x] Test cases drafted at `.workhorse/test-cases/v11/overview.md`

## Out of this repo

The meta server endpoint lives in `tamanu-meta`, which this branch doesn't hold. MUPD's "The update
endpoint" section is the contract it has to meet; the work needs raising there separately.
