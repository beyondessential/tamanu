import * as yup from 'yup';
import {
  ENCOUNTER_TYPES,
  INJECTION_SITE_OPTIONS,
  PROGRAM_DATA_ELEMENT_TYPE_VALUES,
  VACCINE_STATUS,
  LAB_TEST_RESULT_TYPES,
  VISIBILITY_STATUSES,
} from 'shared/constants';

const visibilityStatus = yup
  .string()
  .default(VISIBILITY_STATUSES.CURRENT)
  .oneOf(Object.values(VISIBILITY_STATUSES));
const safeIdRegex = /^[A-Za-z0-9-]+$/;
const safeCodeRegex = /^[A-Za-z0-9-./]+$/;

const fieldTypes = {
  id: yup.string().matches(safeIdRegex, 'id must not have spaces or punctuation other than -'),
  code: yup
    .string()
    .matches(safeCodeRegex, 'code must not have spaces or punctuation other than -./'),
  name: yup.string().max(255),
};

export const Base = yup.object().shape({
  id: fieldTypes.id.required(),
});

export const ReferenceData = Base.shape({
  type: yup.string().required(),
  code: fieldTypes.code.required(),
  name: yup.string().required(),
  visibilityStatus,
});

export const RDmanufacturer = ReferenceData.shape({
  code: fieldTypes.code
    .matches(/^((?!ORG-).+|ORG-[0-9]+)$/, 'must either by a textual code or an EU ORG code')
    .required(),
  name: yup.string().required(),
});

export const Patient = Base.shape({
  firstName: yup.string().required(),
  middleName: yup.string(),
  lastName: yup.string().required(),
  culturalName: yup.string(),

  displayId: yup.string().required(),
  sex: yup
    .string()
    .oneOf(['male', 'female', 'other'])
    .required(),

  dateOfBirth: yup.date().required(),
  dateOfDeath: yup.date(),

  villageId: yup.string(),
});

export const User = Base.shape({
  email: yup.string().required(),
  displayName: yup.string().required(),
  password: yup.string().required(),
});

export const Facility = Base.shape({
  code: fieldTypes.code.required(),
  name: fieldTypes.name.required(),
  email: yup.string(),
  contactNumber: yup.string(),
  streetAddress: yup.string(),
  cityTown: yup.string(),
  division: yup.string(),
  type: yup.string(),
  visibilityStatus,
});

export const Department = Base.shape({
  code: fieldTypes.code.required(),
  name: fieldTypes.name.required(),
  facilityId: yup.string().required(),
  visibilityStatus,
});

export const Location = Base.shape({
  code: fieldTypes.code.required(),
  name: fieldTypes.name.required(),
  facilityId: yup.string().required(),
  visibilityStatus,
  maxOccupancy: yup
    .number()
    .integer()
    .min(1, 'maxOccupancy must be 1 or null for unrestricted occupancy')
    .max(1, 'maxOccupancy above 1 is unimplemented'),
});

export const Permission = yup.object().shape({
  _yCell: yup.string().oneOf(['y', 'n'], 'permissions matrix must only use the letter y or n'), // validation-only, not stored in the database anywhere
  verb: yup.string().required(),
  noun: yup.string().required(),
  objectId: yup.string().nullable(),
  deletedAt: yup.date().nullable(),
});

const rangeRegex = /^[0-9.]+, [0-9.]+$/;
export const LabTestType = Base.shape({
  name: yup.string().required(),
  labTestCategoryId: yup.string().required(),
  resultType: yup
    .string()
    .required()
    .oneOf(Object.values(LAB_TEST_RESULT_TYPES)),
  options: yup.string(),
  unit: yup.string(),
  maleRange: yup.string().matches(rangeRegex),
  femaleRange: yup.string().matches(rangeRegex),
  visibilityStatus,
});

const jsonString = () =>
  // The template curly two lines down is valid in a yup message
  // eslint-disable-next-line no-template-curly-in-string
  yup.string().test('is-json', '${path} is not valid JSON', value => {
    if (!value) return true;
    try {
      JSON.parse(value);
      return true;
    } catch (e) {
      return false;
    }
  });

export const ProgramDataElement = Base.shape({
  indicator: yup.string(),
  type: yup
    .string()
    .required()
    .oneOf(PROGRAM_DATA_ELEMENT_TYPE_VALUES),
  defaultOptions: jsonString(),
});

// export const SSCValidationCriteria = yup
//   .object()
//   .json()
//   .shape({
//     mandatory: yup.boolean(),
//   });

export const SurveyScreenComponent = Base.shape({
  visibilityCriteria: jsonString(),
  validationCriteria: jsonString(), // SSCValidationCriteria,
  config: jsonString(),
  screenIndex: yup.number().required(),
  componentIndex: yup.number().required(),
  options: jsonString(),
  calculation: yup.string(),
  surveyId: yup.string().required(),
  detail: yup.string().max(255),
  dataElementId: yup.string().required(),
});

export const ScheduledVaccine = Base.shape({
  category: yup.string().required(),
  label: yup.string().required(),
  schedule: yup.string().required(),
  weeksFromBirthDue: yup.number(),
  weeksFromLastVaccinationDue: yup.number(),
  index: yup.number().required(),
  vaccineId: yup.string().required(),
  visibilityStatus,
});

const ICD11_REGEX = /^([0-9A-HJ-NP-V]{1,4}(\.[0-9A-HJ-NP-V]{1,4})?|X[0-9A-HJ-NP-Z.]+)$/;
const SNOMED_OR_ATC = /^([0-9]+|[A-Z][0-9A-Z]*)$/;
const EITHER_EU_CODE_OR_SOMETHING_ELSE = /^((?!EU\/).+|EU\/[0-9]\/[0-9]{2}\/[0-9]+)$/;
export const CertifiableVaccine = Base.shape({
  icd11DrugCode: yup
    .string()
    .matches(ICD11_REGEX, 'must be ICD-11 code')
    .required(),
  icd11DiseaseCode: yup
    .string()
    .matches(ICD11_REGEX, 'must be ICD-11 code')
    .required(),
  vaccineCode: yup
    .string()
    .matches(SNOMED_OR_ATC, 'must be SNOMED-CT or ATC code')
    .required(),
  targetCode: yup
    .string()
    .matches(SNOMED_OR_ATC, 'must be SNOMED-CT or ATC code')
    .optional(),
  euProductCode: yup
    .string()
    .matches(EITHER_EU_CODE_OR_SOMETHING_ELSE, 'must either be a name or an EU product code')
    .optional(),
  maximumDosage: yup
    .number()
    .positive()
    .integer()
    .required(),
  vaccineId: yup.string().required(),
  manufacturerId: yup.string().optional(),
});

export const Survey = Base.shape({
  surveyType: yup
    .string()
    .required()
    .oneOf(['programs', 'referral', 'obsolete', 'vitals']),
  isSensitive: yup.boolean().required(),
});

export const AdministeredVaccine = Base.shape({
  batch: yup.string(),
  consent: yup.boolean().required(),
  status: yup
    .string()
    .oneOf(Object.values(VACCINE_STATUS))
    .required(),
  reason: yup.string(),
  injectionSite: yup.string().oneOf(Object.values(INJECTION_SITE_OPTIONS)),
  date: yup.date().required(),
  scheduledVaccineId: fieldTypes.id.required(),
  encounterId: fieldTypes.id.required(),
});

export const Encounter = Base.shape({
  // contains only what's needed for administeredVaccine imports, extend as neccesary
  encounterType: yup.string().oneOf(Object.values(ENCOUNTER_TYPES)),
  startDate: yup.date().required(),
  endDate: yup.date(),
  reasonForEncounter: yup.string(),

  // relationships
  locationId: yup.string().required(),
  departmentId: yup.string().required(),
  examinerId: yup.string().required(),
  patientId: yup.string().required(),
});
