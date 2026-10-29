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
- **When it installs.** Only while the Updating Tamanu screen is open, reached by logging out or
  from the alert. Android closing the app never loses unsaved work.
- **Still unresolved.** The draft designs drop the download-by-hand link that MUPD requires, and
  send blocked cases to the administrator instead. Confirm whether the link stays before designing
  the blocked states.
