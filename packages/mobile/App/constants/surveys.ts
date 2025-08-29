import { BLOOD_LABELS, EDUCATIONAL_ATTAINMENT_LABELS, MARTIAL_STATUS_LABELS, SEX_LABELS, SOCIAL_MEDIA_LABELS, TITLE_LABELS } from "./patientFields";
import { PROGRAM_REGISTRATION_STATUS_LABELS } from "./programRegistries";

// utility function for when a model's fields are all a direct match for their survey configs
const makeLookupFields = (model: string, fields: (string | [string, Record<string, string>])[]) =>
  Object.fromEntries(
    fields.map(f => [Array.isArray(f) ? f[0] : f, [model, ...(Array.isArray(f) ? f : [f])]]),
  );

type PatientDataFieldLocationsType = {
  [key: string]: [string, string, Record<string, string>] | [string, string];
};

// Please keep in sync with:
// - @tamanu/constants/surveys.js
export const PATIENT_DATA_FIELD_LOCATIONS: PatientDataFieldLocationsType = {
  registrationClinicalStatus: ['PatientProgramRegistration', 'clinicalStatusId'],
  programRegistrationStatus: [
    'PatientProgramRegistration',
    'registrationStatus',
    PROGRAM_REGISTRATION_STATUS_LABELS,
  ],
  registrationClinician: ['PatientProgramRegistration', 'clinicianId'],
  registeringFacility: ['PatientProgramRegistration', 'registeringFacilityId'],
  registrationCurrentlyAtVillage: ['PatientProgramRegistration', 'villageId'],
  registrationCurrentlyAtFacility: ['PatientProgramRegistration', 'facilityId'],
  ...makeLookupFields('Patient', [
    'firstName',
    'middleName',
    'lastName',
    'culturalName',
    'dateOfBirth',
    'dateOfDeath',
    ['sex', SEX_LABELS],
    'email',
    'villageId',
  ]),
  ...makeLookupFields('PatientAdditionalData', [
    'placeOfBirth',
    ['bloodType', BLOOD_LABELS],
    'primaryContactNumber',
    'secondaryContactNumber',
    ['maritalStatus', MARTIAL_STATUS_LABELS],
    'cityTown',
    'streetVillage',
    ['educationalLevel', EDUCATIONAL_ATTAINMENT_LABELS],
    ['socialMedia', SOCIAL_MEDIA_LABELS],
    ['title', TITLE_LABELS],
    'birthCertificate',
    'drivingLicense',
    'passport',
    'emergencyContactName',
    'emergencyContactNumber',

    'registeredById',
    'motherId',
    'fatherId',
    'nationalityId',
    'countryId',
    'divisionId',
    'subdivisionId',
    'medicalAreaId',
    'nursingZoneId',
    'settlementId',
    'ethnicityId',
    'occupationId',
    'religionId',
    'patientBillingTypeId',
    'countryOfBirthId',
  ]),
};

// The 'location' for the following fields is defined on the frontend
// Please keep in sync with:
// - @tamanu/constants/surveys.js
export const READONLY_DATA_FIELDS = {
  AGE: 'age',
  AGE_WITH_MONTHS: 'ageWithMonths',
  FULL_NAME: 'fullName',
};
