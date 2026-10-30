# In-app APK download and silent update

Scenarios verifying V11 against `specs/platform/mobile-app-updates.md` (MUPD). Much of this can only
be checked on a device: the install permission, the package installer and the post-install
notification have no meaningful emulation in unit tests.

## Detecting an out-of-date app

- [ ] A sync rejected for the app's version leaves staff where they are, still signed in, with
      nothing part-filled lost (verifies spec: MUPD)
- [ ] Signing in to a server that rejects the app's version gets staff in, with the update starting
      behind them (verifies spec: MUPD)
- [ ] Sync stops running while an update is outstanding, rather than retrying into the same
      rejection (verifies spec: MUPD)
- [ ] Closing and reopening the app resumes the outstanding update rather than losing it (verifies
      spec: MUPD)
- [ ] An app rejected for being above the server's maximum version shows the incompatible-version
      error and does not start an update (verifies spec: MUPD)

## Update endpoint

- [ ] The app requests the package with its own branding appended to the address central supplied
      (verifies spec: MUPD)
- [ ] The endpoint serves the highest patch release in the requested minor line (verifies spec: MUPD)
- [ ] A request for a version or branding with no package is refused, and the app treats it as a
      failure it cannot retry out of (verifies spec: MUPD)
- [ ] The package is served over HTTPS (verifies spec: MUPD)

## The update banner

- [ ] While downloading, the banner shows the percentage and that sync is paused (verifies spec: MUPD)
- [ ] Once downloaded, the banner offers Install (verifies spec: MUPD)
- [ ] Closing the banner hides it, and it returns on next arriving at the home screen (verifies
      spec: MUPD)
- [ ] The banner does not block anything on the screen beneath it (verifies spec: MUPD)

## Sync tab

- [ ] While an update is outstanding the Sync tab says sync is paused and does not offer Manual sync
      (verifies spec: MUPD)
- [ ] It shows the download percentage while downloading, and Install update once ready (verifies
      spec: MUPD)
- [ ] Install update is available on the Sync tab after the home screen banner has been closed
      (verifies spec: MUPD)
- [ ] The last successful sync time stays visible while paused (verifies spec: MUPD)
- [ ] The banner and the Sync tab report the same download, not two of them

## Installing

- [ ] Install from the banner opens the confirmation over whatever screen staff are on (verifies
      spec: MUPD)
- [ ] Install from the Sync tab opens the same confirmation (verifies spec: MUPD)
- [ ] Cancel, the cross, and tapping outside all install nothing and leave the banner as it was
      (verifies spec: MUPD)
- [ ] Install and close shows the installing message, which cannot be dismissed (verifies spec: MUPD)
- [ ] A successful install replaces the app, and the notification opens it when tapped (verifies
      spec: MUPD)
- [ ] Refusing the notification permission still lets the update finish (verifies spec: MUPD)
- [ ] Opening the updated app leads to sign-in, and the first sync sends everything recorded while
      sync was paused (verifies spec: MUPD)
- [ ] The downloaded package is gone from the device after a successful install (verifies spec: MUPD)

## Permission setup

- [ ] A device that does not allow Tamanu to install apps gets the asking banner with Allow
      (verifies spec: MUPD)
- [ ] Allow opens the Android settings screen; returning with it granted returns the banner to its
      downloading or ready state (verifies spec: MUPD)
- [ ] Returning without granting leaves the banner asking (verifies spec: MUPD)
- [ ] Android's first-install confirmation is shown, and later updates on that device skip it
      (verifies spec: MUPD)
- [ ] Cancelling Android's first-install confirmation returns the banner to ready (verifies
      spec: MUPD)

## Downloading

- [ ] A download interrupted by losing the connection resumes rather than starting again (verifies
      spec: MUPD)
- [ ] A download interrupted by closing the app resumes on the next launch (verifies spec: MUPD)
- [ ] A device without room for the package and its install is told so before the download starts
      (verifies spec: MUPD)
- [ ] A failed download retries automatically, with a longer gap before each attempt (verifies
      spec: MUPD)
- [ ] A download that finishes at a size other than the one declared is discarded, not installed
      (verifies spec: MUPD)
- [ ] A download runs on a metered connection without asking (verifies spec: MUPD)
- [ ] The manual download address appears after three failed attempts, and immediately when there
      is not enough space (verifies spec: MUPD)
- [ ] A server that ignores the range request restarts the download cleanly rather than appending to
      what was already on disk

## When the install doesn't finish

- [ ] An install Android rejects shows "Update not installed" with Try again and Cancel (verifies
      spec: MUPD)
- [ ] Try again starts the install again; Cancel returns to the ready banner (verifies spec: MUPD)
- [ ] An install interrupted by a restart leaves the device on its existing version with the update
      still waiting (verifies spec: MUPD)
- [ ] An app still rejected immediately after installing shows the not-accepted message and does not
      download again (verifies spec: MUPD)
- [ ] A device that updated successfully and later falls behind again starts a normal update, rather
      than reading the earlier install as a failure (verifies spec: MUPD)

## Devices

Outstanding from the spike, and the reason this card exists in the form it does.

- [ ] Android 12, the minimum the app supports
- [ ] Android 13 and 14 (covered by the spike, worth re-running against the built flow)
- [ ] A real IRD-style tablet, on a connection as poor as a campsite's
