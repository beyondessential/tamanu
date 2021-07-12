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
      console.log(data);
      return;
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
        { value: 'abc', label: 'Abc' },
        { value: 'def', label: 'Def' },
        { value: 'ghi', label: 'Ghi' },
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
