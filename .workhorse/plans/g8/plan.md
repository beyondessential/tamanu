# Field filtering on simplePut and simplePost

## Approach

`simplePatch` already required a nonempty `allowedFields` and validated the body against it.
The two guards it used were generalised into `requireAllowedFields` and
`validateAllowedFields`, shared by all three helpers, and `allowedFields` is now required on
`simplePut` and `simplePost` too. Because the guard throws while routes are being
registered, a new call site that forgets it fails at boot rather than shipping a hole.

## Filter rather than reject

`simplePatch` refuses a body containing anything outside `allowedFields`, which is right for
a hand-built delta. `simplePut` and `simplePost` filter instead.

A PUT body is the whole record the client last read: the web reads a record, spreads it into
a Formik form (`InfoPaneAddEditForm.jsx`, `AllergyForm.jsx` and friends), and sends the lot
back, so it carries the id, the audit timestamps and nested association objects. `forResponse`
omits nulls, which is the only reason the existing `deletedAt` guard does not already reject
those requests. Rejecting unknown keys would break every one of those endpoints, so the
helpers drop them.

## Fields each endpoint allows

Each of the 25 call sites declares the fields its clients actually send: the form fields plus
the foreign keys the caller sets, never the system-managed columns. Two deliberate
tightenings beyond that:

- `referenceData` does not allow `systemRequired`. It flags reference data the importer
  refuses to overwrite (`importRows.js`), and no client sets it.
- `certificateNotification` does not allow `labTestId` or `labRequestId`. Those are attached
  by the central server's notification generator, not by the posting client.

## Adjacent mass assignment, not covered by this card

Two hand-written handlers spread `req.body` into `create()` the same way the helpers used to.
Neither goes through `simplePut`/`simplePost`, and restricting them needs its own field
analysis, so they are left as they are:

- `facility-server/app/routes/apiv1/referral.js` — `Referral.create({ ..., ...req.body })`,
  which also feeds `SurveyResponse.createWithAnswers`
- `facility-server/app/routes/apiv1/patient/patientCarePlan.js` — `PatientCarePlan.create(req.body)`
