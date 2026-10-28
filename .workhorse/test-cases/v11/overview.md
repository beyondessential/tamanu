# In-app APK download and silent update

Scenarios verifying V11 against `specs/platform/mobile-app-updates.md` (MUPD). Much of this can only
be checked on a device: the install permission, the package installer and the post-install
notification have no meaningful emulation in unit tests.

## Detecting an out-of-date app

- [ ] Signing in to a server that rejects the app's version shows the Updating Tamanu screen rather
      than an alert (verifies spec: MUPD)
- [ ] A background sync rejected for the app's version takes over with the Updating Tamanu screen
      from wherever the user was (verifies spec: MUPD)
- [ ] A part-filled form is discarded when the update takes over, and the user is signed out
      (verifies spec: MUPD)
- [ ] Closing and reopening the app part way through an update returns to the Updating Tamanu
      screen, not to sign-in (verifies spec: MUPD)
- [ ] An app rejected for being above the server's maximum version shows the incompatible-version
      error and does not start an update (verifies spec: MUPD)
- [ ] Signing in successfully after an update clears the outstanding update, so a later launch goes
      straight to sign-in (verifies spec: MUPD)

## Update endpoint

- [ ] The app requests the package with its own branding appended to the address central supplied
      (verifies spec: MUPD)
- [ ] The endpoint serves the highest patch release in the requested minor line (verifies spec: MUPD)
- [ ] A request for a version or branding with no package is refused, and the app treats it as a
      failure it cannot retry out of (verifies spec: MUPD)
- [ ] The package is served over HTTPS (verifies spec: MUPD)

## Permission setup

- [ ] A device that does not allow Tamanu to install apps is shown the explanation and the offer to
      grant it (verifies spec: MUPD)
- [ ] Returning from the Android settings screen with the permission granted continues the update
      (verifies spec: MUPD)
- [ ] Declining once re-shows the explanation; declining a second time offers the manual address
      (verifies spec: MUPD)
- [ ] A device that already allows installing goes straight to downloading, with no permission step
      (verifies spec: MUPD)
- [ ] Android's own first-install confirmation is shown and, once accepted, later updates on that
      device install without a prompt (verifies spec: MUPD)

## Downloading

- [ ] Download progress is shown as a proportion of the package's declared size (verifies spec: MUPD)
- [ ] A download interrupted by losing the connection resumes from where it stopped rather than
      starting again (verifies spec: MUPD)
- [ ] A download interrupted by closing the app resumes on the next launch (verifies spec: MUPD)
- [ ] A device without room for the package and its install is told so before the download starts
      (verifies spec: MUPD)
- [ ] A failed download retries automatically, with a longer gap before each attempt (verifies
      spec: MUPD)
- [ ] "Try again now" starts the next attempt without waiting out the gap (verifies spec: MUPD)
- [ ] A download that finishes at a size other than the one declared is discarded, not installed
      (verifies spec: MUPD)
- [ ] A download runs on a metered connection without asking (verifies spec: MUPD)
- [ ] A server that ignores the range request restarts the download cleanly rather than appending to
      what was already on disk

## Manual fallback

- [ ] The manual download address appears after three failed attempts, with automatic retries
      continuing (verifies spec: MUPD)
- [ ] Not enough free space offers the manual address immediately (verifies spec: MUPD)
- [ ] An app still rejected immediately after installing an update offers the manual address instead
      of starting another update (verifies spec: MUPD)

## Installing and reopening

- [ ] The screen warns the app will close before the install begins (verifies spec: MUPD)
- [ ] A successful install replaces the app, and the notification opens it when tapped (verifies
      spec: MUPD)
- [ ] Refusing the notification permission still lets the update finish (verifies spec: MUPD)
- [ ] A failed install retries and falls back to the manual address as a failed download does
      (verifies spec: MUPD)
- [ ] The downloaded package is gone from the device after a successful install (verifies spec: MUPD)
- [ ] Data recorded but not synced before the update is still there afterwards, and syncs on the
      next sign-in (verifies spec: MUPD)

## Devices

Outstanding from the spike, and the reason this card exists in the form it does.

- [ ] Android 12, the minimum the app supports
- [ ] Android 13 and 14 (covered by the spike, worth re-running against the built flow)
- [ ] A real IRD-style tablet, on a connection as poor as a campsite's
