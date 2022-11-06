import React, { memo, useCallback } from 'react';
import { ContentPane } from '../../components';

import { useApi } from '../../api';
import { DataDocumentUploadForm } from './DataDocumentUploadForm';

export const ProgramsAdminView = memo(() => {
  const api = useApi();
  const onSubmit = useCallback(
    ({ file, ...data }) => api.postWithFileUpload('admin/importProgram', file, data),
    [api],
  );

  return (
    <ContentPane>
      <h1>Programs admin</h1>
      <DataDocumentUploadForm onSubmit={onSubmit} />
    </ContentPane>
  );
});
