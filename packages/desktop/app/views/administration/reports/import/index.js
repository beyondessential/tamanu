import React, { useState } from 'react';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query'
import { useApi } from '../../../../api';
import { BodyText, FormGrid, Heading4, OutlinedButton, SelectInput, TextInput } from '../../../../components';
import { FileChooserInput } from '../../../../components/Field/FileChooserField';

const InnerContainer = styled.div`
  padding: 20px;
  max-width: 500px;
`;

const StyledButton = styled(OutlinedButton)`
  margin-top: 30px
`;

const FormContainer = styled(FormGrid)`
  margin-bottom: 30px;
`

export const ReportsImportView = () => {
  const api = useApi();
  const [name, setName] = useState('');
  const [reportId, setReportId] = useState(null);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { data: reportData = [], isLoading: reportLoading, error: reportError } = useQuery(
    ['reportList'],
    () => api.get('admin/reports'),
  );

  const handleChangeName = (event) => {
    if (reportId) setReportId(null);
    setName(event.target.value);
  };

  const handleChangeFile = (event) => {
    setFile(event.target.value);
  };

  const handleSelectReport = ({ target: {
    value
  } }) => {
    setName(reportData.find(report => report.id === value).name)
    setReportId(value)
  };


  const handleSubmit = async (event) => {
    setSubmitting(true);
    setError(null);
    try {
      const report = await api.post('admin/reports', { file, name })
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <InnerContainer>

      <FormContainer columns={1}>
        <TextInput required label="Report Name" name='name' onChange={handleChangeName} value={name} />
        <Heading4>or</Heading4>
        <SelectInput label="Select Report" name='report' onChange={handleSelectReport} value={reportId} options={reportData.map(report => ({
          label: report.name,
          value: report.id,
        }))} />
      </FormContainer>
      <FileChooserInput required label="Report JSON" name='file' onChange={handleChangeFile} value={file} filters={[{ name: 'JSON (.json)', extensions: ['json'] }]} />
      <StyledButton onClick={handleSubmit} disabled={submitting || !name || !file}>Import</StyledButton>
    </InnerContainer>
  );
}
