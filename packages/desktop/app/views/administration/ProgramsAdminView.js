import React, { memo, useState, useCallback } from 'react';
import styled from 'styled-components';
import * as yup from 'yup';

import { Form, Field, TextField } from 'desktop/app/components/Field';
import { FileChooserField, FILTER_EXCEL } from 'desktop/app/components/Field/FileChooserField';
import { FormGrid } from 'desktop/app/components/FormGrid';
import { ButtonRow } from 'desktop/app/components/ButtonRow';

import { remote } from 'electron';

import { readFileSync, existsSync } from 'fs';

import { Button } from 'desktop/app/components/Button';

import { connectApi } from '../../api';

const Container = styled.div`
  padding: 32px;
`;

function readFileAsBlob(path) {
  const fileData = readFileSync(path);
  return new Blob([fileData]);
}

const ProgramUploadForm = ({ handleSubmit }) => (
  <FormGrid columns={1}>
    <Field
      component={TextField}
      label="Program name"
      name="programName"
      required
    />
    <Field
      component={TextField}
      label="Survey name"
      name="surveyName"
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

const DumbProgramsAdminView = memo(({ onSubmit, onCancel }) => {
  const onSubmitUpload = useCallback(({ file, ...data }) => onSubmit({
    file: readFileAsBlob(file),
    ...data,
  }), [onSubmit]);

  return (
    <Container>
      <h1>Programs admin</h1>
      <Form
        onSubmit={onSubmitUpload}
        initialValues={{
        }}
        validationSchema={yup.object().shape({
          programName: yup.string().required(),
          surveyName: yup.string().required(),
          file: yup.string().required(),
        })}
        render={ProgramUploadForm}
      />
    </Container>
  );
});

export const ProgramsAdminView = connectApi(api => ({
  onSubmit: async data => api.multipart('program', data),
}))(DumbProgramsAdminView);
