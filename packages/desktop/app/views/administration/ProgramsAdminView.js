import React, { memo, useState, useCallback } from 'react';
import styled from 'styled-components';

import { remote } from 'electron';

import { readFileSync } from 'fs';

import { Button } from 'desktop/app/components/Button';

import { connectApi } from '../../api';

const Container = styled.div`
  padding: 32px;
`;

const ProgramUploadForm = ({ onSubmit }) => {

  const submitData = useCallback(async () => {
    const result = await remote.dialog.showOpenDialog(null, {
      filters: [{ name: 'Microsoft Excel files (.xlsx)', extensions: ['xlsx'] }],
    });
    if (!result) return;

    const [path] = result;
    const fileData = readFileSync(path);
    const data = {
      file: new Blob([fileData]),
    };

    onSubmit(data);
  }, [onSubmit]);

  return (
    <Button onClick={submitData} variant="contained" color="primary">
      Upload file
    </Button>
  );
};

const DumbProgramsAdminView = memo(({ onSubmit, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(data => {
    const submitData = async () => {
      setIsLoading(true);
      await onSubmit(data);
      setIsLoading(false);
    };
    submitData();
  }, [onSubmit]);

  return (
    <Container>
      <h1>Programs admin</h1>
      {isLoading ? (
        'Loading ... '
      ) : (
        <ProgramUploadForm onSubmit={handleSubmit} onCancel={onCancel} />
      )}
    </Container>
  );
});

export const ProgramsAdminView = connectApi(api => ({
  onSubmit: async data => api.multipart('program', data),
}))(DumbProgramsAdminView);
