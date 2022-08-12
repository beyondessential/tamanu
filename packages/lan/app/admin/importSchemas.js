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

export const base = yup.object().shape({
  id: fieldTypes.id.required(),
});

export const referenceData = base.shape({
  type: yup.string().required(),
  code: fieldTypes.code.required(),
  name: yup.string().required(),
  visibilityStatus,
});

export const patient = base.shape({
  villageId: yup.string(),
  firstName: yup.string().required(),
  lastName: yup.string().required(),
  dateOfBirth: yup.date().required(),
});

export const user = base.shape({
  email: yup.string().required(),
  displayName: yup.string().required(),
  password: yup.string().required(),
});

export const facility = base.shape({
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

export const department = base.shape({
  code: fieldTypes.code.required(),
  name: fieldTypes.name.required(),
  facilityId: yup.string().required(),
  visibilityStatus,
});

export const location = base.shape({
  code: fieldTypes.code.required(),
  name: fieldTypes.name.required(),
  facilityId: yup.string().required(),
  visibilityStatus,
});

export const permission = yup.object().shape({
  _yCell: yup.string().oneOf(['y', 'n'], 'permissions matrix must only use the letter y or n'), // validation-only, not stored in the database anywhere
  verb: yup.string().required(),
  noun: yup.string().required(),
  objectId: yup.string().nullable(),
  deletedAt: yup.date().nullable(),
});

const rangeRegex = /^[0-9.]+, [0-9.]+$/;
export const labTestType = base.shape({
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

export const programDataElement = base.shape({
  indicator: yup.string(),
  type: yup
    .string()
    .required()
    .oneOf(PROGRAM_DATA_ELEMENT_TYPE_VALUES),
  defaultOptions: jsonString(),
});

export const surveyScreenComponent = base.shape({
  visibilityCriteria: jsonString(),
  validationCriteria: jsonString(),
  config: jsonString(),
  screenIndex: yup.number().required(),
  componentIndex: yup.number().required(),
  options: jsonString(),
  calculation: yup.string(),
  surveyId: yup.string().required(),
  detail: yup.string().max(255),
  dataElementId: yup.string().required(),
});

export const scheduledVaccine = base.shape({
  category: yup.string().required(),
  label: yup.string().required(),
  schedule: yup.string().required(),
  weeksFromBirthDue: yup.number(),
  weeksFromLastVaccinationDue: yup.number(),
  index: yup.number().required(),
  vaccineId: yup.string().required(),
  visibilityStatus,
});

export const survey = base.shape({
  surveyType: yup
    .string()
    .required()
    .oneOf(['programs', 'referral', 'obsolete']),
  isSensitive: yup.boolean().required(),
});

export const encounter = base.shape({
  // contains only what's needed for administeredVaccine imports, extend as neccesary
  encounterType: yup.string().oneOf(Object.values(ENCOUNTER_TYPES)),
  startDate: yup.date().required(),
  endDate: yup.date(),
  reasonForEncounter: yup.string(),
  administeredVaccines: yup
    .array()
    .of(
      yup
        .object({
          recordType: yup
            .string()
            .oneOf(['administeredVaccine'])
            .required(),
          data: base.shape({
            batch: yup.string(),
            consent: yup.boolean().required(),
            status: yup
              .string()
              .oneOf(Object.values(VACCINE_STATUS)) // TODO
              .required(),
            reason: yup.string(),
            // TODO: what does this actually do?
            // location: yup.string(),
            injectionSite: yup.string().oneOf(Object.values(INJECTION_SITE_OPTIONS)),
            date: yup.date().required(),
            scheduledVaccineId: yup.string().required(),
          }),
        })
        .required(),
    )
    .required(),
  // relationships
  locationId: yup.string().required(),
  departmentId: yup.string().required(),
  examinerId: yup.string().required(),
  patientId: yup.string().required(),
});
