import React, { memo, useState, useCallback } from 'react';
import styled from 'styled-components';

import { useApi } from '../../api';
import { DataDocumentUploadForm } from './DataDocumentUploadForm';

const Container = styled.div`
  padding: 32px;
`;

export const ProgramsAdminView = memo(() => {
  const api = useApi();
  const onSubmit = useCallback(
    ({ file, ...data }) => api.postWithFileUpload('admin/importProgram', file, data)
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
