# Patient photo — plan

Working notes for implementing the Patient photo spec (`specs/patient/photo.md`).

## Technical notes from the interview

- **Where the reference lives.** The patient record needs a photo-attachment reference
  that syncs. `PatientAdditionalData` (1:1 with patient, `getOrCreateForPatient`) is the
  natural home, matching the existing extension-field pattern; the image bytes stay as an
  `Attachment` on central (unchanged — attachments push to central, never pull to
  facility).

- **Extend the write-to-patient mechanism.** Today `writeToPatient` only targets scalar
  fields in `PATIENT_DATA_FIELD_LOCATIONS` (`packages/constants/src/surveys.ts`), and the
  `Photo` question type materialises an `Attachment` id into the answer body
  (`getBodyForAnswer` in `SurveyResponse.ts`). Unifying means letting a `ProfilePhoto`
  capture land its attachment id on the new patient photo field. Keep the mobile copy of
  `SurveyResponse.ts` in sync.

- **Read precedence.** Resolve the shown photo as: patient photo reference → most recent
  `ProfilePhoto` survey answer (legacy fallback) → initials. The facility
  `GET /:id/profilePicture` endpoint (`patientProfilePicture.js`) already does the survey
  lookup + central fetch; it should read the new field first and keep the survey lookup as
  fallback. ID card (`IDCardPrintout.jsx`) and the sidebar both consume this.

- **Avatar click vs navigate.** The sidebar avatar sits inside `PatientButton`, which
  navigates to the patient on click (`PatientCoreInfo.jsx`). The change-photo control must
  be its own interactive element that stops propagation so setting a photo doesn't trigger
  navigation.

- **Upload path.** Reuse `uploadAttachment.js` (facility POSTs the file to central,
  returns an attachment id), then set the patient field. Needs central connectivity;
  surface the failure when offline.

- **Reused pieces.** Webcam capture: `PhotoCaptureModal.jsx`; file constraints:
  `FILTER_PHOTOS` / `DOCUMENT_SIZE_LIMIT`. Mobile display: `UserAvatar` already takes an
  optional `image` (consumers currently pass `null` with a TODO).

## Build checklist

- [ ] Add the patient photo attachment reference column + migration (server Sequelize +
      mobile TypeORM), sync direction BIDIRECTIONAL.
- [ ] Extend `writeToPatient` / `PATIENT_DATA_FIELD_LOCATIONS` to allow writing the photo
      field; wire `ProfilePhoto` capture to it.
- [ ] Update `patientProfilePicture` resolution to read the field first, fall back to the
      latest `ProfilePhoto` answer.
- [ ] Sidebar avatar: photo display + hover change-menu (upload / take photo / remove),
      propagation-safe, write-Patient gated, uploading/error states.
- [ ] Remove-photo action clears the reference.
- [ ] ID card reads the resolved photo.
- [ ] Mobile patient cards/tiles pass the resolved image to `UserAvatar`.
- [ ] Tests: endpoint (upload/remove/permission/resolution+fallback), survey write-to-photo.
