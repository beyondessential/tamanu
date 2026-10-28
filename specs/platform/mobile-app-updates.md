---
id: MUPD
---

# Mobile app updates

A Tamanu mobile device must run a version its central server accepts. When central rejects the app for being out of date, the app downloads the matching release from the meta server and installs it over itself, so staff never leave Tamanu to update. The update is blocking: the device cannot be used until it completes.

Installing over the same app preserves its data, so changes recorded on the device but not yet synced survive the update and are pushed on the next sync. The device cannot sync them first, because central rejects an out-of-date client outright.

## Detecting an out-of-date app

Central and facility servers reject a client below their minimum supported version and include the address the client should update from, taken from the `metaServer.updateUrls.mobile` setting with the minimum version substituted into it.

- [ ] Any rejection of the mobile app for being below the minimum supported version starts the update, wherever the app is and whatever the user is doing — at sign-in, during a sync, or on any other call to central.
- [ ] Starting the update signs the user out, so that signing in again after the update re-checks the version.
- [ ] The update takes over from whatever screen the user was on, including a part-filled form, whose unsaved input is discarded.
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

## Updating Tamanu screen

A single screen covers the whole update, from the permission setup through downloading to installing. It replaces the app entirely while an update is in progress, and the only ways off it are a completed install or the manual fallback.

- [ ] The screen is titled "Updating Tamanu" and explains that the app is updating itself and the device cannot be used until it finishes.
- [ ] The screen shows download progress as a proportion of the package's total size.
- [ ] The screen shows a distinct installing stage once the download completes and the package has been handed to Android.
- [ ] The screen warns, before the install begins, that Tamanu will close and the user will need to open it again.
- [ ] The screen is shown whenever the app starts while an update is outstanding, so closing or restarting the app does not get past it.

## Permission setup

Installing a package requires the device to allow Tamanu to install apps, which is granted once per device through an Android settings screen. The app asks for it at the point an update is needed rather than during onboarding, so a device that never updates is never asked.

- [ ] When an update starts and the device does not already allow Tamanu to install apps, the screen explains why the permission is needed and offers to open the Android settings screen that grants it.
- [ ] Returning from the settings screen with the permission granted continues the update.
- [ ] Declining the permission re-shows the explanation and the offer to grant it.
- [ ] Declining a second time offers the manual fallback.
- [ ] A device that already allows Tamanu to install apps goes straight to downloading, with no permission step.
- [ ] Android's own confirmation of the first install is left to the user to accept; the app does not attempt to bypass or pre-empt it.

## Downloading

The download is built for the connections Tamanu is used on: slow, interrupted, and sometimes metered. It resumes rather than restarting, and retries on its own.

- [ ] The download runs on whatever connection is available, including a metered one, since the device is unusable until it completes.
- [ ] An interrupted download resumes from where it stopped, including after the app is closed and reopened.
- [ ] Before downloading, the app checks there is enough free space for the package and for installing it. If there is not, the screen says so and names the space needed.
- [ ] A failed download is retried automatically, with a longer gap before each successive attempt.
- [ ] The screen offers "Try again now", which starts the next attempt immediately rather than waiting out the gap.
- [ ] A download that completes at a size other than the one declared is discarded and retried rather than installed.

## Manual fallback

Some failures cannot be retried away: a device short of space, a permission the user will not grant, or a connection that never holds long enough. In those cases the screen offers the address the package can be downloaded from, so the device can still be updated by hand or from another device.

- [ ] After three failed download attempts, the screen offers the address the package can be downloaded from, alongside continuing to retry automatically.
- [ ] Not enough free space offers the same address, without waiting for three attempts.
- [ ] An app still rejected for its version immediately after installing an update offers the same address rather than starting another update, so a device cannot loop on a package that does not satisfy its server.
- [ ] The screen explains that the manual route installs the same update, and that the user should contact their administrator if they cannot complete it.

## Installing and reopening

Android closes Tamanu to install the update and leaves it closed. A notification brings the user back.

- [ ] The downloaded package is handed to Android to install once the download is verified.
- [ ] After a successful install, a notification tells the user Tamanu has been updated and opens the app when tapped.
- [ ] The app asks for permission to post notifications as part of the update, where the device requires it.
- [ ] Where notification permission is refused or unavailable, the update still proceeds and the user relies on the warning shown before the install.
- [ ] A failed install returns the user to the screen, which retries the install and falls back to the manual address as a failed download does.
- [ ] The downloaded package is deleted once it has been installed.
- [ ] Opening the updated app leads to the sign-in screen, and signing in syncs the changes the device was holding.
