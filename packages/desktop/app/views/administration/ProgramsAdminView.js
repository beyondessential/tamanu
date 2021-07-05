import React, { memo, useState, useCallback } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { 
  Form,
  Field,
  TextField,
  CheckField,
} from 'desktop/app/components/Field';
import { FileChooserField, FILTER_EXCEL } from 'desktop/app/components/Field/FileChooserField';
import { FormGrid } from 'desktop/app/components/FormGrid';
import { ButtonRow } from 'desktop/app/components/ButtonRow';

// import { readFileSync } from 'fs';

import { Button } from 'desktop/app/components/Button';

const Container = styled.div`
  padding: 32px;
`;

/*
function readFileAsBlob(path) {
  const fileData = readFileSync(path);
  return new Blob([fileData]);
}
*/

const ProgramUploadForm = ({ handleSubmit }) => (
  <FormGrid columns={1}>
    <Field
      component={CheckField}
      label="Test run"
      name="dryRun"
      required
    />
    <Field
      component={CheckField}
      label="Skip invalid records"
      name="allowErrors"
      required
    />
    <Field
      component={FileChooserField}
      filters={[FILTER_EXCEL]}
      label="Select file"
      name="file"
      required
    />
    <ButtonRow>
      <Button onClick={handleSubmit} variant="contained" color="primary">
        Upload
      </Button>
    </ButtonRow>
  </FormGrid>
);

const SuccessDisplay = ({ successInfo }) => {
  if (!successInfo) {
    return null;
  }

  return (
    <div>
      <h3>Import successful!</h3>
      <p>{`Imported survey ${successInfo.survey.name} for program ${successInfo.program.name}.`}</p>
      <hr />
    </div>
  );
};

export const ProgramsAdminView = memo(({ onSubmit }) => {
  const [resetKey, setResetKey] = useState(Math.random());
  const [successInfo, setSuccessInfo] = useState(null);

  const onSubmitUpload = useCallback(
    async ({ file, ...data }) => {
      const results = await onSubmit({
        // file: readFileAsBlob(file),
        ...data,
      });
      // reset the form
      setResetKey(Math.random());
      setSuccessInfo(results);
    },
    [onSubmit],
  );

  return (
    <Container>
      <h1>Programs admin</h1>
      <SuccessDisplay successInfo={successInfo} />
      <Form
        key={resetKey}
        onSubmit={onSubmitUpload}
        validationSchema={yup.object().shape({
          dryRun: yup.bool(),
          allowErrors: yup.bool(),
          file: yup.string().required(),
        })}
        render={ProgramUploadForm}
      />
    </Container>
  );
});
