import React, { memo, useState, useCallback } from 'react';
import styled from 'styled-components';

import * as yup from 'yup';

import { Form, Field, CheckField } from 'desktop/app/components/Field';
import { FileChooserField, FILTER_EXCEL } from 'desktop/app/components/Field/FileChooserField';
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
  <Table
    columns={ERROR_COLUMNS}
    noDataMessage="All good!"
    data={errors}
  />
);

const STATS_COLUMNS = [
  { key: 'key', title: 'Table' },
  { key: 'created', title: 'Created' },
  { key: 'updated', title: 'Updated' },
  {
    key: 'errored',
    title: 'Errored',
    accessor: ({ errored }) => <ColorText color={errored > 0 ? 'red' : 'green'}>{errored}</ColorText>,
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

const UploadForm = ({ submitForm, isSubmitting, additionalFields }) => (
  <FormGrid columns={1}>
    <Field component={CheckField} label="Test run" name="dryRun" required />
    <Field component={CheckField} label="Skip invalid records" name="allowErrors" required />
    <Field
      component={FileChooserField}
      filters={[FILTER_EXCEL]}
      label="Select file"
      name="file"
      required
    />
    {additionalFields || null}
    <ButtonRow>
      <Button disabled={isSubmitting} onClick={submitForm} variant="contained" color="primary">
        Upload
      </Button>
    </ButtonRow>
  </FormGrid>
);

const OutcomeHeader = ({ result }) => {
  if (result.didntSendReason === 'validationFailed') {
    return <h3>Please correct these validation issues and try again</h3>;
  } else if (result.didntSendReason === 'dryRun') {
    return <h3>Test import finished</h3>;
  } else if (result.didntSendReason) {
    return <h3>{`Import failed - server reports "${result.didntSendReason}"`}</h3>;
  } else if (!result.errors?.length) {
    return (
      <h3>
        {`Import successful! Sent ${Object.values(result.stats).reduce(
          (memo, { created, updated }) => memo + created + updated,
          0,
        )} records in ${result.duration.toFixed(2)}s`}
      </h3>
    );
  } else {
    return <h3>Import failed - unknown server error</h3>;
  }
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
      {result.errors.length && <>
        <h4>Errors</h4>
        <ImportErrorsTable errors={result.errors} />
      </>}
    </div>
  );
};

export const RefDataUploadForm = memo(({ onSubmit, onReceiveResult, additionalFields }) => {
  const [resetKey, setResetKey] = useState(Math.random());
  const [result, setResult] = useState(null);

  const onSubmitUpload = useCallback(
    async data => {
      const intermediateResult = await onSubmit(data);

      if (intermediateResult.sentData) {
        // reset the form
        setResetKey(Math.random());
      }

      setResult(intermediateResult);
      if (onReceiveResult) {
        onReceiveResult(intermediateResult);
      }
      return true;
    },
    [onSubmit, onReceiveResult],
  );

  const renderForm = useCallback(
    props => <UploadForm {...props} additionalFields={additionalFields} />,
    [additionalFields],
  );

  return (
    <>
      <Form
        key={resetKey}
        onSubmit={onSubmitUpload}
        validationSchema={yup.object().shape({
          dryRun: yup.bool(),
          allowErrors: yup.bool(),
          file: yup.string(),
        })}
        initialValues={{
          dryRun: true,
        }}
        render={renderForm}
      />
      <OutcomeDisplay result={result} />
    </>
  );
});
