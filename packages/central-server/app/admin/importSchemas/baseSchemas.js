import * as yup from 'yup';
import {
  DEVICE_REGISTRATION_PERMISSION,
  ENCOUNTER_TYPES,
  LAB_TEST_RESULT_TYPES,
  LAB_TEST_TYPE_VISIBILITY_STATUSES,
  PROGRAM_DATA_ELEMENT_TYPE_VALUES,
  STATUS_COLOR,
  VACCINE_STATUS,
  VISIBILITY_STATUSES,
  REFERENCE_DATA_RELATION_TYPES,
  SURVEY_TYPES,
  INJECTION_SITE_VALUES,
  TASK_FREQUENCY_ACCEPTED_UNITS,
  TASK_FREQUENCY_ACCEPTED_UNITS_TO_VALUE,
  DRUG_ROUTE_VALUES,
  DRUG_ROUTE_LABELS,
  MEDICATION_DURATION_UNITS,
  ADMINISTRATION_FREQUENCIES,
  DRUG_UNITS,
  PERMISSION_NOUNS,
  INVOICE_ITEMS_CATEGORIES_MODELS,
  INVOICE_ITEMS_CATEGORIES,
  LOCATION_BOOKABLE_VIEW_VALUES,
  LOCATION_BOOKABLE_VIEW,
  DRUG_STOCK_STATUSES,
} from '@tamanu/constants';
import config from 'config';
import {
  configString,
  jsonString,
  validationString,
  visualisationConfigString,
} from './jsonString';
import { rangeArraySchema, rangeObjectSchema } from './rangeObject';

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
  sex: yup.string().oneOf(['male', 'female', 'other']).required(),

  dateOfBirth: yup.date().required(),
  dateOfDeath: yup.date(),

  villageId: yup.string(),
});

export const PatientAdditionalData = yup.object().shape({
  patientId: yup.string().required(),
});

export const PatientFieldValue = yup.object().shape({
  patientId: yup.string().required(),
  definitionId: yup.string().required(),
});

export const User = Base.shape({
  email: yup.string().required(),
  displayId: yup.string(),
  displayName: yup.string().required(),
  password: yup.string(),
  phoneNumber: yup.string(),
  visibilityStatus: yup
    .string()
    .default(VISIBILITY_STATUSES.CURRENT)
    .oneOf([VISIBILITY_STATUSES.CURRENT, VISIBILITY_STATUSES.HISTORICAL]),
  deviceRegistrationPermission: yup
    .string()
    .default(DEVICE_REGISTRATION_PERMISSION.NONE)
    .oneOf(Object.values(DEVICE_REGISTRATION_PERMISSION)),
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

export const LocationGroup = Base.shape({
  code: fieldTypes.code.required(),
  name: fieldTypes.name.required(),
  facilityId: yup.string().required(),
  visibilityStatus,
  isBookable: yup.string().default(LOCATION_BOOKABLE_VIEW.NO).oneOf(LOCATION_BOOKABLE_VIEW_VALUES),
});

export const Permission = yup.object().shape({
  _yCell: yup.string().oneOf(['y', 'n'], 'permissions matrix must only use the letter y or n'), // validation-only, not stored in the database anywhere
  verb: yup.string().required().trim(),
  noun: yup.string().required().trim().oneOf(PERMISSION_NOUNS, 'Noun is invalid or does not exist'),
  objectId: yup.string().nullable().trim(),
  deletedAt: yup.date().nullable(),
});

const rangeRegex = /^[0-9.]+, [0-9.]+$/;
export const LabTestType = Base.shape({
  name: yup.string().required(),
  labTestCategoryId: yup.string().required(),
  resultType: yup.string().required().oneOf(Object.values(LAB_TEST_RESULT_TYPES)),
  options: yup.string(),
  unit: yup.string(),
  maleRange: yup.string().matches(rangeRegex),
  femaleRange: yup.string().matches(rangeRegex),
  visibilityStatus: yup
    .string()
    .default(LAB_TEST_TYPE_VISIBILITY_STATUSES.CURRENT)
    .oneOf(Object.values(LAB_TEST_TYPE_VISIBILITY_STATUSES)),
});

export const LabTestPanel = Base.shape({
  name: yup.string().required(),
  code: yup.string().required(),
  categoryId: yup.string().required(),
  visibilityStatus,
});

export const LabTestPanelLabTestTypes = yup.object().shape({
  // id is auto generated by db, so don't require it on import
  labTestPanelId: yup.string().required(),
  labTestTypeId: yup.string().required(),
});

const visualisationConfigSchema = yup.object().shape({
  yAxis: yup.object().shape({
    graphRange: yup.lazy(value => (Array.isArray(value) ? rangeArraySchema : rangeObjectSchema)),
    interval: yup.number().required(),
  }),
});

export const ProgramDataElement = Base.shape({
  indicator: yup.string(),
  type: yup.string().required().oneOf(PROGRAM_DATA_ELEMENT_TYPE_VALUES),
  defaultOptions: jsonString(),
  visualisationConfig: visualisationConfigString(visualisationConfigSchema),
});

export const baseValidationShape = yup
  .object()
  .shape({
    mandatory: yup.lazy(value => {
      return typeof value === 'boolean'
        ? yup.boolean()
        : yup.object().shape({
            encounterType: yup.mixed(),
          });
    }),
  })
  .noUnknown();

export const baseConfigShape = yup.object().noUnknown();

export const SurveyScreenComponent = Base.shape({
  visibilityCriteria: jsonString(),
  validationCriteria: config.validateQuestionConfigs.enabled
    ? validationString(baseValidationShape)
    : jsonString(),
  config: config.validateQuestionConfigs.enabled ? configString(baseConfigShape) : jsonString(),
  screenIndex: yup.number().required(),
  componentIndex: yup.number().required(),
  options: jsonString(),
  calculation: yup.string(),
  surveyId: yup.string().required(),
  detail: yup.string().max(255),
  dataElementId: yup.string().required(),
  visibilityStatus,
});

export const ScheduledVaccine = Base.shape({
  category: yup.string().required(),
  label: yup.string().required(),
  doseLabel: yup.string().required(),
  weeksFromBirthDue: yup.number().when(['doseLabel', 'index'], {
    is: (doseLabel, index) => {
      if (!doseLabel.startsWith('Dose')) return false;
      return index > 1;
    },
    then: yup
      .number()
      .test('is-null', 'Weeks from birth due should not be set for non-first doses', value => {
        return value === undefined;
      }),
    otherwise: yup.number(),
  }),
  weeksFromLastVaccinationDue: yup.number().when(['doseLabel', 'index'], {
    is: (doseLabel, index) => {
      if (!doseLabel.startsWith('Dose')) return false;
      return index === 1;
    },
    then: yup
      .number()
      .test(
        'is-null',
        'Weeks from last vaccination due should not be set for first doses',
        value => value === undefined,
      ),
    otherwise: yup.number(),
  }),
  index: yup.number().required(),
  vaccineId: yup.string().required(),
  visibilityStatus,
  sortIndex: yup.number().required(),
});

const ICD11_REGEX = /^([0-9A-HJ-NP-V]{1,4}(\.[0-9A-HJ-NP-V]{1,4})?|X[0-9A-HJ-NP-Z.]+)$/;
const SNOMED_OR_ATC = /^([0-9]+|[A-Z][0-9A-Z]*)$/;
const EITHER_EU_CODE_OR_SOMETHING_ELSE = /^((?!EU\/).+|EU\/[0-9]\/[0-9]{2}\/[0-9]+)$/;
export const CertifiableVaccine = Base.shape({
  icd11DrugCode: yup.string().matches(ICD11_REGEX, 'must be ICD-11 code').required(),
  icd11DiseaseCode: yup.string().matches(ICD11_REGEX, 'must be ICD-11 code').required(),
  vaccineCode: yup.string().matches(SNOMED_OR_ATC, 'must be SNOMED-CT or ATC code').required(),
  targetCode: yup.string().matches(SNOMED_OR_ATC, 'must be SNOMED-CT or ATC code').optional(),
  euProductCode: yup
    .string()
    .matches(EITHER_EU_CODE_OR_SOMETHING_ELSE, 'must either be a name or an EU product code')
    .optional(),
  maximumDosage: yup.number().positive().integer().required(),
  vaccineId: yup.string().required(),
  manufacturerId: yup.string().optional(),
});

export const Survey = Base.shape({
  surveyType: yup.string().required().oneOf(Object.values(SURVEY_TYPES)),
  isSensitive: yup.boolean().required(),
  visibilityStatus: yup
    .string()
    .default(VISIBILITY_STATUSES.CURRENT)
    .oneOf([VISIBILITY_STATUSES.CURRENT, VISIBILITY_STATUSES.HISTORICAL]),
});

export const ProgramRegistry = Base.shape({
  code: fieldTypes.code.required(),
  name: yup.string().required(),
  visibilityStatus,
});

export const ProgramRegistryClinicalStatus = Base.shape({
  code: fieldTypes.code.required(),
  name: yup.string().required(),
  color: yup.string().required().oneOf(Object.keys(STATUS_COLOR)),
  visibilityStatus,
});

export const ProgramRegistryCondition = Base.shape({
  code: fieldTypes.code.required(),
  name: yup.string().required(),
  visibilityStatus,
});

export const AdministeredVaccine = Base.shape({
  batch: yup.string(),
  consent: yup.boolean().required(),
  status: yup.string().oneOf(Object.values(VACCINE_STATUS)).required(),
  reason: yup.string(),
  injectionSite: yup.string().oneOf(Object.values(INJECTION_SITE_VALUES)),
  date: yup.date().required(),
  scheduledVaccineId: fieldTypes.id.required(),
  encounterId: fieldTypes.id.required(),
});

export const Encounter = Base.shape({
  // contains only what's needed for administeredVaccine imports, extend as necessary
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

export const TranslatedString = yup.object().shape({
  stringId: yup.string().required(),
});

export const ReferenceDataRelation = yup.object().shape({
  referenceDataParentId: yup.string().required(),
  referenceDataId: yup.string().required(),
  type: yup.string().oneOf(Object.values(REFERENCE_DATA_RELATION_TYPES)),
});

export const UserFacility = yup.object().shape({
  // id is auto generated by db, so don't require it on import
  facilityId: yup.string().required(),
  userId: yup.string().required(),
});

export const InvoiceProduct = yup.object().shape({
  id: yup.string().required(),
  name: yup.string().required(),
  category: yup.string().oneOf(Object.values(INVOICE_ITEMS_CATEGORIES)),
  sourceRecordType: yup
    .string()
    .oneOf(Array.from(new Set(Object.values(INVOICE_ITEMS_CATEGORIES_MODELS)))),
  sourceRecordId: yup.string(),
  discountable: yup.boolean().required(),
  visibilityStatus,
});

export const UserDesignation = yup.object().shape({
  userId: yup.string().required(),
  designationId: yup.string().required(),
});

export const TaskTemplate = yup.object().shape({
  id: yup.string().required(),
  referenceDataId: yup.string().required(),
  highPriority: yup.boolean().optional(),
  frequencyValue: yup.number().moreThan(0).optional(),
  frequencyUnit: yup
    .string()
    .optional()
    .transform(value => TASK_FREQUENCY_ACCEPTED_UNITS_TO_VALUE[value] || value)
    .oneOf([...Object.values(TASK_FREQUENCY_ACCEPTED_UNITS), null]),
});

export const TaskTemplateDesignation = yup.object().shape({
  taskTemplateId: yup.string().required(),
  designationId: yup.string().required(),
});

export const ProcedureTypeSurvey = yup.object().shape({
  // id is auto generated by db, so don't require it on import
  procedureTypeId: yup.string().required(),
  surveyId: yup.string().required(),
});

export const ReferenceMedicationTemplate = yup
  .object()
  .shape({
    id: yup.string().required(),
    referenceDataId: yup.string().required(),
    isPrn: yup.boolean().default(false),
    isVariableDose: yup.boolean().default(false),
    doseAmount: yup
      .number()
      .nullable()
      .positive()
      .when('isVariableDose', {
        is: false,
        then: schema => schema.required('Dose amount is required when isVariableDose is false.'),
        otherwise: schema => schema.nullable(),
      }),
    units: yup.string().required().oneOf(Object.values(DRUG_UNITS)),
    frequency: yup.string().required().oneOf(Object.values(ADMINISTRATION_FREQUENCIES)),
    route: yup
      .string()
      .required()
      .oneOf(Object.values(DRUG_ROUTE_VALUES))
      .transform(
        value =>
          Object.keys(DRUG_ROUTE_LABELS).find(key => DRUG_ROUTE_LABELS[key] === value) || value,
      ),

    durationValue: yup.number().nullable().positive(),
    durationUnit: yup
      .string()
      .oneOf([...Object.values(MEDICATION_DURATION_UNITS), null])
      .nullable(),
    notes: yup.string().optional().nullable(),
    dischargeQuantity: yup.number().optional().nullable().positive(),
    isOngoing: yup.boolean().default(false),
  })
  .test('duration-paired', null, function ({ durationValue, durationUnit }) {
    if (durationValue && !durationUnit) {
      return this.createError({
        path: 'durationUnit',
        message: 'Duration unit is required when duration value is provided.',
      });
    }
    if (!durationValue && durationUnit) {
      return this.createError({
        path: 'durationValue',
        message: 'Duration value is required when duration unit is provided.',
      });
    }
    return true;
  })
  .test(
    'forbid-duration-when-frequency-is-immediately',
    null,
    function ({ frequency, durationValue, durationUnit }) {
      if (frequency === ADMINISTRATION_FREQUENCIES.IMMEDIATELY && (durationValue || durationUnit)) {
        return this.createError({
          path: 'durationValue',
          message: 'Duration is not allowed when frequency is Immediately.',
        });
      }
      return true;
    },
  )
  .test(
    'forbid-duration-when-medication-is-ongoing',
    null,
    function ({ isOngoing, durationValue, durationUnit }) {
      if (isOngoing && (durationValue || durationUnit)) {
        return this.createError({
          path: 'durationValue',
          message: 'Duration is not allowed when medication is ongoing.',
        });
      }
      return true;
    },
  );

export const ReferenceDrugFacility = yup.object().shape({
  referenceDrugId: yup.string().required(),
  facilityId: yup.string().required(),
  quantity: yup.number().integer().nullable(),
  stockStatus: yup.string().oneOf(Object.values(DRUG_STOCK_STATUSES)),
});
