import React, { memo, useCallback } from 'react';
import { ContentPane } from '../../components';
import { useApi } from '../../api';
import { CheckArrayInput } from '../../components/Field/CheckArrayInput';
import { RefDataUploadForm } from './RefDataUploadForm';
import { Field } from '../../components/Field';

export const ReferenceDataAdminView = memo(() => {
  const api = useApi();
  const onSubmit = useCallback(
    ({ file, ...data }) => api.postWithFileUpload('admin/importRefData', file, data),
    [api],
  );

  const whitelist = (
    <Field
      name="whitelist"
      label="Sheets"
      component={CheckArrayInput}
      options={[
        { value: 'additionalInvoiceLines', label: 'additionalInvoiceLine' },
        { value: 'administeredVaccines', label: 'administeredVaccine' },
        { value: 'allergies', label: 'allergy' },
        { value: 'careplans', label: 'carePlan' },
        { value: 'certifiableVaccines', label: 'certifiableVaccine' },
        { value: 'countries', label: 'country' },
        { value: 'departments', label: 'department' },
        { value: 'diagnoses', label: 'icd10' },
        { value: 'divisions', label: 'division' },
        { value: 'drugs', label: 'drug' },
        { value: 'ethnicities', label: 'ethnicity' },
        { value: 'facilities', label: 'facility' },
        { value: 'imagingTypes', label: 'imagingType' },
        { value: 'invoiceLineTypes', label: 'invoiceLineType' },
        { value: 'invoicePriceChangeTypes', label: 'invoicePriceChangeType' },
        { value: 'labTestCategories', label: 'labTestCategory' },
        { value: 'labTestLaboratory', label: 'labTestLaboratory' },
        { value: 'labTestMethods', label: 'labTestMethod' },
        { value: 'labTestPriorities', label: 'labTestPriority' },
        { value: 'labTestTypes', label: 'labTestType' },
        { value: 'locations', label: 'location' },
        { value: 'manufacturers', label: 'manufacturer' },
        { value: 'medicalareas', label: 'medicalArea' },
        { value: 'nationalities', label: 'nationality' },
        { value: 'nursingzones', label: 'nursingZone' },
        { value: 'occupations', label: 'occupation' },
        { value: 'patientBillingType', label: 'patientBillingType' },
        { value: 'patients', label: 'patient' },
        { value: 'procedures', label: 'procedureType' },
        { value: 'religions', label: 'religion' },
        { value: 'settlements', label: 'settlement' },
        { value: 'subdivisions', label: 'subdivision' },
        { value: 'triageReasons', label: 'triageReason' },
        { value: 'users', label: 'user' },
        { value: 'vaccineSchedules', label: 'scheduledVaccine' },
        { value: 'villages', label: 'village' },
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
      <RefDataUploadForm onSubmit={onSubmit} additionalFields={whitelist} />
    </ContentPane>
  );
});
