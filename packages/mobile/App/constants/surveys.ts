// utility function for when a model's fields are all a direct match for their survey configs
const makeLookupFields = (model: string, fields: string[]) =>
  fields.map(f => [model, f]).reduce((state, c) => ({ ...state, [c[1]]: c }), {});

// Please keep in sync with:
// - @tamanu/constants/surveys.js
export const PATIENT_DATA_FIELD_LOCATIONS = {
  registrationClinicalStatus: ['PatientProgramRegistration', 'clinicalStatusId'],
  programRegistrationStatus: ['PatientProgramRegistration', 'registrationStatus'],
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
