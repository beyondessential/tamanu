import React, { useState } from 'react';
import styled from 'styled-components';
import { useApi } from '../../../../api';
import { FormGrid, OutlinedButton, TextInput } from '../../../../components';
import { FileChooserInput } from '../../../../components/Field/FileChooserField';

const InnerContainer = styled.div`
  padding: 20px;
`;

const StyledButton = styled(OutlinedButton)`
  margin-top: 30px
`;

export const ReportsImportView = () => {
  const api = useApi();
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChangeName = (event) => {
    setName(event.target.value);
  };

  const handleChangeFile = (event) => {
    setFile(event.target.value);
  };

  const handleSubmit = async (event) => {
    setSubmitting(true);
    setError(null);
    try {
      const report = await api.post('admin/reports', {file, name})
      console.log(report)
    } catch(err) {
      console.log(err)
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <InnerContainer>
      <FormGrid columns={1}>
        <TextInput required label="Report Name" name='name' onChange={handleChangeName} value={name} />
        <FileChooserInput required label="Report JSON" name='file' onChange={handleChangeFile} value={file} filters={[{ name: 'JSON (.json)', extensions: ['json'] }]} />
      </FormGrid>
      <StyledButton onClick={handleSubmit} disabled={submitting || !name || !file}>Import</StyledButton>
    </InnerContainer>
  );
}
