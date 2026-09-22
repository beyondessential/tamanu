# Patient photo — test cases

Scenarios verifying the patient photo (spec: PHOTO). Ticked cases have an automated test
covering them.

> The database-backed suites (facility endpoint, central survey model) were written but could
> not be executed locally: this machine's Postgres needs credentials that weren't available, so
> no test database could be created. They need a run on a machine with one before being trusted.
> The web unit tests were run and pass.

## Showing the photo

- [x] A patient with no photo is shown as their initials. — verifies spec: PHOTO
- [x] A patient with a photo is shown that photo in place of the initials. — verifies spec: PHOTO
- [x] A photo that can't be loaded falls back to the initials. — verifies spec: PHOTO
- [ ] The sidebar avatar shows the photo when the central server is reachable, and the initials
      when it isn't. — verifies spec: PHOTO
- [ ] A photo wider or taller than the avatar is centre-cropped rather than squashed.
      — verifies spec: PHOTO
- [ ] The printed ID card shows the photo held on the patient's record. — verifies spec: PHOTO
- [ ] Mobile patient cards and tiles show the photo, falling back to initials offline.
      — verifies spec: PHOTO

## Setting the photo

- [ ] Uploading an image file from the sidebar sets it as the patient's photo, replacing any
      existing one. — verifies spec: PHOTO
- [ ] Capturing an image from the device camera sets it as the patient's photo.
      — verifies spec: PHOTO
- [ ] While an image is uploading the avatar shows an in-progress state and can't be changed
      again. — verifies spec: PHOTO
- [ ] An upload that fails reports why and leaves the existing photo in place.
      — verifies spec: PHOTO
- [ ] Uploading with the central server unreachable fails and says so. — verifies spec: PHOTO
- [ ] A file over the size limit is rejected. — verifies spec: PHOTO
- [x] Setting a photo is refused to a user without permission to write the patient.
      — verifies spec: PHOTO

## Removing the photo

- [x] Removing the photo clears the reference held against the patient. — verifies spec: PHOTO
- [x] Removing is refused to a user without permission to write the patient, and the photo is
      left as it was. — verifies spec: PHOTO
- [ ] The remove option is offered only when the patient has a photo. — verifies spec: PHOTO
- [ ] After removal the avatar returns to the initials. — verifies spec: PHOTO

## Capturing through a survey

- [x] A photo question configured to write to the patient's photo sets the patient's photo on
      submission. — verifies spec: PHOTO
- [x] The id of the attachment created for the photo is what gets stored, not the raw image.
      — verifies spec: PHOTO
- [x] A photo question with no write-to-patient config leaves the patient's photo alone.
      — verifies spec: PHOTO
- [ ] A photo question submitted from mobile writes to the patient's photo the same way.
      — verifies spec: PHOTO

## Existing survey photos

- [x] A patient with no photo on their record and no survey photo reports no picture.
      — verifies spec: PHOTO
- [ ] A patient with no photo on their record falls back to their most recent ProfilePhoto
      survey answer. — verifies spec: PHOTO
- [ ] A photo set on the record is shown in preference to an earlier ProfilePhoto survey
      answer. — verifies spec: PHOTO

## Sidebar interaction

- [ ] Clicking the patient's name still navigates to the patient. — verifies spec: PHOTO
- [ ] Clicking the avatar's change-photo control opens the menu without navigating.
      — verifies spec: PHOTO
- [ ] A user without permission to write the patient sees no change-photo control.
      — verifies spec: PHOTO

## Migration and sync

- [ ] The new column is added and removed cleanly by the server migration, up and down.
- [ ] The new column is added and removed cleanly by the mobile migration, up and down.
- [ ] A photo set at one facility appears for the same patient at another once synced.
