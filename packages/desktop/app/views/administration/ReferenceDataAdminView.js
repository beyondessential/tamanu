import React from 'react';
import { ImporterView } from './components/ImporterView';

const ALLOWLIST = [
  'additionalInvoiceLines',
  'administeredVaccines',
  'allergies',
  'careplans',
  'certifiableVaccines',
  'countries',
  'departments',
  'diagnoses',
  'divisions',
  'drugs',
  'ethnicities',
  'facilities',
  'imagingTypes',
  'invoiceLineTypes',
  'invoicePriceChangeTypes',
  'labTestCategories',
  'labTestLaboratory',
  'labTestMethods',
  'labTestPriorities',
  'labTestTypes',
  'locations',
  'manufacturers',
  'medicalareas',
  'nationalities',
  'nursingzones',
  'occupations',
  'patientBillingType',
  'patients',
  'procedures',
  'religions',
  'settlements',
  'subdivisions',
  'triageReasons',
  'users',
  'vaccineSchedules',
  'villages',
  'xRayImagingAreas',
  'ctScanImagingAreas',
  'ultrasoundImagingAreas',
  'echocardiogramImagingAreas',
  'mriImagingAreas',
  'mammogramImagingAreas',
  'ecgImagingAreas',
  'holterMonitorImagingAreas',
  'endoscopyImagingAreas',
  'fluroscopyImagingAreas',
  'angiogramImagingAreas',
  'colonoscopyImagingAreas',
  'vascularStudyImagingAreas',
  'stressTestImagingAreas',
];

export const ReferenceDataAdminView = () => (
  <ImporterView
    title="Import reference data"
    endpoint="admin/importRefData"
    whitelist={ALLOWLIST}
  />
);
