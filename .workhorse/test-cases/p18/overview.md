# Remove Redux from the mobile app: test cases

The card is a behaviour-preserving refactor, so every case here is a check that something still works as it did. There are two exceptions: a user who signed in offline reopens with their permissions loaded (marked below), and an update from a build that kept this state in Redux starts afresh, because the state those builds stored is not read.

Cases ticked under "Covered by automated tests" are exercised by jest specs in `packages/mobile`. Cases under "On a device" are ticked as they pass on the emulator rig described in the plan's Device run section.

## Covered by automated tests

### Stored state (`helpers/storedState.spec.ts`)

- [x] A plain JSON entry is read as it is, including null values
- [x] A missing entry, an entry that does not parse, and an entry that is not an object all read as nothing stored
- [x] Writes land in the order the changes were made, and a failed write does not block the next
- [x] A read started ahead of time is handed to the next read, and the read after that goes to storage again
- [x] A read that storage has not answered after five seconds reads as nothing stored
- [x] A read waits for a write still in the queue, rather than reading what was there before it
- [x] The hook reads once however the initial state is passed, and stores every change after the read (`hooks/useStoredState.spec.tsx`)

### Session (`contexts/AuthContext.spec.tsx`, verifies spec: MSESS)

- [x] With nothing stored, the app starts signed out with the welcome introduction still to show
- [x] A stored session opens signed in and hands its tokens to the central server
- [x] Stored tokens are handed to the central server when nobody is signed in to the screens
- [x] A user who last signed in offline reopens with their permissions loaded (the one behaviour change)
- [x] A stored session whose user has no permissions on the device is ended before the first screen: tokens discarded, sync stopped, nobody signed in (verifies spec: MSIGN)
- [x] A logged out device with no permissions stored is left as it is
- [x] An offline sign-in holds the signing-in user's own permissions, not the previous user's (verifies spec: MSIGN)
- [x] A sign-in for a user with no permissions on the device is refused and leaves no session behind
- [x] A stored session that cannot be read starts signed out, and is left in storage as it is
- [x] Nothing renders, reaches the central server or is stored until the session has been read
- [x] A session read before the provider mounted is picked up without a second read
- [x] The session just read is not stored again, and is stored once it changes
- [x] Signing in online sets the user without their password, both tokens and the settings, starts a sync, and stores the session
- [x] Signing in offline sets the user and leaves the stored tokens as they were
- [x] Signing in before a facility is linked does not start a sync
- [x] Logging out discards both tokens, stops syncing, shows the log in screen, and keeps the user and welcome introduction state
- [x] A sign-out while the log in screen is showing leaves that screen as it is
- [x] An inactivity sign-out keeps the tokens and does not stop syncing
- [x] The welcome introduction stays marked as shown once it has been
- [x] A log in the central server refuses signs the device out, discarding its tokens and stopping sync
- [x] Reconnecting with a password signs in again as the same user and starts a sync
- [x] The first refused log in after a reconnect attempt leaves the user signed in, and the next one signs them out
- [x] The central server turning the app away for being out of date leaves the session as it is and records the update to fetch
- [x] The central server turning the app away for being too new leaves the session as it is and records no update

### Selected patient (`contexts/SelectedPatientContext.spec.tsx`, verifies spec: MSELP)

- [x] With nothing stored, no patient is selected
- [x] A stored selection is restored
- [x] An empty selection is restored as empty
- [x] Restoring a selection does not count as viewing the patient again
- [x] A stored selection that cannot be read starts with no patient selected, and is left in storage as it is
- [x] Nothing renders or is stored until the selection has been read
- [x] A selection read before the provider mounted is picked up
- [x] Selecting a patient stores the selection, and selecting another replaces it
- [x] Clearing the selection stores that it is empty
- [x] Selecting a patient puts them at the top of recently viewed and refreshes the list
- [x] A patient already in recently viewed moves to the top without appearing twice
- [x] Recently viewed keeps the 20 most recently selected patients
- [x] Selecting the patient already at the top, or clearing the selection, leaves recently viewed alone

### Screens and hooks

- [x] Submitting a form for the selected patient reloads the selection (`hooks/useSurveySubmitMutation.spec.tsx`)
- [x] Submitting for another patient, an unsaved submission, and a patient who can no longer be found all leave the selection alone
- [x] The new patient screen shows a patient selected in the same tick as the navigation to it, and keeps showing them after the selection is cleared (`registerPatient/NewPatientScreen.spec.tsx`)
- [x] Patient search still navigates and scans as before (`stacks/SearchPatientTabs.spec.tsx`)

## On a device

### Update from a build with Redux

The previous build is main without this card. It stores the session and the selected patient where this build does not look, so whatever state it is left in, this build starts as a fresh install does, apart from the facility the device is linked to, which is kept elsewhere. The plan's Device run section says how to get the builds and a server.

- [x] Install the previous build, sign in, dismiss the welcome introduction and select a patient. Install this build over it. The app opens on the log in screen, and signing in online leads into the welcome introduction, then the home screen, with no patient selected

### Session

- [ ] Sign in online on a fresh install: facility selection shows, then the welcome introduction, then the home screen
- [x] Close the app fully and reopen it: it opens signed in on the home screen with no password asked for, and the sync that starts at launch completes
- [x] Log out from the More screen: the log in screen shows. Sign in again: the home screen shows without the welcome introduction
- [x] Sign in offline (aeroplane mode) as a user who has signed in online before
- [x] After logging out, sign in offline, close the app and reopen it: screens that check permissions (patient home, program registry, lab requests) open without error (the one behaviour change)
- [ ] Leave the app untouched for 30 minutes: the log in screen shows with "Logged out due to inactivity"
- [ ] Background the app for over 30 minutes and return: the same
- [x] On the log in screen while online, enter a wrong password: an error shows and the log in screen stays
- [ ] Against a central server that requires a newer app, sync: the user stays signed in, the update banner shows on the home screen, and the selected patient is still selected
- [ ] With sync stopped by a rejected session, reconnect with a wrong password: an error shows in the form and the user stays signed in. Reconnect with the right password: sync resumes on the same screen
- [x] The user's name shows on the home screen, the More screen and the welcome introduction, and changes on all of them after signing in as someone else

### Selected patient

- [x] Select a patient from search results: their home screen opens and they appear first in recently viewed
- [x] Select a patient from the recently viewed list in search, and from the recently viewed tiles on the home screen
- [x] Go back from the patient's home screen: the Patient tab shows search again
- [x] Open search from the home screen with a patient selected: the selection is cleared
- [x] Register a new patient: the confirmation screen shows their name and display id, and "Start Visit" leads to their home screen
- [x] Edit the selected patient's details: the patient home screen shows the saved details
- [ ] Record vitals, a vaccine, a program form, a referral, a lab request, a diagnosis and a prescription against the selected patient: each saves against that patient and their name shows in each screen's header
- [ ] Submit a program form that writes back to patient fields: the patient home screen shows the new values straight away
- [x] Close and reopen the app with a patient selected: the Patient tab shows that patient
- [x] Log out and sign in as another user with a patient selected: the same patient is still selected
