import React, { memo, useCallback } from 'react';
import styled from 'styled-components';

import { useApi } from '../../api';
import { DataDocumentUploadForm } from './DataDocumentUploadForm';

const Container = styled.div`
  padding: 32px;
`;

export const PermissionsAdminView = memo(() => {
  const api = useApi();
  const onSubmit = useCallback(
    ({ file, ...data }) => api.postWithFileUpload('admin/importPermissions', file, data),
    [api],
  );

  return (
    <Container>
      <h1>Permissions admin</h1>
      <DataDocumentUploadForm onSubmit={onSubmit} />
    </Container>
  );
});
