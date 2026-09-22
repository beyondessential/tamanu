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
      - Clearing the reference alone wasn't enough: a null reference is indistinguishable from
        "never set", so removal fell straight back to the legacy survey photo and the image
        returned. Added `patient_additional_data.profile_photo_removed` (server + mobile) so
        removal is recorded distinctly, and the resolution consults it before falling back.
- [x] ID card reads the resolved photo.
      - No change needed: it already consumes `patient/:id/profilePicture`, so it inherits the
        new resolution.
- [x] Mobile patient cards/tiles pass the resolved image to `UserAvatar`.
      - Mobile now applies the same precedence as the facility endpoint, using the existing
        `SurveyResponseAnswer.getLatestAnswerForPatient` helper for the legacy fallback. It
        previously read only the record field, so legacy-photo patients showed initials on
        mobile while web and the ID card showed the photo.
- [x] Tests: endpoint (upload/remove/permission/resolution+fallback), survey write-to-photo.
      - Written; see the caveat in the test cases about the DB-backed suites not being runnable
        locally.

## Review round 1 corrections

- **The survey half couldn't actually be configured.** `importRows` picks a validation schema by
  `SSC<type>`; there was no `SSCPhoto`, so Photo rows fell back to the generic schema whose
  config is `noUnknown()` and any `writeToPatient` was rejected. Allowing the key through the
  *sanitiser* (`programDefinition.js`) was not enough. Added `SSCPhoto`, which also constrains a
  Photo question to writing only the profile photo.
- **The photo field is no longer an ordinary PatientData location.** It stayed in
  `PATIENT_DATA_FIELD_LOCATIONS` (so the runtime write still resolves) but is filtered out of the
  importer's read/write field lists, so a PatientData question can neither display the attachment
  id as text nor write a free-text answer into it. That also reverted the importer test's expected
  messages to their original text — the earlier edit to them was papering over this.
- `PATIENT_PROFILE_PHOTO_FIELD` and `LEGACY_PROFILE_PHOTO_QUESTION_CODE` now live in
  `@tamanu/constants` instead of being magic strings in three places.
- Mobile hook: cleared stale state between patients (it could show one patient's face against
  another's name), capped retries to one attempt, bounded the image cache, and encoded the
  attachment id into the request path.
- Upload now validates the mime type **before** sending to central, so a rejected type doesn't
  leave an orphaned attachment there. The client-side `accept` was the only check.
- A survey capture clears `profilePhotoRemoved`, so a record can't hold both a photo and a
  marker saying it was removed.

## Review round 2 corrections

- **One definition of an accepted photo.** `PHOTO_MIME_TYPES` / `PHOTO_FILE_EXTENSIONS` now live in
  `@tamanu/constants`; the server check, the sidebar file input and `FILTER_PHOTOS` (survey and
  document photo fields) all derive from them, instead of four divergent lists. Settled on
  jpeg-only, which is what `FILTER_PHOTOS` already allowed and what the spec asks for — the
  earlier jpeg+png list was a unilateral widening.
- **Authorise against the loaded patient.** POST and DELETE now `checkPermission('write', patient)`
  rather than the class, matching `patient.js`, so per-patient CASL conditions apply.
- **The GET no longer sits through the sync backoff.** It defaulted to 15 attempts over ~2
  minutes; since it runs on every patient view and falls back to initials, it is capped to one
  attempt, as the mobile hook and `uploadAttachment` already are.
- **The legacy lookup resolves the question first.** `program_data_elements` is small, so a
  deployment that never configured a ProfilePhoto question now skips the join over
  `survey_response_answers` entirely rather than running it on every patient view.
- **Mobile hook rebuilt on react-query**, replacing a hand-rolled LRU map, manual cancellation and
  an effect. That gives dedupe across the rows of a list, caching of the "no photo" outcome (the
  common case, previously re-queried on every remount), and removes the stale-LRU and
  unbounded-growth problems.
- **`staleTime` is finite.** `Infinity` assumed the only writes were the two sidebar actions that
  invalidate the query; a survey-captured photo writes the same field with no hook, so the cache
  has to heal on its own.
- The photo rendering moved out of the shared `PatientInitialsIcon` into `PatientPhotoAvatar`, so
  the shared component is untouched by this card again.

## Review round 3 corrections

- **A blank photo answer wiped the patient's photo.** `getBodyForAnswer` returns null for an
  unanswered Photo question, and that null was written straight onto the patient — so submitting
  a survey containing a configured ProfilePhoto question *without* taking a photo cleared one set
  from the sidebar, and because the removal marker was untouched the read path then resurfaced
  the old legacy photo. `getFieldsToWrite` now skips an empty photo answer (server and mobile).
  Covered by a regression test that was confirmed to fail without the fix.
- Mobile hook: narrowed the `PatientAdditionalData` read to the two columns it needs (the model
  eagerly joins 18 reference-data relations), bounded concurrent central fetches, and shortened
  the cache lifetime since entries are whole images.
- `PatientPhotoAvatar`: the propagation guards were dead once the avatar became a sibling of the
  nav button rather than a descendant, and the comments still described the old nesting. Dropped
  them, and replaced two hand-rolled save/remove blocks with `useMutation`, which removed the
  `exhaustive-deps` disable and its stale-closure hazard.
- `uploadAttachment` returns a 400 rather than failing deep in `fs.statSync` when a request
  carries no file part.
- Restored `exported-refdata-all-table.xlsx`: it is a generated test artifact that the reference
  data importer suite rewrites, and it had been auto-committed into this PR.

## Outstanding

- [x] Run the database-backed suites. The machine's own Postgres wants a password, but a
      throwaway cluster works and touches nothing: `initdb -D /tmp/pg -A trust -U tamanu`, set
      `port = 55432`, `pg_ctl start`, create the `tamanu-*-test` databases, and point each
      package at it with a (gitignored) `config/local.json5`. Remember to remove those files and
      stop the cluster afterwards.
- [x] Regenerate the dbt source models for the new columns. Note the generator refuses to run
      while `database/` is dirty, and writes `TODO` into the `.md` that `dbt-check-todos` then
      fails on, so the descriptions have to be filled in by hand. Don't hand-write the `.yml`:
      it adds `data_tests: - not_null` for NOT NULL columns, which is easy to miss.
- [ ] Revisit whether the legacy survey photo should be resolved at read time at all. Both
      review findings traced to it: the precedence now has to be duplicated on every platform
      that shows a photo, and it forced a `profile_photo_removed` marker to tell "removed" from
      "never set". Backfilling legacy photos into the column once (the "Migrate them" option
      from the interview) would delete that whole class of problem, at the cost of a data
      migration. Worth weighing before more surfaces start showing photos.
- [ ] Mobile patient lists resolve photos per row. `PatientSectionList` renders every result in
      a plain `ScrollView` with no virtualisation and `ViewAll` fetches up to 100 patients, so a
      search can fire 100 record lookups, 100 legacy-answer joins and 100 central fetches at
      once. Retries are now capped at one attempt and the cache is bounded, which takes the
      sting out, but the real fix is resolving a page's photos in one query in the list
      container — or removing the per-row legacy lookup entirely, which the backfill above would
      do.
- [ ] No E2E coverage for the sidebar photo flows (upload, remove, and that clicking the name
      still navigates while the avatar's control does not). These need a running stack, so they
      were not added here; the test-case file lists them unticked.
