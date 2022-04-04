import * as Yup from 'yup';
import { Suggester } from '~/ui/helpers/suggester';
import { ReferenceData } from '~/models/ReferenceData';
import { MODELS_MAP } from '~/models/modelsMap';

// All PatientAdditionalData plain fields sorted alphabetically
export const plainFields = [
  'birthCertificate',
  'bloodType',
  'cityTown',
  'drivingLicense',
  'educationalLevel',
  'maritalStatus',
  'passport',
  'placeOfBirth',
  'primaryContactNumber',
  'secondaryContactNumber',
  'socialMedia',
  'streetVillage',
  'title',
  'emergencyContactName',
  'emergencyContactNumber',
];

// All PatientAdditionalData relation ID fields sorted alphabetically
export const relationIdFields = [
  'countryId',
  'countryOfBirthId',
  'divisionId',
  'ethnicityId',
  'medicalAreaId',
  'nationalityId',
  'nursingZoneId',
  'occupationId',
  'patientBillingTypeId',
  'religionId',
  'settlementId',
  'subdivisionId',
];

// Maps relationIdFields with the expected reference data type for the suggester
// and a default placeholder value if there isn't one in localisation.
// All types match their key name without 'Id' except 'countryOfBirth'. It seems better to
// set them explicitly rather than making exceptions in case the naming changes.
export const relationIdFieldsProperties = {
  countryId: {
    type: 'country',
    placeholder: 'Country',
  },
  countryOfBirthId: {
    type: 'country',
    placeholder: 'Country of Birth',
  },
  divisionId: {
    type: 'division',
    placeholder: 'Division',
  },
  ethnicityId: {
    type: 'ethnicity',
    placeholder: 'Ethnicity',
  },
  medicalAreaId: {
    type: 'medicalArea',
    placeholder: 'Medical Area',
  },
  nationalityId: {
    type: 'nationality',
    placeholder: 'Nationality',
  },
  nursingZoneId: {
    type: 'nursingZone',
    placeholder: 'Nursing Zone',
  },
  occupationId: {
    type: 'occupation',
    placeholder: 'Occupation',
  },
  patientBillingTypeId: {
    type: 'patientBillingType',
    placeholder: 'Patient Billing Type',
  },
  religionId: {
    type: 'religion',
    placeholder: 'Religion',
  },
  settlementId: {
    type: 'settlement',
    placeholder: 'Settlement',
  },
  subdivisionId: {
    type: 'subdivision',
    placeholder: 'Subdivision',
  },
};

// Helper function to reduce boilerplate in main file
export const getSuggester = (
  models: typeof MODELS_MAP,
  type: string,
): Suggester<typeof ReferenceData> => (
  new Suggester(models.ReferenceData, {
    where: {
      type,
    },
  })
);

// Plain and ID fields in alphabetical order
export const patientAdditionalDataValidationSchema = Yup.object().shape({
  birthCertificate: Yup.string().nullable(),
  bloodType: Yup.string().nullable(),
  cityTown: Yup.string().nullable(),
  countryId: Yup.string().nullable(),
  countryOfBirthId: Yup.string().nullable(),
  divisionId: Yup.string().nullable(),
  drivingLicense: Yup.string().nullable(),
  educationalLevel: Yup.string().nullable(),
  ethnicityId: Yup.string().nullable(),
  maritalStatus: Yup.string().nullable(),
  medicalAreaId: Yup.string().nullable(),
  nationalityId: Yup.string().nullable(),
  nursingZoneId: Yup.string().nullable(),
  occupationId: Yup.string().nullable(),
  passport: Yup.string().nullable(),
  patientBillingTypeId: Yup.string().nullable(),
  placeOfBirth: Yup.string().nullable(),
  primaryContactNumber: Yup.string().nullable(),
  religionId: Yup.string().nullable(),
  secondaryContactNumber: Yup.string().nullable(),
  settlementId: Yup.string().nullable(),
  socialMedia: Yup.string().nullable(),
  streetVillage: Yup.string().nullable(),
  subdivisionId: Yup.string().nullable(),
  title: Yup.string().nullable(),
  emergencyContactName: Yup.string().nullable(),
  emergencyContactNumber: Yup.string().nullable(),
});

// Strip off unwanted fields from additional data and only keep specified ones
export const getInitialValues = (data): {} => {
  if (!data) {
    return {};
  }

  // Get all fields in the form
  const allFields = [...plainFields, ...relationIdFields];

  // Copy values from data
  const values = {};
  allFields.forEach(fieldName => {
    values[fieldName] = data[fieldName];
  });

  return values;
};
