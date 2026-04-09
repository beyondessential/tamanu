export const PATIENT_MODEL_SEARCH_FIELDS = [
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
] as const;

export const ALREADY_SEARCHABLE_PATIENT_FIELDS = [
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
] as const;

export const PAD_REFERENCE_DATA_FIELDS = [
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
] as const;

export const PAD_TEXT_FIELDS = [
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
] as const;

const patientModelFieldSet = new Set<string>(PATIENT_MODEL_SEARCH_FIELDS);
const alreadySearchableFieldSet = new Set<string>(ALREADY_SEARCHABLE_PATIENT_FIELDS);
const padReferenceDataFieldSet = new Set<string>(PAD_REFERENCE_DATA_FIELDS);
const padTextFieldSet = new Set<string>(PAD_TEXT_FIELDS);

export const isValidAdditionalSearchField = (fieldName: string): boolean => {
  if (alreadySearchableFieldSet.has(fieldName)) return false;
  if (patientModelFieldSet.has(fieldName)) return true;
  if (padTextFieldSet.has(fieldName)) return true;
  if (padReferenceDataFieldSet.has(fieldName)) return true;
  return false;
};

export const isPatientModelSearchField = (fieldName: string): boolean =>
  patientModelFieldSet.has(fieldName);

export const isReferenceDataSearchField = (fieldName: string): boolean =>
  padReferenceDataFieldSet.has(fieldName);
