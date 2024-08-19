import * as yup from 'yup';

const UNHIDEABLE_FIELDS = [
  'markedForSync',
  'displayId',
  'firstName',
  'lastName',
  'dateOfBirth',
  'dateOfDeath',
  'age',
  'ageRange',
  'dateOfBirthFrom',
  'dateOfBirthTo',
  'dateOfBirthExact',
  'emergencyContactName',
  'emergencyContactNumber',
  'locationId',
  'locationGroupId',
  'clinician',
  'diagnosis',
  'userDisplayId',
  'date',
  'registeredBy',
  'status',
  'conditions',
  'programRegistry',
  'circumstanceIds',
  'reminderContactName',
  'reminderContactRelationship',
  'weightUnit',
];

const HIDEABLE_FIELDS = [
  'countryName',
  'culturalName',
  'sex',
  'email',
  'villageName',
  'villageId',
  'bloodType',
  'title',
  'placeOfBirth',
  'countryOfBirthId',
  'maritalStatus',
  'primaryContactNumber',
  'secondaryContactNumber',
  'socialMedia',
  'settlementId',
  'streetVillage',
  'cityTown',
  'subdivisionId',
  'divisionId',
  'countryId',
  'medicalAreaId',
  'nursingZoneId',
  'nationalityId',
  'ethnicityId',
  'occupationId',
  'educationalLevel',
  'middleName',
  'birthCertificate',
  'insurerId',
  'insurerPolicyNumber',
  'drivingLicense',
  'passport',
  'religionId',
  'patientBillingTypeId',
  'motherId',
  'fatherId',
  'birthWeight',
  'birthLength',
  'birthDeliveryType',
  'gestationalAgeEstimate',
  'apgarScoreOneMinute',
  'apgarScoreFiveMinutes',
  'apgarScoreTenMinutes',
  'timeOfBirth',
  'attendantAtBirth',
  'nameOfAttendantAtBirth',
  'birthFacilityId',
  'birthType',
  'registeredBirthPlace',
  'referralSourceId',
  'arrivalModeId',
  'prescriber',
  'prescriberId',
  'facility',
  'dischargeDisposition',
  'notGivenReasonId',
  'healthCenterId',
];

const fieldSchema = yup
  .object({
    shortLabel: yup.string().when('hidden', {
      is: false,
      then: yup.string().required(),
    }),
    longLabel: yup.string().when('hidden', {
      is: false,
      then: yup.string().required(),
    }),
    hidden: yup.boolean().required(),
    required: yup.boolean(),
    defaultValue: yup.mixed(),
    requiredPatientData: yup.boolean(),
    pattern: yup.string(),
  })
  .default({}) // necessary to stop yup throwing hard-to-debug errors
  .required()
  .noUnknown();

const unhideableFieldSchema = yup
  .object({
    shortLabel: yup.string().required(),
    longLabel: yup.string().required(),
    required: yup.boolean(),
    defaultValue: yup.mixed(),
    requiredPatientData: yup.boolean(),
    pattern: yup.string(),
  })
  .required()
  .noUnknown();

export const localisedFieldSchema = yup
  .object({
    ...UNHIDEABLE_FIELDS.reduce(
      (fields, field) => ({
        ...fields,
        [field]: unhideableFieldSchema,
      }),
      {},
    ),
    ...HIDEABLE_FIELDS.reduce(
      (fields, field) => ({
        ...fields,
        [field]: fieldSchema,
      }),
      {},
    ),
  })
  .required()
  .noUnknown();
