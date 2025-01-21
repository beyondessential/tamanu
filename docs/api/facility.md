> [!WARNING]
> We don't currently have thorough or complete documentation of these APIs.
>
> The below is correct but very partial, with many many routes undocumented.

# Facility server API routes

Route implementations can be found in: `packages/facility-server/app/routes`

### Suggestions

route: `/api/suggestions`

Used by the web app `Suggester` class to add auto completing search functionality to form fields.

### User

route: `/api/user`

Query user data

### Patient

route: `/api/patient`

Query patient data, including all models with patient relations
i.e. GET all patient referrals

### Encounter

route: `/api/encounter`

Query encounter data, including all models with encounter relations.
i.e. GET all encounter diagnoses

### Survey

route: `/api/survey`

Query and save survey data, this includes referrals.

### Other endpoints

The following endpoints all have basic create, read and update endpoints through the
handlers found in `packages/shared-src/src/utils/crudHelpers.js`

`/api/procedure`

`/api/triage`

`/api/referenceData`

`/api/diagnosis`

`/api/patientIssue`

`/api/familyHistory`

`/api/additionalData`

`/api/allergy`

`/api/ongoingCondition`

`/api/medication`

`/api/note`

`/api/labRequest`

`/api/labTest`

`/api/referral`

`/api/imagingRequest`

`/api/program`

`/api/surveyResponse`

`/api/reports`

`/api/reportRequest`

`/api/patientCarePlan`

`/api/admin`

`/api/setting`

`/api/location`

`/api/attachment`
