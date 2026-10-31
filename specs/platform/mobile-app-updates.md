---
id: MUPD
---

# Mobile app updates

A Tamanu mobile device must run a version its central server accepts. When central rejects the app for being out of date, Tamanu downloads the matching release from the meta server in the background and installs it over itself. Staff carry on working offline throughout: sync is paused until the update is installed, and nothing installs until someone chooses to.

Installing closes the app, and Android does not reopen it, so the moment is left to staff rather than taken. Installing over the same app preserves its data, so everything recorded while sync was paused survives the update and is sent by the first sync after logging back in.

## Detecting an out-of-date app

Servers reject a client below their minimum supported version and include the address the client should update from, taken from the `metaServer.updateUrls.mobile` setting with the minimum version substituted into it. Syncing is where an out-of-date mobile app is turned away; signing in is not, so staff can get into a device that is mid-update and work offline on it.

- [ ] A mobile app below the minimum supported version can still sign in, and the rejection that starts its update comes from its next sync.
- [ ] Other clients are still turned away at sign-in, where being out of date can be reported plainly rather than failing every call that follows.
- [ ] Any rejection of the mobile app for being below the minimum supported version starts the download, wherever the app is and whatever the user is doing.
- [ ] Staff stay signed in and carry on working. The screen they are on is undisturbed, and nothing they have part-filled is lost.
- [ ] Signing in does not clear an outstanding update, since the server accepts the sign-in whatever version the app is on. Only a sync it accepts does.
- [ ] Sync is paused for as long as the update is outstanding, since the server rejects this version. Changes recorded while it is paused are held on the device.
- [ ] An outstanding update is remembered on the device, so closing and reopening the app resumes it rather than losing it.
- [ ] An app rejected for being above the maximum supported version does not start an update, since a device cannot be moved backwards to an earlier release. It reports that the app is incompatible with its server, as any other sign-in failure does.

## The update endpoint

The meta server serves the Android package for a given version and branding at its own address, separate from the page a browser is sent to. The app knows its own branding; central does not, so the app adds its branding to the address central gives it.

- [ ] The endpoint returns the Android package file itself, for the version and branding requested.
- [ ] `metaServer.updateUrls.mobile` defaults to the package address, and the browser page stays available at its own address for devices that are sent there.
- [ ] The app adds its own branding to the address it receives before requesting the package.
- [ ] The response declares the package's size, so the app can check free space before downloading and detect a truncated download.
- [ ] The endpoint supports resuming a partial download from a byte offset.
- [ ] The endpoint serves the highest patch release within the requested version's minor line, matching the version range central asks for.
- [ ] A request for a version or branding the meta server has no package for is refused, and the app treats it as a failure it cannot retry its way out of.
- [ ] The package is served over an encrypted connection.

## The update banner

A banner on the home screen carries the whole state of the update, from downloading through to anything that has gone wrong. It is the only thing on the home screen that changes while an update is outstanding.

- [ ] While downloading, the banner reads "Downloading a Tamanu update (:percent%). Sync paused."
- [ ] Once the package is downloaded, the banner reads "Tamanu update ready. Install to sync." and offers Install.
- [ ] Closing the banner hides it until staff next arrive at the home screen, where it returns. It keeps returning until the update is installed.
- [ ] The banner does not block anything on the screen beneath it.

## Sync tab

The Sync tab is where staff go when sync looks wrong, so it says why sync is paused rather than offering a manual sync that would be rejected.

- [ ] While an update is outstanding, the Sync tab reads "Sync paused" instead of showing sync progress, and does not offer Manual sync.
- [ ] While downloading, it reads "Downloading a Tamanu update (:percent%)."
- [ ] Once downloaded, it reads "Tamanu needs to update before it can sync." and offers Install update.
- [ ] Install update is available on the Sync tab whether or not the home screen banner has been closed.
- [ ] The time of the last successful sync stays visible, so staff can see how long the device has been held back.

## Installing

Installing is the one step staff choose. It closes the app, so they are told before it happens and given the chance to finish what they are doing.

- [ ] Install, from either the banner or the Sync tab, opens a confirmation over whatever screen staff are on.
- [ ] The confirmation is titled "Install update" and reads "Save your work first. Tamanu will close to install the update. Open it again from the app icon."
- [ ] The confirmation offers Install and close, and Cancel. Cancelling, closing it, or tapping outside it installs nothing and leaves the banner as it was.
- [ ] Install and close hands the package to Android and replaces the confirmation with "Installing update", reading "Tamanu will close in a moment. Open it again from the app icon."
- [ ] The installing message cannot be dismissed, since Android has the package from that point and the app is about to close.
- [ ] After a successful install, a notification reading "Tamanu has been updated" opens the app when tapped.
- [ ] The app asks for permission to post notifications as part of the update, where the device requires it. Where it is refused the update still proceeds, and staff rely on the confirmation having told them to use the app icon.
- [ ] Opening the updated app leads to the sign-in screen, and the first sync after signing in sends everything recorded while sync was paused.
- [ ] The downloaded package is deleted once it has been installed.

## Permission setup

Installing a package requires the device to allow Tamanu to install apps, which is granted once per device through an Android settings screen. Asking while the download is still running means the one-off setup is done before staff need it.

- [ ] Where the device does not already allow Tamanu to install apps, the banner reads "Tamanu needs permission to update. Sync paused. You are currently working offline." and offers Allow.
- [ ] Allow opens the Android settings screen that grants the permission. Returning with it granted returns the banner to its downloading or ready state.
- [ ] Returning without granting it leaves the banner asking, so staff can grant it when they are ready.
- [ ] Android's own confirmation of the first install on a device is left to the user to accept; the app does not attempt to bypass or pre-empt it.
- [ ] Cancelling Android's first-install confirmation installs nothing and returns the banner to its ready state.

## Downloading

The download is built for the connections Tamanu is used on: slow, interrupted, and sometimes metered. It resumes rather than restarting, and retries on its own, all without staff needing to attend to it.

- [ ] The download runs on whatever connection is available, including a metered one, since sync stays paused until it finishes.
- [ ] An interrupted download resumes from where it stopped, including after the app is closed and reopened.
- [ ] Before downloading, the app checks there is enough free space for the package and for installing it. If there is not, the banner says so and sync stays paused.
- [ ] A failed download is retried automatically, with a longer gap before each successive attempt.
- [ ] A download that completes at a size other than the one declared is discarded and retried rather than installed.
- [ ] After three failed download attempts, the banner offers the address the package can be downloaded from by hand, alongside continuing to retry automatically. Not enough free space offers the same address without waiting for three attempts.

## When the install doesn't finish

Android replaces the app only once the new version is in place, so a failed install leaves the device on the version it was already running, with the work on it untouched.

- [ ] An install Android rejects replaces the installing message with "Update not installed", reading "The update couldn't be installed. Your work is unaffected.", offering Try again and Cancel.
- [ ] Try again starts the install again. Cancel, or closing it, returns to the ready banner so staff can install when they choose.
- [ ] An install interrupted by the device restarting or the app closing leaves the device on its existing version with the update still waiting, and the banner returns to its ready state.
- [ ] An app still rejected for its version immediately after installing an update does not download the same package again. The banner reads "Tamanu update was not accepted by the server. Please contact your system administrator."
