import { REFERENCE_TYPE_VALUES } from './importable';

export const SUGGESTER_ENDPOINTS_SUPPORTING_ALL = [
  ...REFERENCE_TYPE_VALUES,
  'labTestPanel',
  'labTestType',
  'locationGroup',
];

export const SUGGESTER_ENDPOINTS = [
  ...SUGGESTER_ENDPOINTS_SUPPORTING_ALL,
  'department',
  'facility',
  'facilityLocationGroup',
  'invoiceLineTypes',
  'location',
  'patient',
  'patientLabTestCategories',
  'patientLabTestPanelTypes',
  'patientLetterTemplate',
  'practitioner',
  'survey',
];
