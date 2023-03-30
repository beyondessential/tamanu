import React, { useState } from 'react';
import styled from 'styled-components';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { useApi } from '../../../api';
import { FormGrid, Heading4, OutlinedButton, SelectInput, TextInput } from '../../../components';
import { FileChooserInput } from '../../../components/Field/FileChooserField';

const InnerContainer = styled.div`
  padding: 20px;
  max-width: 500px;
`;

const StyledButton = styled(OutlinedButton)`
  margin-top: 30px;
`;

const FormContainer = styled(FormGrid)`
  margin-bottom: 30px;
`;

const parseFeedback = (name, { userFallback, versionMethod, createdDefinition, versionNumber }) => {
  const versionText =
    versionMethod === 'create'
      ? `Created version ${versionNumber}`
      : `Updated existing version ${versionNumber}`;
  const definitionText = createdDefinition ? 'newly created definition' : 'existing definition';
  const userFallbackTest = userFallback ? ', with user fallback as no userId provided' : '';
  return `${versionText} for ${definitionText} ${name}${userFallbackTest}`;
};

export const ReportsImportView = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [reportId, setReportId] = useState(null);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: reportData = [] } = useQuery(['reportList'], () => api.get('admin/reports'));

  const handleChangeName = event => {
    if (reportId) setReportId(null);
    setName(event.target.value);
  };

  const handleChangeFile = event => {
    setFile(event.target.value);
  };

  const handleSelectReport = ({ target: { value } }) => {
    setName(reportData.find(report => report.id === value).name);
    setReportId(value);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const feedback = await api.post('admin/reports/import', { file, name });
      toast.success(parseFeedback(name, feedback));
      queryClient.invalidateQueries(['reportList']);
      queryClient.invalidateQueries(['reportVersions', reportId]);
    } catch (err) {
      toast.error(`Failed to import: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <InnerContainer>
      <FormContainer columns={1}>
        <TextInput
          required
          label="Report Name"
          name="name"
          onChange={handleChangeName}
          value={name}
        />
        <Heading4>or</Heading4>
        <SelectInput
          label="Select Report"
          name="report"
          onChange={handleSelectReport}
          value={reportId}
          options={reportData.map(report => ({
            label: report.name,
            value: report.id,
          }))}
        />
      </FormContainer>
      <FileChooserInput
        required
        label="Report JSON"
        name="file"
        onChange={handleChangeFile}
        value={file}
        filters={[{ name: 'JSON (.json)', extensions: ['json'] }]}
      />
      <StyledButton onClick={handleSubmit} disabled={submitting || !name || !file}>
        Import
      </StyledButton>
    </InnerContainer>
  );
};
