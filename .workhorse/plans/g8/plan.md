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

## What each helper protects

`allowedFields` may never name `createdAt`, `updatedAt`, `deletedAt` or `updatedAtSyncTick`.
`simplePut` and `simplePatch` additionally refuse `id`: an update addresses its record by
URL, so naming the primary key is always a mistake, while a create legitimately carries the
id of the record it is making.

The guard splits along what it needs to know. Whether a field is protected is a property of
the option alone, so that half runs while the route is being built and fails at boot in every
environment. Whether a field exists needs the model, which is only reachable through the
request, so that half runs per request and only outside production, where a bad option is a
failing test rather than a live route returning 500.

Because `deletedAt` is protected, a PUT body carrying it is filtered rather than refused. The
check that a *stored* record is not deleted stays; rejecting a request merely for echoing the
key back would fire on exactly the round-tripped bodies these endpoints are built to accept.

## Fields each endpoint allows

Each route file declares one `EDITABLE_FIELDS` constant holding the fields its clients send,
and its create derives from it (`[...EDITABLE_FIELDS, 'id', 'patientId']`). The two lists
differ only by what a create adds, so writing them out separately would let them drift
silently: a dropped field is just ignored, with nothing to fail.

Two deliberate tightenings beyond the fields clients send:

- `referenceData` does not allow `systemRequired`. It flags reference data the importer
  refuses to overwrite (`importRows.js`), and no client sets it.
- `certificateNotification` does not allow `labTestId` or `labRequestId`. Those are attached
  by the central server's notification generator, not by the posting client.

`simplePost` filters the body once and checks it for a duplicate id using the filtered
values, so an endpoint that does not allow `id` ignores a body id rather than rejecting the
create as a collision.

## Adjacent mass assignment, not covered by this card

Two hand-written handlers spread `req.body` into `create()` the same way the helpers used to.
Neither goes through `simplePut`/`simplePost`, and restricting them needs its own field
analysis, so they are left as they are:

- `facility-server/app/routes/apiv1/referral.js` — `Referral.create({ ..., ...req.body })`,
  which also feeds `SurveyResponse.createWithAnswers`
- `facility-server/app/routes/apiv1/patient/patientCarePlan.js` — `PatientCarePlan.create(req.body)`
