import React from 'react';
import { ImporterView } from './components/ImporterView';

const ALLOWLIST = [
  'additionalInvoiceLine',
  'administeredVaccine',
  'allergy',
  'careplan',
  'certifiableVaccine',
  'country',
  'department',
  'diagnosis',
  'dischargeDisposition',
  'division',
  'drug',
  'ethnicity',
  'facility',
  'imagingType',
  'invoiceLineType',
  'invoicePriceChangeType',
  'labTestCategory',
  'labTestLaboratory',
  'labTestMethod',
  'labTestPriority',
  'labTestType',
  'location',
  'manufacturer',
  'medicalarea',
  'nationality',
  'nursingzone',
  'occupation',
  'patientBillingType',
  'patient',
  'procedureType',
  'religion',
  'settlement',
  'subdivision',
  'triageReason',
  'user',
  'scheduledVaccine',
  'village',
  'xRayImagingArea',
  'ctScanImagingArea',
  'ultrasoundImagingArea',
  'echocardiogramImagingArea',
  'mriImagingArea',
  'mammogramImagingArea',
  'ecgImagingArea',
  'holterMonitorImagingArea',
  'endoscopyImagingArea',
  'fluroscopyImagingArea',
  'angiogramImagingArea',
  'colonoscopyImagingArea',
  'vascularStudyImagingArea',
  'stressTestImagingArea',
  'referralSource',
];

export const ReferenceDataAdminView = () => (
  <ImporterView
    title="Import reference data"
    endpoint="admin/importRefData"
    whitelist={ALLOWLIST}
  />
);
