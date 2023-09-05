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
  'labPanel',
  'labTestType',
  'location',
  'patient',
  'patientLabTestCategories',
  'patientLabPanelTypes',
  'patientLetterTemplate',
  'practitioner',
  'survey',
];
