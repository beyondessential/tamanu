import { IMAGING_AREA_TYPES } from './imaging.js';

// Reference data stored IN the "reference_data" table
export const REFERENCE_TYPES = {
  ALLERGY: 'allergy',
  APPOINTMENT_TYPE: 'appointmentType',
  BOOKING_TYPE: 'bookingType',
  CATCHMENT: 'catchment',
  DRUG: 'drug',
  DIET: 'diet',
  DESIGNATION: 'designation',
  TRIAGE_REASON: 'triageReason',
  PROCEDURE_TYPE: 'procedureType',
  IMAGING_TYPE: 'imagingType',
  LAB_SAMPLE_SITE: 'labSampleSite',
  LAB_TEST_CATEGORY: 'labTestCategory',
  LAB_TEST_PRIORITY: 'labTestPriority',
  LAB_TEST_LABORATORY: 'labTestLaboratory',
  LAB_TEST_METHOD: 'labTestMethod',
  VILLAGE: 'village',
  CARE_PLAN: 'carePlan',
  ETHNICITY: 'ethnicity',
  NATIONALITY: 'nationality',
  COUNTRY: 'country',
  CONTACT_RELATIONSHIP: 'contactRelationship',
  DIVISION: 'division',
  DIAGNOSIS: 'diagnosis',
  DISEASE_CODING: 'diseaseCoding',
  SUBDIVISION: 'subdivision',
  MEDICAL_AREA: 'medicalArea',
  NURSING_ZONE: 'nursingZone',
  SETTLEMENT: 'settlement',
  OCCUPATION: 'occupation',
  PLACE_OF_BIRTH: 'placeOfBirth',
  RELIGION: 'religion',
  REACTION: 'reaction',
  FAMILY_RELATION: 'familyRelation',
  PATIENT_BILLING_TYPE: 'patientBillingType',
  MANUFACTURER: 'manufacturer',
  SECONDARY_ID_TYPE: 'secondaryIdType',
  DISCHARGE_DISPOSITION: 'dischargeDisposition',
  REFERRAL_SOURCE: 'referralSource',
  ARRIVAL_MODE: 'arrivalMode',
  VACCINE_NOT_GIVEN_REASON: 'vaccineNotGivenReason',
  VACCINE_CIRCUMSTANCE: 'vaccineCircumstance',
  SPECIMEN_TYPE: 'specimenType',
  INSURER: 'insurer',
  PAYMENT_METHOD: 'paymentMethod',
  TASK_TEMPLATE: 'taskTemplate',
  TASK_SET: 'taskSet',
  TASK_NOT_COMPLETED_REASON: 'taskNotCompletedReason',
  TASK_DELETION_REASON: 'taskDeletionReason',
  MEDICATION_NOT_GIVEN_REASON: 'medicationNotGivenReason',
  MEDICATION_TEMPLATE: 'medicationTemplate',
  MEDICATION_SET: 'medicationSet',
  ...IMAGING_AREA_TYPES,
};
export const REFERENCE_TYPE_VALUES = Object.values(REFERENCE_TYPES);

// Reference data stored in its own table (not in 'reference_data' table)

export const OTHER_REFERENCE_TYPES = {
  DEPARTMENT: 'department',
  FACILITY: 'facility',
  INVOICE_PRODUCT: 'invoiceProduct',
  LAB_TEST_TYPE: 'labTestType',
  LAB_TEST_PANEL: 'labTestPanel',
  LOCATION: 'location',
  LOCATION_GROUP: 'locationGroup',
  PATIENT_FIELD_DEFINITION: 'patientFieldDefinition',
  PATIENT_FIELD_DEFINITION_CATEGORY: 'patientFieldDefinitionCategory',
  INVOICE_PRICE_LIST: 'invoicePriceList',
  INVOICE_PRICE_LIST_ITEM: 'invoicePriceListItem',
  INVOICE_INSURANCE_PLAN: 'invoiceInsurancePlan',
  INVOICE_INSURANCE_PLAN_ITEM: 'invoiceInsurancePlanItem',
  SCHEDULED_VACCINE: 'scheduledVaccine',
};

export const OTHER_REFERENCE_TYPE_VALUES = Object.values(OTHER_REFERENCE_TYPES);

// Reference data imported through the program importer rather than the reference data importer
export const PROGRAM_REFERENCE_TYPES = {
  PROGRAM_REGISTRY_CLINICAL_STATUS: 'programRegistryClinicalStatus',
  PROGRAM_REGISTRY_CONDITION_CATEGORY: 'programRegistryConditionCategory',
  PROGRAM_REGISTRY_CONDITION: 'programRegistryCondition',
  PROGRAM_REGISTRY: 'programRegistry',
  PROGRAM: 'program',
  PROGRAM_DATA_ELEMENT: 'programDataElement',
  SURVEY: 'survey',
  SURVEY_SCREEN_COMPONENT: 'surveyScreenComponent',
};

const PROGRAM_REFERENCE_TYPE_VALUES = Object.values(PROGRAM_REFERENCE_TYPES);

export const TRANSLATABLE_REFERENCE_TYPES = [
  ...REFERENCE_TYPE_VALUES,
  ...OTHER_REFERENCE_TYPE_VALUES,
  ...PROGRAM_REFERENCE_TYPE_VALUES,
];

// Data types created through tamanu
const CLINICAL_DATA_TYPES = {
  PATIENT: 'patient',
  ADMINISTERED_VACCINE: 'administeredVaccine',
  USER: 'user',
};
const CLINICAL_DATA_TYPES_VALUES = Object.values(CLINICAL_DATA_TYPES);

// System data used for configuration purposes
export const SYSTEM_DATA_TYPES = {
  REFERENCE_DATA_RELATION: 'referenceDataRelation',
  CERTIFIABLE_VACCINE: 'certifiableVaccine',
  IMAGING_AREA_EXTERNAL_CODE: 'imagingAreaExternalCode',
  IMAGING_TYPE_EXTERNAL_CODE: 'imagingTypeExternalCode',
};
const SYSTEM_DATA_TYPES_VALUES = Object.values(SYSTEM_DATA_TYPES);

export const GENERAL_IMPORTABLE_DATA_TYPES = [
  ...REFERENCE_TYPE_VALUES,
  ...OTHER_REFERENCE_TYPE_VALUES,
  ...CLINICAL_DATA_TYPES_VALUES,
  ...SYSTEM_DATA_TYPES_VALUES,
].sort();

export const PERMISSION_IMPORTABLE_DATA_TYPES = ['permission', 'role'];

export const VISIBILITY_STATUSES = {
  CURRENT: 'current',
  HISTORICAL: 'historical',
  MERGED: 'merged',
};

export const VISIBILITY_STATUS_VALUES = Object.values(VISIBILITY_STATUSES);

export const HIDDEN_VISIBILITY_STATUSES = [
  VISIBILITY_STATUSES.HISTORICAL,
  VISIBILITY_STATUSES.MERGED,
];

export const ASSET_NAMES = {
  LETTERHEAD_LOGO: 'letterhead-logo',
  VACCINE_CERTIFICATE_WATERMARK: 'vaccine-certificate-watermark',
  CERTIFICATE_BOTTOM_HALF_IMG: 'certificate-bottom-half-img',
  DEATH_CERTIFICATE_BOTTOM_HALF_IMG: 'death-certificate-bottom-half-img',
  COVID_VACCINATION_CERTIFICATE_FOOTER: 'covid-vaccination-certificate-footer-img',
  COVID_CLEARANCE_CERTIFICATE_FOOTER: 'covid-clearance-certificate-footer-img',
  COVID_TEST_CERTIFICATE_FOOTER: 'covid-test-certificate-footer-img',
  VACCINATION_CERTIFICATE_FOOTER: 'vaccination-certificate-footer-img',
};

export const ASSET_NAME_LABELS = {
  [ASSET_NAMES.LETTERHEAD_LOGO]: 'letterhead-logo',
  [ASSET_NAMES.VACCINE_CERTIFICATE_WATERMARK]: 'vaccine-certificate-watermark',
  [ASSET_NAMES.CERTIFICATE_BOTTOM_HALF_IMG]: 'certificate-bottom-half-img',
  [ASSET_NAMES.DEATH_CERTIFICATE_BOTTOM_HALF_IMG]: 'death-certificate-bottom-half-img',
  [ASSET_NAMES.COVID_VACCINATION_CERTIFICATE_FOOTER]: 'covid-vaccination-certificate-footer-img',
  [ASSET_NAMES.COVID_CLEARANCE_CERTIFICATE_FOOTER]: 'covid-clearance-certificate-footer-img',
  [ASSET_NAMES.COVID_TEST_CERTIFICATE_FOOTER]: 'covid-test-certificate-footer-img',
  [ASSET_NAMES.VACCINATION_CERTIFICATE_FOOTER]: 'vaccination-certificate-footer-img',
};

export const ASSET_FALLBACK_NAMES = {
  [ASSET_NAMES.COVID_VACCINATION_CERTIFICATE_FOOTER]: ASSET_NAMES.CERTIFICATE_BOTTOM_HALF_IMG,
  [ASSET_NAMES.COVID_CLEARANCE_CERTIFICATE_FOOTER]: ASSET_NAMES.CERTIFICATE_BOTTOM_HALF_IMG,
  [ASSET_NAMES.COVID_TEST_CERTIFICATE_FOOTER]: ASSET_NAMES.CERTIFICATE_BOTTOM_HALF_IMG,
  [ASSET_NAMES.VACCINATION_CERTIFICATE_FOOTER]: ASSET_NAMES.CERTIFICATE_BOTTOM_HALF_IMG,
};

export const ASSET_MIME_TYPES = {
  png: 'image/png',
  svg: 'image/svg',
};

export const LOCATION_BOOKABLE_VIEW = {
  ALL: 'all',
  NO: 'no',
  DAILY: 'daily',
  WEEKLY: 'weekly',
};

export const LOCATION_BOOKABLE_VIEW_VALUES = Object.values(LOCATION_BOOKABLE_VIEW);
