import React, { memo, useState, useCallback } from 'react';
import styled from 'styled-components';

import { readFileSync } from 'fs';

import { useApi } from '../../api';
import { DataDocumentUploadForm } from './DataDocumentUploadForm';

function readFileAsBlob(path) {
  const fileData = readFileSync(path);
  return new Blob([fileData]);
}

const Container = styled.div`
  padding: 32px;
`;


export const ProgramsAdminView = memo(() => {
  const api = useApi();
  const onSubmit = useCallback(
    async ({ file, ...data }) => {
      const fileData = readFileAsBlob(file);
      // send to api
      const response = await api.multipart('admin/importProgram', {
        file: fileData,
        ...data,
      });

      return response;
    }
  );

  return (
    <Container>
      <h1>Programs admin</h1>
      <DataDocumentUploadForm
        onSubmit={onSubmit}
      />
    </Container>
  );
});
