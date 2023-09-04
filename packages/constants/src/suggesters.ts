import { REFERENCE_TYPE_VALUES } from './importable';

export const SUGGESTER_ENDPOINTS_SUPPORTING_ALL = [
  ...REFERENCE_TYPE_VALUES,
  'labTestPanel',
  'labTestType',
  'locationGroup',
];

export const SUGGESTER_ENDPOINTS_SUPPORTING_ID = [
  ...REFERENCE_TYPE_VALUES,
  'department',
  'facility',
  'facilityLocationGroup',
  'invoiceLineTypes',
  'labTestPanel',
  'location',
  'locationGroup',
  'patient',
  'patientLabTestCategories',
  'patientLabTestPanelTypes',
  'patientLetterTemplate',
  'practitioner',
  'survey',
];
