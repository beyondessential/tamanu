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

- [x] Add the patient photo attachment reference column + migration (server Sequelize +
      mobile TypeORM), sync direction BIDIRECTIONAL.
      - `patient_additional_data.profile_photo_attachment_id`, nullable, deliberately not an
        FK (attachments never reach facility servers).
- [x] Extend `writeToPatient` / `PATIENT_DATA_FIELD_LOCATIONS` to allow writing the photo
      field; wire `ProfilePhoto` capture to it.
      - Added `profilePhoto` field location, widened `ACTION_DATA_ELEMENT_TYPES` and
        `getFieldsToWrite` to include Photo questions, and threaded the resolved attachment id
        through so the patient gets the id rather than the raw image.
      - Hardened `getFieldsToWrite`'s config parsing: photo questions usually carry no config,
        and the raw `JSON.parse` would have thrown on every such submission.
      - Program importer now accepts `writeToPatient` on Photo questions.
- [x] Update `patientProfilePicture` resolution to read the field first, fall back to the
      latest `ProfilePhoto` answer.
- [x] Sidebar avatar: photo display + hover change-menu (upload / take photo / remove),
      propagation-safe, write-Patient gated, uploading/error states.
      - The avatar sat inside a MUI `Button` that navigates, so its controls would have been
        nested interactive elements. The navigating control is now an overlay button behind the
        content, leaving the avatar a sibling rather than a descendant.
- [x] Remove-photo action clears the reference.
- [x] ID card reads the resolved photo.
      - No change needed: it already consumes `patient/:id/profilePicture`, so it inherits the
        new resolution.
- [x] Mobile patient cards/tiles pass the resolved image to `UserAvatar`.
- [x] Tests: endpoint (upload/remove/permission/resolution+fallback), survey write-to-photo.
      - Written; see the caveat in the test cases about the DB-backed suites not being runnable
        locally.

## Outstanding

- [ ] Run the database-backed suites (`central-test`, `facility-test`) on a machine with a test
      database. They could not be executed here: local Postgres needs credentials that weren't
      available.
- [ ] Regenerate the dbt source models for the new column (`npm run dbt-generate-model`, fill in
      the new TODOs, `npm run dbt-check-todos`) — this needs a live database, so it could not be
      done here. CI fails on outstanding TODOs.
- [ ] Decide whether the mobile patient list should fetch photos lazily. Each photo is fetched
      from central on first display and cached per attachment for the session, which is fine for
      a handful of rows but worth revisiting for long lists.
