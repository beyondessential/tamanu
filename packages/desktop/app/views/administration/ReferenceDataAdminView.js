import React, { memo, useState, useCallback } from 'react';
import { sum } from 'lodash';
import styled from 'styled-components';
import * as yup from 'yup';

import { useApi } from 'desktop/app/api';
import { ContentPane } from 'desktop/app/components';
import { Form, Field, CheckField } from 'desktop/app/components/Field';
import { FileChooserField, FILTER_EXCEL } from 'desktop/app/components/Field/FileChooserField';
import { CheckArrayInput } from 'desktop/app/components/Field/CheckArrayInput';
import { FormGrid } from 'desktop/app/components/FormGrid';
import { ButtonRow } from 'desktop/app/components/ButtonRow';
import { Button } from 'desktop/app/components/Button';
import { Table } from 'desktop/app/components/Table';

const ColorText = styled.span`
  color: ${props => props.color};
`;

const ERROR_COLUMNS = [
  { key: 'sheet', title: 'Sheet', width: 1 },
  { key: 'row', title: 'Row' },
  { key: 'kind', title: 'Error' },
  {
    key: 'error',
    title: 'Message',
    accessor: data => <ColorText color="red">{data.message}</ColorText>,
  },
];

const ImportErrorsTable = ({ errors }) => (
  <Table columns={ERROR_COLUMNS} noDataMessage="All good!" data={errors} />
);

const STATS_COLUMNS = [
  { key: 'key', title: 'Table' },
  { key: 'created', title: 'Created' },
  { key: 'updated', title: 'Updated' },
  {
    key: 'errored',
    title: 'Errored',
    accessor: ({ errored }) => (
      <ColorText color={errored > 0 ? 'red' : 'green'}>{errored}</ColorText>
    ),
  },
];

const ImportStatsDisplay = ({ stats }) => (
  <Table
    rowIdKey="key"
    columns={STATS_COLUMNS}
    noDataMessage="Nothing there"
    data={Object.entries(stats).map(([key, data]) => ({ key, ...data }))}
  />
);

const UploadForm = ({ submitForm, isSubmitting }) => (
  <FormGrid columns={1}>
    <Field component={CheckField} label="Test run" name="dryRun" required />
    <Field
      component={FileChooserField}
      filters={[FILTER_EXCEL]}
      label="Select file"
      name="file"
      required
    />
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
    <ButtonRow>
      <Button disabled={isSubmitting} onClick={submitForm} variant="contained" color="primary">
        Import data
      </Button>
    </ButtonRow>
  </FormGrid>
);

function sumStat(stats, fields = ['created', 'updated', 'errored']) {
  return sum(Object.values(stats).map(stat => sum(fields.map(f => stat[f]))));
}

const OutcomeHeader = ({ result }) => {
  let head;
  if (result.didntSendReason === 'validationFailed') {
    head = <h3>Please correct these validation issues and try again</h3>;
  } else if (result.didntSendReason === 'dryRun') {
    head = <h3>Test import finished successfully</h3>;
  } else if (result.didntSendReason) {
    head = <h3>{`Import failed! server reports "${result.didntSendReason}"`}</h3>;
  } else if (!result.errors?.length) {
    head = <h3>Import successful!</h3>;
  } else {
    head = <h3>Import failed - unknown server error</h3>;
  }

  return (
    <>
      {head}
      <p>
        {`Time: ${result.duration.toFixed(2)}s — Records: ` +
          `${sumStat(result.stats, ['created'])} created, ` +
          `${sumStat(result.stats, ['updated'])} updated, ` +
          `${sumStat(result.stats, ['errored'])} errored, ` +
          `${sumStat(result.stats)} total`}
      </p>
    </>
  );
};

const OutcomeDisplay = ({ result }) => {
  if (!result) {
    return null;
  }

  return (
    <div>
      <OutcomeHeader result={result} />
      <hr />
      <h4>Summary</h4>
      <ImportStatsDisplay stats={result.stats} />
      {result.errors.length ? (
        <>
          <h4>Errors</h4>
          <ImportErrorsTable errors={result.errors} />
        </>
      ) : null}
    </div>
  );
};

export const ReferenceDataAdminView = memo(({ additionalFields }) => {
  const [resetKey, setResetKey] = useState(Math.random());
  const [result, setResult] = useState(null);

  const api = useApi();

  const onSubmitUpload = useCallback(
    async ({ file, ...data }) => {
      const intermediateResult = await api.postWithFileUpload('admin/importRefData', file, data);

      if (intermediateResult.sentData) {
        // reset the form
        setResetKey(Math.random());
      }

      setResult(intermediateResult);
      return true;
    },
    [api, onReceiveResult],
  );

  const renderForm = useCallback(props => <UploadForm {...props} />, []);

  return (
    <ContentPane>
      <h1>Import reference data</h1>
      <Form
        key={resetKey}
        onSubmit={onSubmitUpload}
        validationSchema={yup.object().shape({
          dryRun: yup.bool(),
          file: yup.string(),
        })}
        initialValues={{
          dryRun: true,
        }}
        render={renderForm}
      />
      <OutcomeDisplay result={result} />
    </ContentPane>
  );
});
