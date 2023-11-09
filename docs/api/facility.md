# Facility server API Endpoint Docs

Route implementations can be found in: `packages/lan/app/routes`

TODO: 
  - Add explanation of how route permissions work.

### Suggestions

route: `/v1/suggestions`

Used by the desktop app `Suggester` class to add auto completing search functionality to form fields.

### User

route: `/v1/user`

Query user data

### Patient

route: `/v1/patient`

Query patient data, including all models with patient relations
i.e. GET all patient referrals

### Encounter

route: `/v1/encounter`

Query encounter data, including all models with encounter relations.
i.e. GET all encounter diagnoses

### Survey

route: `/v1/survey`

Query and save survey data, this includes referrals.

### Other endpoints

The following endpoints all have basic create, read and update endpoints through the
handlers found in `packages/shared-src/src/utils/crudHelpers.js`

`/v1/procedure`

`/v1/triage`

`/v1/referenceData`

`/v1/diagnosis`

`/v1/patientIssue`

`/v1/familyHistory`

`/v1/additionalData`

`/v1/allergy`

`/v1/ongoingCondition`

`/v1/medication`

`/v1/note`

`/v1/labRequest`

`/v1/labTest`

`/v1/referral`

`/v1/imagingRequest`

`/v1/program`

`/v1/surveyResponse`

`/v1/reports`

`/v1/reportRequest`

`/v1/patientCarePlan`

`/v1/admin`

`/v1/setting`

`/v1/location`

`/v1/attachment`
