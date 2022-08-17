import React, { memo, useState, useCallback } from 'react';
import { startCase, sum } from 'lodash';
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

const UploadForm = ({ submitForm, isSubmitting, whitelist }) => (
  <FormGrid columns={1}>
    <Field component={CheckField} label="Test run" name="dryRun" required />
    <Field
      component={FileChooserField}
      filters={[FILTER_EXCEL]}
      label="Select file"
      name="file"
      required
    />
    {whitelist && (
      <Field
        name="whitelist"
        label="Only import some (select none to import everything)"
        component={CheckArrayInput}
        options={whitelist.map(value => ({ value, label: startCase(value) }))}
      />
    )}
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

export const AdminView = memo(({ title, endpoint, whitelist }) => {
  const [resetKey, setResetKey] = useState(Math.random());
  const [result, setResult] = useState(null);

  const api = useApi();

  const onSubmitUpload = useCallback(
    async ({ file, ...data }) => {
      const intermediateResult = await api.postWithFileUpload(endpoint, file, data);

      if (intermediateResult.sentData) {
        // reset the form
        setResetKey(Math.random());
      }

      setResult(intermediateResult);
      return true;
    },
    [api],
  );

  const renderForm = useCallback(props => <UploadForm whitelist={whitelist} {...props} />, []);

  return (
    <ContentPane>
      <h1>{title}</h1>
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
