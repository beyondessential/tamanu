---
id: PHOTO
---

# Patient photo

A photo held against a patient's profile, shown in place of the initials avatar. The
photo is set from the patient details sidebar or captured through a survey, and is read
back wherever the patient is represented.

## The photo

- [ ] A patient has at most one profile photo at a time.
- [ ] The photo is stored as an attachment, and the patient record holds a reference to
      that attachment. The reference syncs with the patient like any other patient field.
- [ ] The attachment's image bytes live on the central server and are fetched live when
      the photo is displayed, so a set photo is shown only while the central server is
      reachable. Where the photo cannot be loaded, the initials avatar is shown.
- [ ] A patient with no photo is represented by the initials avatar (first and last
      initial), as is a patient whose photo is still loading.
- [ ] The image is stored as uploaded; each place that shows it centre-crops to fit its
      avatar shape rather than the image being cropped when set.

## Setting the photo from the sidebar

The patient details sidebar shows the patient's avatar next to their name. This is where
a clinician sets, replaces, or removes the photo.

- [ ] Hovering the avatar reveals a control to change the photo; activating it offers
      uploading an image file and capturing one from the device camera.
- [ ] Choosing a file or capturing an image uploads it and sets it as the patient's
      photo, replacing any existing photo.
- [ ] Setting or removing a photo is available to a user with permission to write the
      patient, and requires no encounter.
- [ ] While an image is uploading, the avatar shows an in-progress state and cannot be
      changed again until it settles.
- [ ] An upload that fails reports why, and the patient's existing photo is left as it
      was.
- [ ] The image formats accepted and the size limit are those already used for survey and
      document photos.
- [ ] Uploading a photo needs the central server to be reachable; where it is not, the
      attempt fails and says so.

## Removing the photo

- [ ] The change-photo control offers removing the current photo, shown only when the
      patient has one.
- [ ] Removing the photo clears the patient's photo reference, and the avatar returns to
      the initials.
- [ ] A patient whose photo has been removed has no photo, including where they have an
      earlier `ProfilePhoto` survey photo that would otherwise be shown.

## Capturing through a survey

A survey question that captures a patient photo writes it to the patient's photo,
rather than living only as a survey answer. Survey capture and the sidebar upload set the
same photo.

- [ ] A photo-capture survey question configured to write to the patient's photo sets the
      patient's photo reference to the captured image on submission.
- [ ] The most recently set photo — whether from a survey or the sidebar — is the one
      shown.

## Existing survey photos

Before this feature, a patient's photo was held only as a survey answer for a photo
question conventionally coded `ProfilePhoto`, read back for the printed ID card. Those
photos keep showing until a photo is set or removed on the patient's record.

- [ ] Where a patient has never had a photo set or removed on their record, their most
      recently answered `ProfilePhoto` survey photo is shown instead, wherever the patient
      photo appears.
- [ ] Once a photo is set on the patient's record, that photo is shown in preference to
      any earlier `ProfilePhoto` survey answer.
- [ ] Setting a photo on a patient whose photo was previously removed shows the new photo.

## Where the photo appears

- [ ] The patient details sidebar avatar shows the photo.
- [ ] The printed patient ID card shows the photo.
- [ ] The mobile app's patient cards and tiles show the photo.
- [ ] Each of these falls back to the initials avatar when the patient has no photo or the
      photo cannot be loaded.
