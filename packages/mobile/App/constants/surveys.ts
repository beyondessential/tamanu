// utility function for when a model's fields are all a direct match for their survey configs
const makeLookupFields = (model: string, fields: string[]) =>
  fields.map(f => [model, f]).reduce((state, c) => ({ ...state, [c[1]]: c }), {});

// Please keep in sync with:
// - @tamanu/constants/surveys.js
export const PATIENT_DATA_FIELD_LOCATIONS = {
  registrationClinicalStatus: ['PatientProgramRegistration', 'clinicalStatusName'],
  programRegistrationStatus: ['PatientProgramRegistration', 'registrationStatusName'],
  registrationClinician: ['PatientProgramRegistration', 'clinicianName'],
  registeringFacility: ['PatientProgramRegistration', 'registeringFacilityName'],
  registrationCurrentlyAtVillage: ['PatientProgramRegistration', 'villageName'],
  registrationCurrentlyAtFacility: ['PatientProgramRegistration', 'facilityName'],
  ...makeLookupFields('Patient', [
    'firstName',
    'middleName',
    'lastName',
    'culturalName',
    'dateOfBirth',
    'dateOfDeath',
    'sex',
    'email',

    'villageId',
  ]),
  ...makeLookupFields('PatientAdditionalData', [
    'placeOfBirth',
    'bloodType',
    'primaryContactNumber',
    'secondaryContactNumber',
    'maritalStatus',
    'cityTown',
    'streetVillage',
    'educationalLevel',
    'socialMedia',
    'title',
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
