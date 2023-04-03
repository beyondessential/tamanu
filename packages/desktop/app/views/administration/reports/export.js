import React, { useState } from 'react';
import { promises as fs } from 'fs';
import styled from 'styled-components';
import { useQuery } from '@tanstack/react-query';
import { remote, shell } from 'electron';
import { toast } from 'react-toastify';
import { REPORT_ADMIN_EXPORT_FORMATS } from 'shared/constants/reports';
import { Alert, AlertTitle } from '@material-ui/lab';
import { FormGrid, OutlinedButton, RadioInput, SelectInput } from '../../../components';
import { useApi } from '../../../api';

const StyledButton = styled(OutlinedButton)`
  margin-top: 30px;
`;
const InnerContainer = styled.div`
  padding: 20px;
  max-width: 500px;
`;
const StyledAlert = styled(Alert)`
  margin-bottom: 20px;
`;
const StyledErrorText = styled.div`
  :not(:last-child) {
    margin-bottom: 6px;
  }
`;
const StyledLink = styled.span`
  cursor: pointer;
  text-decoration: underline;
`;

const ErrorMessage = ({ type, message }) => (
  <StyledErrorText>
    <strong>{type} error:</strong> {message}
  </StyledErrorText>
);

const SuccessMessage = ({ filePath }) => (
  <>
    Successfully exported to{' '}
    <StyledLink onClick={() => shell.showItemInFolder(filePath)}>{filePath}</StyledLink>
  </>
);

export const ReportsExportView = () => {
  const api = useApi();
  const [submitting, setSubmitting] = useState(false);
  const [reportId, setReportId] = useState(null);
  const [versionId, setVersionId] = useState(null);
  const [format, setFormat] = useState('json');

  const { data: reportData = [], error: reportError } = useQuery(['reportList'], () =>
    api.get('admin/reports'),
  );
  const { data: versionData, error: versionError } = useQuery(
    ['reportVersions', reportId],
    () => api.get(`admin/reports/${reportId}/versions`),
    {
      enabled: !!reportId,
    },
  );
  const hasError = !!(reportError || versionError);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { filename, data } = await api.get(
        `admin/reports/${reportId}/versions/${versionId}/export/${format}`,
      );
      const result = await remote.dialog.showSaveDialog({
        defaultPath: filename,
      });
      if (!result.canceled) {
        await fs.writeFile(result.filePath, Buffer.from(data));
        toast.success(<SuccessMessage filePath={result.filePath} />, {
          autoClose: false,
        });
      }
    } catch (err) {
      toast.error(`Failed to export: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeReportId = event => {
    setReportId(event.target.value);
  };
  const handleChangeVersionId = event => {
    setVersionId(event.target.value);
  };
  const handleChangeFormat = event => {
    setFormat(event.target.value);
  };

  return (
    <InnerContainer>
      <FormGrid columns={1}>
        {hasError && (
          <StyledAlert severity="error">
            <AlertTitle>Error</AlertTitle>
            {reportError && <ErrorMessage type="Report" error={reportError} />}
            {versionError && <ErrorMessage type="Version" error={versionError} />}
          </StyledAlert>
        )}
        <SelectInput
          required
          label="Report"
          name="report"
          placeholder="Select a report definition"
          onChange={handleChangeReportId}
          value={reportId}
          options={reportData.map(report => ({
            label: report.name,
            value: report.id,
          }))}
          error={!!reportError}
        />
        {reportId && versionData && (
          <SelectInput
            required
            label="Version"
            name="version"
            placeholder="Select a report version"
            onChange={handleChangeVersionId}
            value={versionId}
            options={versionData.map(version => ({
              label: version.versionNumber,
              value: version.id,
            }))}
            error={!!versionError}
          />
        )}
        {versionId && (
          <RadioInput
            label="Format"
            name="format"
            onChange={handleChangeFormat}
            options={Object.entries(REPORT_ADMIN_EXPORT_FORMATS).map(([label, value]) => ({
              label,
              value,
            }))}
            value={format}
          />
        )}
      </FormGrid>
      <StyledButton
        disabled={!versionId && !hasError}
        onClick={handleSubmit}
        isSubmitting={submitting}
      >
        Export
      </StyledButton>
    </InnerContainer>
  );
};
