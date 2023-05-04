import { IMAGING_AREA_TYPES } from './imaging';

export const GENERAL_IMPORTABLE_DATA_TYPES = [
  'additionalInvoiceLine',
  'administeredVaccine',
  'allergy',
  'angiogramImagingArea',
  'arrivalMode',
  'carePlan',
  'certifiableVaccine',
  'colonoscopyImagingArea',
  'country',
  'ctScanImagingArea',
  'department',
  'diagnosis',
  'dischargeDisposition',
  'division',
  'drug',
  'ecgImagingArea',
  'echocardiogramImagingArea',
  'endoscopyImagingArea',
  'ethnicity',
  'facility',
  'fluroscopyImagingArea',
  'holterMonitorImagingArea',
  'imagingAreaExternalCode',
  'imagingType',
  'invoiceLineType',
  'invoicePriceChangeType',
  'labTestCategory',
  'labTestLaboratory',
  'labTestMethod',
  'labTestPriority',
  'labTestType',
  'labTestPanel',
  'labSampleSite',
  'location',
  'locationGroup',
  'mammogramImagingArea',
  'manufacturer',
  'medicalArea',
  'mriImagingArea',
  'nationality',
  'nursingZone',
  'occupation',
  'patient',
  'patientBillingType',
  'patientFieldDefinition',
  'patientFieldDefinitionCategory',
  'procedureType',
  'referralSource',
  'religion',
  'scheduledVaccine',
  'secondaryIdType',
  'settlement',
  'specimenType',
  'stressTestImagingArea',
  'subdivision',
  'triageReason',
  'ultrasoundImagingArea',
  'user',
  'vaccine',
  'vascularStudyImagingArea',
  'village',
  'xRayImagingArea',
  'vaccineNotGivenReason',
].sort();

export const PERMISSION_IMPORTABLE_DATA_TYPES = ['permission', 'role'];

export const REFERENCE_TYPES = {
  ICD10: 'icd10',
  ALLERGY: 'allergy',
  CONDITION: 'condition',
  DRUG: 'drug',
  TRIAGE_REASON: 'triageReason',
  PROCEDURE_TYPE: 'procedureType',
  IMAGING_TYPE: 'imagingType',
  LAB_SAMPLE_SITE: 'labSampleSite',
  LAB_TEST_CATEGORY: 'labTestCategory',
  LAB_TEST_PRIORITY: 'labTestPriority',
  LAB_TEST_LABORATORY: 'labTestLaboratory',
  LAB_TEST_METHOD: 'labTestMethod',
  VACCINE: 'vaccine',
  VILLAGE: 'village',
  CARE_PLAN: 'carePlan',
  ETHNICITY: 'ethnicity',
  NATIONALITY: 'nationality',
  COUNTRY: 'country',
  DIVISION: 'division',
  SUBDIVISION: 'subdivision',
  MEDICAL_AREA: 'medicalArea',
  NURSING_ZONE: 'nursingZone',
  SETTLEMENT: 'settlement',
  OCCUPATION: 'occupation',
  SEX: 'sex',
  PLACE_OF_BIRTH: 'placeOfBirth',
  MARITAL_STATUS: 'maritalStatus',
  RELIGION: 'religion',
  FAMILY_RELATION: 'familyRelation',
  PATIENT_TYPE: 'patientType',
  BLOOD_TYPE: 'bloodType',
  SOCIAL_MEDIA_PLATFORM: 'socialMediaPlatform',
  PATIENT_BILLING_TYPE: 'patientBillingType',
  MANUFACTURER: 'manufacturer',
  SECONDARY_ID_TYPE: 'secondaryIdType',
  DISCHARGE_DISPOSITION: 'dischargeDisposition',
  REFERRAL_SOURCE: 'referralSource',
  ARRIVAL_MODE: 'arrivalMode',
  VACCINE_NOT_GIVEN_REASON: 'vaccineNotGivenReason',
  ADDITIONAL_INVOICE_LINE: 'additionalInvoiceLine',
  SPECIMEN_TYPE: 'specimenType',
  ...IMAGING_AREA_TYPES,
};

export const REFERENCE_TYPE_VALUES = Object.values(REFERENCE_TYPES);

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
};

export const ASSET_MIME_TYPES = {
  png: 'image/png',
  svg: 'image/svg',
};
