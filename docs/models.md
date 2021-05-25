# Models

Models implementations can be found in: `packages/shared-src/src/models`

### AdministeredVaccines

AdministeredVaccine represents a vaccination a patient has recieved. The specific vaccine is represented in the ScheduledVaccine relationship.

### Attachment

TODO

### Discharge

TODO

### Encounter

Encounters are core to the Tamanu platform. An Encounter represents an instance of care with a patient and has information about the time and date, patient, user, as well as location details. Most interactions with a patient will cause an Encounter to be created.

TODO: Add note explaining auto-closing encounters

### EncounterDiagnosis

TODO

### EncounterMedication

TODO

### ImagingRequest

TODO

### LabRequest

TODO

### LabTest

TODO

### LabTestType

TODO

### Location

A Location essentially a wrapper around a Facility, adding a parent name and code, used for reporting.

### Note

A Note can be user generated or app generated, and can be added to any other model as a relationship, it is a generic way of adding
arbitrary information to some data.

### Patient

The Patient model holds a small set of basic information about patients in the system, more detailed information, such as conditions, allergies and additional data are held in separate tables via relations.

### PatientAdditionalData

Holds extra, non-essential data about Patients.

### PatientAllergy

A list of patients allergies

### PatientCarePlan

A list of patients care plans

### PatientCommunication

A list of communications (e.g. email, text) sent to a patient.

### PatientConditions

A list of patients known medical conditions

### PatientFamilyHistory

A list of patients family history

### PatientIssue

A list of patient issues. Can include warnings about a patient for users.

### Procedure

A procedure (e.g. surgery) for a Patient, with information about the team administering the procedure.

### Program

A Program is a simple structure to group Surveys together. Programs just have a name and code,
and can have many Surveys related to it.

### ProgramDataElement

A program data element represents a single question in a survey, and has relations with SurveyScreenComponent and SurveyResponseAnswer to create and save surveys and referrals.

### ReferenceData

Reference data is a core table in Tamanu that allows for huge amounts of customisation across deployments. There are many types of reference data, all used to populate the app with data such as locations, drugs, allergies, diagnoses, and many more. Each deployment has a reference data excel sheet that is imported to the sync server and syncs down to lan and mobile devices to populate data in the apps.

### Referral

A referral is much like a Survey, but used specifically for patient referrals (Under the hood, the referral forms are just Surveys with a `surveyType` of `referral`).

### ReportRequest

Lists all requested reports from the current device, which are then sent to the sync server to be created and delivered.

### ScheduledVaccine

Scheduled vaccines combined to create a full vaccination schedule, from birth to adulthood for a patient.

### Setting

TODO

### Survey

Surveys are a general purpose tool for creating forms and can be used for many applications, e.g.  referrals and screenings.

### SurveyResponse

A survey response hold information about a completed survey, including a calculated result if applicable. It holds the relations to all the answered questions and also an encounter in which the survey was conducted.

### SurveyResponseAnswer

A survey response answer represents an answer to a single question (program data element) in a specific survey.

### SurveyScreenComponent

Survey screen components contain a group of questions that are used to render a single page of questions in a (optionally) multi-page survey.

### SyncMetadata

TODO

### Triage
TODO

### User

Users of the application, required to be able to login to either the tamanu mobile or desktop applications.

### UserFacility

Represents the relationship between a user and which facility they work from.

### UserFeatureFlagsCache
TODO

### Vitals

Hold information about a patients recorded vitals (e.g. temperature, weight, height). and what date those vitals were recorded on.
