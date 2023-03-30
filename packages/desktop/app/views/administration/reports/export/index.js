import React, { useState } from 'react';
import {promises as fs} from 'fs'
import styled from 'styled-components';
import { useApi } from '../../../../api';
import { FormGrid, OutlinedButton, RadioInput, SelectInput } from '../../../../components';
import {useQuery} from '@tanstack/react-query'
import {remote } from 'electron'
import {toast} from 'react-toastify'
const { dialog } = remote;

const InnerContainer = styled.div`
  padding: 20px;
  max-width: 500px;
`;

const StyledButton = styled(OutlinedButton)`
  margin-top: 30px
`;

export const ReportsExportView = () => {
  const api = useApi();
  const [submitting, setSubmitting] = useState(false);
  const [reportId, setReportId] = useState(null);
  const [versionId, setVersionId] = useState(null);
  const [format, setFormat] = useState('json');

  const { data: reportData = [], isLoading: reportLoading, error: reportError } = useQuery(
    ['reportList'],
    () => api.get('admin/reports'),
  );

  const { data: versionData, isLoading: versionsLoading, error: versionsError } = useQuery(
    ['reportVersions', reportId],
    () => api.get(`admin/reports/${reportId}/versions`),
    {
      enabled: !!reportId,
    },
  );

  const handleSubmit = async (event) => {
    setSubmitting(true);
    try {
      const  {filename, data}  = await api.get(`admin/reports/${reportId}/versions/${versionId}/export/${format}`)
      const result = await dialog.showSaveDialog({
        defaultPath: filename,
      });
      if (!result.canceled) {
        await fs.writeFile(result.filePath, Buffer.from(data) );
        toast.success(`Successfully exported to ${result.filePath}`)
      }
    } catch(err) {
      toast.error(`Failed to export: ${err.message}`)
    } finally {
      setSubmitting(false);
    }
  }
  const handleChangeReportId = (event) => {
    setReportId(event.target.value);
  };

  const handleChangeVersion = (event) => {
    setVersionId(event.target.value);
  };

  const handleChangeFormat = (event) => {
    setFormat(event.target.value);
  };

  return (
    <InnerContainer>
      <FormGrid columns={1}>
        <SelectInput required label="Report" name='report' onChange={handleChangeReportId} value={reportId} options={reportData.map(report => ({
          label: report.name,
          value: report.id,
        }))} />
        {reportId && versionData && (

          <SelectInput required label="Version" name='version' onChange={handleChangeVersion} value={versionId} options={versionData.map(version => ({
            label: version.versionNumber,
            value: version.id,
          }))} />
          )}
          {versionId &&
           <RadioInput label='Format' options={[
            {label: 'JSON', value: 'json'},
            {label: 'SQL', value: 'sql'},
          ]}
          name='format'
          value={format}
          onChange={handleChangeFormat}
          />
          }
      </FormGrid>
      <StyledButton onClick={handleSubmit} disabled={submitting}>Export</StyledButton>
    </InnerContainer>
  );
}
