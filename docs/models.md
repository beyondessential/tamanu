# Models

Models implementations can be found in: `packages/shared/src/models`
# OUTDATED
# Please see https://beyond-essential.slab.com/posts/tamanu-db-schema-documentation-7lexbq64 if you have access to BES's internal documentation

### AdministeredVaccine

A vaccination a patient has recieved. The specific vaccine is represented in the ScheduledVaccine relationship.

### Attachment

Metadata for an attached document (for eg an image or a pdf). Actual attachment data is not synced; data should be fetched over an internet connection from the sync server (though the data column in this table can be used as a local cache).

### Discharge

Details of a discharge from a hospital admission. Most encounter types are closed by simply setting an endDate, this model is simply to attach additional discharge information. 

### Encounter

Encounters are core to the Tamanu platform. An Encounter represents an instance of care with a patient and has information about the time and date, patient, user, as well as location details. Most interactions with a patient will cause an Encounter to be created.

TODO: Add note explaining auto-closing encounters

### EncounterDiagnosis

A diagnosis given to a patient.

### EncounterMedication

A prescription of medication to a patient.

### ImagingRequest

A request for imaging (for eg an x-ray or a colposcopy).

### LabRequest

A request for labs. Multiple tests can be attached to a single request (a single sample may be tested for several different conditions).

### LabTest

A request for a single lab test. Always part of a LabRequest.

### LabTestType

A type of lab test, with name and code but also includes configurations like healthy ranges to display next to results, options for dropdowns etc.

### Location

A Location essentially a wrapper around a Facility, adding a parent name and code, used for reporting.

### Note

A Note can be user generated or app generated, and can be added to any other model as a relationship, it is a generic way of adding
arbitrary information to some data.

### Patient

The Patient model is the central reference point for a patient's data. The table itself holds a small set of basic information, and is synced to all devices regardless of whether that patient attends a particular facility. This means that adding fields to this table should be done VERY rarely, as it represents a security risk (low control over which devices it ends up on) as well as data traffic risk (each new byte of data added to the core patient record will be multiplied by the # of patients in that system - easily hundreds of thousands, possibly millions - for every device!).

### PatientAdditionalData

Holds most of a patient's non-encounter data (for eg contact information, social media). Only synced to facilities that have marked that patient for sync.

### PatientAllergy

A allergy recorded for a patient (for eg peanuts or penicillin). 

### PatientCarePlan

A care plan for a patient.

### PatientCommunication

A communication (e.g. email, text) to be sent to a patient. The sync server is responsible for actually processing these communications.

### PatientCondition

An ongoing medical condition.

### PatientFamilyHistory

A piece of medical history within that patient's family.

### PatientIssue

A list of patient issues. Can include warnings about a patient for users.

### Procedure

A procedure (e.g. surgery) for a Patient, with information about the team administering the procedure.

### Program

A named group of Surveys.

### ProgramDataElement

A program data element represents a single survey question, reusable across different surveys. Information regarding a ProgramDataElement's survey-specific information (for eg page number) is stored in SurveyScreenComponent. Actual submitted patient data for a ProgramDataElement is stored in SurveyResponseAnswer.

### ReferenceData

Reference data is a core table in Tamanu that allows for huge amounts of customisation across deployments. There are many types of reference data, all used to populate the app with data such as locations, drugs, allergies, diagnoses, and many more. Each deployment has a reference data excel sheet that is imported to the sync server and syncs down to lan and mobile devices to populate data in the apps.

A reference data item has a name, a code, and an ID (where "code" is just a unique string for that reference data item within its type, for eg an ICD10 code). If a type of reference data requires additional metadata beyond these fields, then it should be split out into a separate table.

### Referral

A referral to another facility. This model is lightweight by design, only tracking the core data of where the referral is for. Any medical information related to the referral (for eg a diagnosis) should just be stored on the initiating encounter, while custom metadata should be attached via a SurveyResponse.

:warning: Not to be confused with a Survey object having `surveyType == 'referral'`! This kind of Survey commonly gets shorthanded as a Referral; this practice should be discouraged.

### ReportRequest

Lists all requested reports from the current device, which are then sent to the sync server to be created and delivered.

### ScheduledVaccine

Scheduled vaccines combined to create a full vaccination schedule, from birth to adulthood for a patient.

### Setting

TODO

### Survey

Surveys are a general purpose tool for creating forms and can be used for many applications, e.g. referrals and screenings.

### SurveyResponse

A survey response hold information about a completed survey, including a calculated result if applicable. It holds the relations to all the answered questions and also the encounter in which the survey was conducted.

### SurveyResponseAnswer

A survey response answer represents an answer to a single question (program data element) in a specific survey.

### SurveyScreenComponent

Represents metadata for a question on a survey (for eg, position within the survey, any survey-specific overrides). The actual contents of the question (question type, text, etc) is stored in ProgramDataElement.

### ChannelSyncPullCursor

Utility table to track the sync cursor for a channel. Not directly related to any patient or medical information, other than UUID.

### Triage

Emergency department triage information. Tracks very limited information - further data (for eg diagnoses or notes) should be recorded against an attached Encounter object instead.

### User

Users of the application, required to be able to login to either the tamanu mobile or desktop applications.

### UserFacility

Represents the relationship between a user and which facility they work from.

### UserLocalisationCache

Cached localisation values from the server.

### Vitals

Hold information about a patients recorded vitals (e.g. temperature, weight, height). and what date those vitals were recorded on.
