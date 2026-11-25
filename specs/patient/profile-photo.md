---
id: PPHOTO
---

# Patient profile photo

Applies to the photo that identifies a patient on their record: adding it when the patient is registered, showing it in the patient details sidebar, and changing it afterwards.

## Taking or choosing a photo

- A profile photo is captured with the photo question used in forms. The user either takes a photo with the device's camera or uploads an image file.
- A photo taken with the camera is shown for review before it is used, and the user can retake it or confirm it.
- An uploaded image is a JPEG file within the deployment's maximum upload size. A larger file is refused with a message giving the limit, and the question is left as it was.
- A chosen photo is shown by its file name, with a control that clears it. Clearing returns the question to its choice of camera or upload.

> [!NOTE]
> Reusing the photo question keeps one way of taking a photo across Tamanu, so staff who already capture photos in forms meet nothing new, and the camera and upload rules stay in one place.

## Registering a patient

- The Add new patient form asks for a profile photo at the end of its General information section.
- The profile photo is optional, and a patient can be registered without one.
- The photo is saved to the patient's record when the patient is registered.

## In the patient details sidebar

- The patient details sidebar shows the profile photo beside the patient's name, sex, date of birth and identifier.
- A patient without a profile photo shows their initials in its place.

## Changing the profile photo

- The photo, or the initials in its place, carries an edit control for users permitted to edit the patient's details.
- The edit control opens the Change profile photo modal, which holds the photo question.
- For a patient who already has a profile photo, the question opens showing that photo's file name and its clear control.
- Save is available once the question differs from the patient's current photo: a new photo has been chosen, or an existing photo has been cleared.
- Saving with a new photo replaces the patient's profile photo, and the sidebar shows the new photo straight away.
- Saving with the question cleared removes the patient's profile photo, and the sidebar shows their initials in its place.
- Cancel closes the modal and leaves the profile photo as it was.
