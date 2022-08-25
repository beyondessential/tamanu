import React, { memo, useState, useCallback } from 'react';
import * as yup from 'yup';

import { Form, Field, CheckField } from 'desktop/app/components/Field';
import { FileChooserField, FILTER_EXCEL } from 'desktop/app/components/Field/FileChooserField';
import { FormGrid } from 'desktop/app/components/FormGrid';
import { ButtonRow } from 'desktop/app/components/ButtonRow';

import { Button } from 'desktop/app/components/Button';
import { Notification } from 'desktop/app/components/Notification';

import { useAuth } from 'desktop/app/contexts/Auth';

import { ImportStatsDisplay } from './components/ImportStatsDisplay';
import { ImportErrorsTable } from './components/ImportErrorsTable';

const ProgramUploadForm = ({ submitForm, isSubmitting, additionalFields }) => (
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
  if (result.sentData) {
    return (
      <h3>
        {`Import successful! Sent ${
          result.stats.records.total
        } records in ${result.duration.toFixed(2)}s`}
      </h3>
    );
  }
  if (result.didntSendReason === 'validationFailed') {
    return <h3>Please correct these validation issues and try again</h3>;
  }
  if (result.didntSendReason === 'dryRun') {
    return <h3>Test import finished</h3>;
  }
  return <h3>{`Import failed - server reports "${result.didntSendReason}"`}</h3>;
};

const OutcomeDisplay = ({ result }) => {
  if (!result) {
    return null;
  }

  return (
    <div>
      <OutcomeHeader result={result} />
      <hr />
      <div>{`Target server: ${result.serverInfo?.host}`}</div>
      <h4>Records imported</h4>
      <ImportStatsDisplay stats={result.stats} />
      <h4>Validation results</h4>
      <ImportErrorsTable errors={result.errors} />
    </div>
  );
};

export const DataDocumentUploadForm = memo(({ onSubmit, onReceiveResult, additionalFields }) => {
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
    props => <ProgramUploadForm {...props} additionalFields={additionalFields} />,
    [additionalFields],
  );

  const { ability } = useAuth();

  // TODO: finer grained access to uploads
  const permissions = [
    ability.can('write', 'User'),
    ability.can('write', 'Role'),
    ability.can('write', 'Permission'),
    ability.can('write', 'ReferenceData'),
    ability.can('write', 'Program'),
    ability.can('write', 'Survey'),
  ];

  if (permissions.some(x => !x)) {
    return <Notification message="You do not have permission to perform data document uploads." />;
  }

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
        pingu="1231231"
      />
      <OutcomeDisplay result={result} />
    </>
  );
});
