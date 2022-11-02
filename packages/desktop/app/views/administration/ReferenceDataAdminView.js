import React from 'react';
import { ImporterView } from './components/ImporterView';

const ALLOWLIST = [
  'additionalInvoiceLine',
  'administeredVaccine',
  'allergy',
  'angiogramImagingArea',
  'arrivalMode',
  'careplan',
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
  'imagingType',
  'invoiceLineType',
  'invoicePriceChangeType',
  'labTestCategory',
  'labTestLaboratory',
  'labTestMethod',
  'labTestPriority',
  'labTestType',
  'location',
  'mammogramImagingArea',
  'manufacturer',
  'medicalarea',
  'mriImagingArea',
  'nationality',
  'nursingzone',
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
  'stressTestImagingArea',
  'subdivision',
  'triageReason',
  'ultrasoundImagingArea',
  'user',
  'vascularStudyImagingArea',
  'village',
  'xRayImagingArea',
].sort();

export const ReferenceDataAdminView = () => (
  <ImporterView
    title="Import reference data"
    endpoint="admin/importRefData"
    whitelist={ALLOWLIST}
  />
);
