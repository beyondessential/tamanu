import React, { memo, useCallback } from 'react';
import { ContentPane } from '../../components';
import { useApi } from '../../api';
import { CheckArrayInput } from '../../components/Field/CheckArrayInput';
import { DataDocumentUploadForm } from './DataDocumentUploadForm';
import { Field } from '../../components/Field';

export const ReferenceDataAdminView = memo(() => {
  const api = useApi();
  const onSubmit = useCallback(
    ({ file, ...data }) => api.postWithFileUpload('admin/importData', file, data),
    [api],
  );

  const whitelist = (
    <Field
      name="whitelist"
      label="Sheets"
      component={CheckArrayInput}
      options={[
        { value: 'facilities', label: 'facility' },
        { value: 'villages', label: 'village' },
        { value: 'drugs', label: 'drug' },
        { value: 'allergies', label: 'allergy' },
        { value: 'departments', label: 'department' },
        { value: 'locations', label: 'location' },
        { value: 'diagnoses', label: 'icd10' },
        { value: 'triageReasons', label: 'triageReason' },
        { value: 'procedures', label: 'procedureType' },
        { value: 'careplans', label: 'carePlan' },
        { value: 'ethnicities', label: 'ethnicity' },
        { value: 'nationalities', label: 'nationality' },
        { value: 'divisions', label: 'division' },
        { value: 'subdivisions', label: 'subdivision' },
        { value: 'medicalareas', label: 'medicalArea' },
        { value: 'nursingzones', label: 'nursingZone' },
        { value: 'settlements', label: 'settlement' },
        { value: 'occupations', label: 'occupation' },
        { value: 'religions', label: 'religion' },
        { value: 'countries', label: 'country' },
        { value: 'labTestCategories', label: 'labTestCategory' },
        { value: 'patientBillingType', label: 'patientBillingType' },
        { value: 'labTestPriorities', label: 'labTestPriority' },
        { value: 'labTestLaboratory', label: 'labTestLaboratory' },
        { value: 'labTestMethods', label: 'labTestMethod' },
        { value: 'additionalInvoiceLines', label: 'additionalInvoiceLine' },
        { value: 'manufacturers', label: 'manufacturer' },
        { value: 'users', label: 'user' },
        { value: 'patients', label: 'patient' },
        { value: 'labTestTypes', label: 'labTestType' },
        { value: 'certifiableVaccines', label: 'certifiableVaccine' },
        { value: 'vaccineSchedules', label: 'scheduledVaccine' },
        { value: 'invoiceLineTypes', label: 'invoiceLineType' },
        { value: 'invoicePriceChangeTypes', label: 'invoicePriceChangeType' },
        { value: 'administeredVaccines', label: 'administeredVaccine' },
        { value: 'xRayImagingAreas', label: 'xRayImagingArea' },
        { value: 'ctScanImagingAreas', label: 'ctScanImagingArea' },
        { value: 'ultrasoundImagingAreas', label: 'ultrasoundImagingArea' },
        { value: 'echocardiogramImagingAreas', label: 'echocardiogramImagingArea' },
        { value: 'mriImagingAreas', label: 'mriImagingArea' },
        { value: 'mammogramImagingAreas', label: 'mammogramImagingArea' },
        { value: 'ecgImagingAreas', label: 'ecgImagingArea' },
        { value: 'holterMonitorImagingAreas', label: 'holterMonitorImagingArea' },
        { value: 'endoscopyImagingAreas', label: 'endoscopyImagingArea' },
        { value: 'fluroscopyImagingAreas', label: 'fluroscopyImagingArea' },
        { value: 'angiogramImagingAreas', label: 'angiogramImagingArea' },
        { value: 'colonoscopyImagingAreas', label: 'colonoscopyImagingArea' },
        { value: 'vascularStudyImagingAreas', label: 'vascularStudyImagingArea' },
        { value: 'stressTestImagingAreas', label: 'stressTestImagingArea' },
      ]}
    />
  );

  return (
    <ContentPane>
      <h1>Data admin</h1>
      <DataDocumentUploadForm onSubmit={onSubmit} additionalFields={whitelist} />
    </ContentPane>
  );
});
