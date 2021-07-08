import React, { memo, useState, useCallback } from 'react';

import { readFileSync } from 'fs';

import { useApi } from '../../api';
import { DataDocumentUploadForm } from './DataDocumentUploadForm';

function readFileAsBlob(path) {
  const fileData = readFileSync(path);
  return new Blob([fileData]);
}

export const ProgramsAdminView = memo(({ onSubmit }) => {
  const api = useApi();
  const onSubmit = useCallback(
    async ({ file, ...data }) => {
      const fileData = readFileAsBlob(file);
      // send to api
      api.postUpload('admin/importProgram', {
        ...data,
        fileData,
      });
    },
    [onSubmit],
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
