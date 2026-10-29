# UX/UI for V11: in-app update

Design work for V11 (in-app APK download and silent update). The design improves the experience
within V11's requirements and does not change them. Sources: the V11 card, the Mobile app updates
spec (`specs/platform/mobile-app-updates.md`, MUPD) and plan on the `workhorse/v11` branch, and
Chris's spike findings in the V11 comments.

## Fixed constraints

These come from Android or from how Tamanu servers work, so no design can change them.

- **What triggers an update.** Central or the facility server rejects the app for being below its
  minimum version. This happens at sign-in, on a sync, or on any other call to the server. Hotfixes
  within the same version line don't trigger an update.
- **No downgrades.** An app that is too new for its server gets an incompatible-version error and
  no update.
- **No sync until updated.** The server rejects the out-of-date app outright, so unsynced records
  can't be pushed first. They survive the install and sync after the next sign-in.
- **One-off device setup.** The first update on each device needs the Android "install unknown
  apps" permission, granted on an Android settings screen. Android then asks the user to confirm
  that first install. Later updates install without a prompt.
- **Installing closes Tamanu.** Android closes the app to install the update and leaves it closed.
  The app can't reopen itself.
- **Getting back in.** Android posts a "Tamanu has been updated" notification that opens the app,
  but only if notifications are allowed. Otherwise the user has to reopen Tamanu from its icon, so
  the screen has to tell them that before the install starts (Edwin: "clear messaging about
  reopening").
- **After the update,** opening Tamanu leads to the sign-in screen.
- **Download behaviour.** The download resumes rather than restarting, including across app
  restarts. It runs on metered connections. Failures retry automatically with a lengthening gap,
  from seconds up to five minutes. The update needs about twice the package's size in free space.
- **Failures retrying can't fix.** If the meta server has no package for the version or branding,
  or the app is still rejected right after updating, the screen shows the problem rather than
  retrying.

## Spec requirements on the update flow (MUPD)

- **The update blocks the device.** It signs the user out, takes over whatever screen they're on
  (a part-filled form is discarded) and keeps the Updating Tamanu screen up until the install
  completes, including after a restart.
- **Manual fallback.** The address to download the update by hand is offered:
  - after three failed download attempts
  - straight away when there isn't enough space
  - after the user declines the install permission twice
  - when the app is still rejected after updating

## Decision: staff keep working while it updates

The design follows the V11 draft designs rather than the blocking flow in MUPD. MUPD, the V11
description and the code pushed to `workhorse/v11` still describe the blocking flow, so V11's spec
needs updating to match before this ships. That change belongs on V11.

Under this model:

- **Rejected while signed in.** Staff stay signed in and keep working offline, with sync paused.
  The update downloads in the background, and a home screen alert shows its state.
- **Rejected login.** A device someone has logged in on before logs the user in offline, and the
  home screen shows the alert. A device nobody has logged in on can't work offline, so the user
  can't get in until the update installs.
- **When it installs.** While someone is logged in, only when they tap **Install and close** in the
  **Install update** modal, so Tamanu never closes on someone mid-task. When nobody is logged in
  (after logging out, an inactivity logout, or on a new device), it installs by itself and Tamanu
  closes. The exception is Tamanu opening at the login screen with an update ready (after a
  restart, after the app was closed, or on a tablet someone else logged out of). Someone is there
  to log in, so the **Install update** modal asks first, and **Cancel** lets them log in and work
  offline. This works because the app starts the install itself. Android's only part is the one-off
  permission and the first-install confirmation, which still need a tap even when nobody is logged
  in. On a logged-out device without the permission, the updating screen asks for it with **Allow**
  once the update has downloaded, then Android's prompt follows.
- **Open: logging out before the download finishes.** Undecided whether the next person can log in
  and work offline while it downloads, or must wait for the update to install first. Waiting could
  keep a shared tablet out of use for a long time on a poor connection.
- **Ways to install.** The home screen banner (**Install**), the Sync tab (**Install update**) and
  opening Tamanu at the login screen all use the same **Install update** modal. The banner keeps its close cross, but a
  closed banner comes back each time staff return to the home screen from another screen, until the
  update installs. The home screen stays loaded between tabs, so this needs the banner to reset when
  the screen regains focus rather than when it loads. While an update is downloading or ready, the
  Sync tab says sync is paused and why in place of **Manual sync**.
- **When the install doesn't finish.** Android only closes Tamanu once the new version is in place,
  so a failed install leaves Tamanu open:
  - Android rejecting the install shows "Update not installed", with **Try again**.
  - Cancelling Android's first-install prompt closes the modal and leaves the update ready banner.
  - An install interrupted by power loss, a restart or Tamanu being closed leaves the old version,
    with the update still waiting.
  - The server still rejecting the new version gives a single banner, "Tamanu update was not accepted
    by the server. Please contact your system administrator.", with no action and no modal. If the
    download-by-hand link stays, it needs a place in that banner.
- **No "restart".** Installing closes Tamanu and Android can't reopen it, so the copy says "close"
  and tells staff to reopen it from its icon. The notification only helps where notifications are
  allowed.
- **Deferring has no limit.** Staff can put the install off indefinitely, and sync stays paused the
  whole time. Whether there should be a limit is a requirement question for Chris and Edwin, not a
  design one.
- **Still unresolved.** The draft designs drop the download-by-hand link that MUPD requires, and
  send blocked cases to the administrator instead. Confirm whether the link stays before designing
  the blocked states.
