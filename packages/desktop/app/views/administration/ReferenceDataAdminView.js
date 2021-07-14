import React, { memo, useState, useCallback } from 'react';
import styled from 'styled-components';

import { readFileSync } from 'fs';

import { useApi } from '../../api';
import { CheckArrayInput } from '../../components/Field/CheckArrayInput';
import { DataDocumentUploadForm } from './DataDocumentUploadForm';

function readFileAsBlob(path) {
  const fileData = readFileSync(path);
  return new Blob([fileData]);
}

const Container = styled.div`
  padding: 32px;
`;

import { Field } from '../../components/Field';

export const ReferenceDataAdminView = memo(() => {
  const api = useApi();
  const onSubmit = useCallback(
    async ({ file, ...data }) => {
      const fileData = readFileAsBlob(file);
      // send to api
      const response = await api.multipart('admin/importData', {
        file: fileData,
        ...data,
      });

      return response;
    }
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
        { value: 'imagingTypes', label: 'imagingType' },
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
        { value: 'users', label: 'user' },
        { value: 'patients', label: 'patient' },
        { value: 'labTestTypes', label: 'labTestType' },
        { value: 'vaccineSchedules', label: 'scheduledVaccine' },
      ]}
    />
  );

  return (
    <Container>
      <h1>Data admin</h1>
      <DataDocumentUploadForm
        onSubmit={onSubmit}
        additionalFields={whitelist}
      />
    </Container>
  );
});
