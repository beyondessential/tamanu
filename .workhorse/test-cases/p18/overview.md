# Remove Redux from the mobile app: test cases

The card is a behaviour-preserving refactor, so every case here is a check that something still works as it did. The one exception is marked.

Cases ticked under "Covered by automated tests" are exercised by jest specs in `packages/mobile`. Nothing has been run on a device or emulator yet, so every case under "On a device" is still owed.

## Covered by automated tests

### Stored state (`helpers/storedState.spec.ts`)

- [x] A plain JSON entry is read as it is
- [x] An entry written by redux-persist is unwrapped, including nested state and null values
- [x] A missing entry, an entry that does not parse, and an entry that is not an object all read as nothing stored
- [x] Writes land in the order the changes were made, and a failed write does not block the next
- [x] A read started ahead of time is handed to the next read, and the read after that goes to storage again
- [x] A read that storage has not answered after five seconds reads as nothing stored
- [x] A read waits for a write still in the queue, rather than reading what was there before it
- [x] The hook reads once however the initial state is passed, and stores every change after the read (`hooks/useStoredState.spec.tsx`)

### Session (`contexts/AuthContext.spec.tsx`, verifies spec: MSESS)

- [x] With nothing stored, the app starts signed out with the welcome introduction still to show
- [x] A stored session opens signed in and hands its tokens to the central server
- [x] A session stored by an earlier build through redux-persist opens signed in the same way
- [x] Stored tokens are handed to the central server when nobody is signed in to the screens
- [x] A user who last signed in offline reopens with their permissions loaded (the one behaviour change)
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

### Selected patient (`contexts/SelectedPatientContext.spec.tsx`, verifies spec: MSELP)

- [x] With nothing stored, no patient is selected
- [x] A stored selection is restored
- [x] A selection stored by an earlier build through redux-persist is restored, including an empty one
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

### Upgrade

- [ ] Install the previous build, sign in, dismiss the welcome introduction and select a patient. Install this build over it. The app opens signed in on the Patient tab with the same patient, and the welcome introduction does not show again
- [ ] Repeat with the previous build signed out. This build opens on the log in screen, and signing in goes straight to the home screen without the welcome introduction
- [ ] Repeat with the previous build signed out by inactivity. This build opens on the log in screen and a sync still runs in the background

### Session

- [ ] Sign in online on a fresh install: facility selection shows, then the welcome introduction, then the home screen
- [ ] Close the app fully and reopen it: it opens signed in on the home screen with no password asked for, and the sync that starts at launch completes
- [ ] Log out from the More screen: the log in screen shows. Sign in again: the home screen shows without the welcome introduction
- [ ] Sign in offline (aeroplane mode) as a user who has signed in online before
- [ ] After logging out, sign in offline, close the app and reopen it: screens that check permissions (patient home, program registry, lab requests) open without error (the one behaviour change)
- [ ] Leave the app untouched for 30 minutes: the log in screen shows with "Logged out due to inactivity"
- [ ] Background the app for over 30 minutes and return: the same
- [ ] On the log in screen while online, enter a wrong password: an error shows and the log in screen stays
- [ ] With sync stopped by a rejected session, reconnect with a wrong password: an error shows in the form and the user stays signed in. Reconnect with the right password: sync resumes on the same screen
- [ ] The user's name shows on the home screen, the More screen and the welcome introduction, and changes on all of them after signing in as someone else

### Selected patient

- [ ] Select a patient from search results: their home screen opens and they appear first in recently viewed
- [ ] Select a patient from the recently viewed list in search, and from the recently viewed tiles on the home screen
- [ ] Go back from the patient's home screen: the Patient tab shows search again
- [ ] Open search from the home screen with a patient selected: the selection is cleared
- [ ] Register a new patient: the confirmation screen shows their name and display id, and "Start Visit" leads to their home screen
- [ ] Edit the selected patient's details: the patient home screen shows the saved details
- [ ] Record vitals, a vaccine, a program form, a referral, a lab request, a diagnosis and a prescription against the selected patient: each saves against that patient and their name shows in each screen's header
- [ ] Submit a program form that writes back to patient fields: the patient home screen shows the new values straight away
- [ ] Close and reopen the app with a patient selected: the Patient tab opens on that patient
- [ ] Log out and sign in as another user with a patient selected: the same patient is still selected
