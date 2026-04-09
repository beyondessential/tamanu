const PATIENT_MODEL_FIELDS = new Set([
  'displayId',
  'firstName',
  'middleName',
  'lastName',
  'culturalName',
  'dateOfBirth',
  'dateOfDeath',
  'sex',
  'email',
  'villageId',
  'visibilityStatus',
  'mergedIntoId',
]);

const ALREADY_SEARCHABLE_FIELDS = new Set([
  'displayId',
  'firstName',
  'lastName',
  'culturalName',
  'dateOfBirthExact',
  'dateOfBirthFrom',
  'dateOfBirthTo',
  'sex',
  'villageId',
  'deceased',
]);

const PAD_REFERENCE_DATA_FIELDS = new Set([
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
  'insurerId',
  'secondaryVillageId',
]);

const VALID_PAD_TEXT_FIELDS = new Set([
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
  'insurerPolicyNumber',
]);

export const isValidAdditionalSearchField = fieldName => {
  if (ALREADY_SEARCHABLE_FIELDS.has(fieldName)) return false;
  if (PATIENT_MODEL_FIELDS.has(fieldName)) return true;
  if (VALID_PAD_TEXT_FIELDS.has(fieldName)) return true;
  if (PAD_REFERENCE_DATA_FIELDS.has(fieldName)) return true;
  return false;
};

export const isPatientModelField = fieldName => PATIENT_MODEL_FIELDS.has(fieldName);
export const isReferenceDataField = fieldName => PAD_REFERENCE_DATA_FIELDS.has(fieldName);

export const PATIENT_SORT_KEYS = {
  markedForSync: 'patient_facilities.patient_id',
  displayId: 'patients.display_id',
  lastName: 'UPPER(patients.last_name)',
  culturalName: `UPPER(COALESCE(patients.cultural_name, ''))`,
  firstName: 'UPPER(patients.first_name)',
  age: 'patients.date_of_birth',
  dateOfBirth: 'patients.date_of_birth',
  villageName: 'village_name',
  locationName: 'location.name',
  departmentName: 'department.name',
  encounterType: 'encounters.encounter_type',
  sex: 'patients.sex',
};
