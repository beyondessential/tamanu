import { useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { useApi } from '../../../api';
import { useAuth } from '../../../contexts/Auth';
import { OutlinedButton } from '../../../components';
import { Colors } from '../../../constants';
import { VersionInfo } from './components/VersionInfo';
import { ReportEditor } from './ReportEditor';

const Container = styled.div`
  padding: 20px;
`;

const StyledButton = styled(OutlinedButton)`
  background: ${Colors.white};
  &.Mui-disabled {
    border-color: ${Colors.outline};
  }
`;

const getInitialValues = (version, report) => {
  const { query, status, queryOptions } = version;
  const { dataSources, ...options } = queryOptions;
  const { name } = report;
  return {
    name,
    query,
    status,
    ...options,
    dataSources: dataSources?.join(', '),
  };
};

export const EditReportView = ({ report, version, setVersion, onBack }) => {
  const api = useApi();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const handleSave = async ({ query, status, name, ...queryOptions }) => {
    const { dataSources } = queryOptions;
    const payload = {
      queryOptions: {
        ...queryOptions,
        dataSources: dataSources.split(', '),
      },
      query,
      status,
    };
    try {
      const result = await api.post(`admin/reports/${report.id}/versions`, payload);
      toast.success(`Saved new version: ${result.versionNumber} for report ${report.name}`);
      setVersion({
        ...result,
        createdBy: {
          displayName: currentUser.displayName,
        },
      });
      queryClient.invalidateQueries(['reportVersions', report?.id]);
      queryClient.invalidateQueries(['reportList']);
    } catch (err) {
      toast.error(`Failed to save version: ${err.message}`);
    }
  };
  return (
    <Container>
      <StyledButton onClick={onBack}>Back</StyledButton>
      <Box mt={2} mb={2}>
        <VersionInfo name={report.name} reportDefinitionId={report.id} version={version} />
      </Box>
      <ReportEditor
        isEdit
        onSubmit={handleSave}
        initialValues={getInitialValues(version, report)}
      />
    </Container>
  );
};
