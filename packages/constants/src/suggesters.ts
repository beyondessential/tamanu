import { OTHER_REFERENCE_TYPES, REFERENCE_TYPE_VALUES } from './importable.js';

export const SUGGESTER_ENDPOINTS_SUPPORTING_ALL = [
  ...REFERENCE_TYPE_VALUES,
  OTHER_REFERENCE_TYPES.LAB_TEST_PANEL,
  OTHER_REFERENCE_TYPES.LAB_TEST_TYPE,
  OTHER_REFERENCE_TYPES.LOCATION_GROUP,
  OTHER_REFERENCE_TYPES.INVOICE_INSURANCE_PLAN,
];

export const SUGGESTER_ENDPOINTS = [
  ...SUGGESTER_ENDPOINTS_SUPPORTING_ALL,
  'department',
  'facility',
  'facilityLocationGroup',
  'bookableLocationGroup',
  'invoiceProduct',
  'location',
  'multiReferenceData',
  'patient',
  'patientLabTestCategories',
  'patientLabTestPanelTypes',
  'template',
  'practitioner',
  'programRegistry',
  'programRegistryClinicalStatus',
  'programRegistryCondition',
  'survey',
  'sensitiveLabTestCategory',
  'nonSensitiveLabTestCategory',
  'role',
  'encounter',
  'reportDefinition',
];
