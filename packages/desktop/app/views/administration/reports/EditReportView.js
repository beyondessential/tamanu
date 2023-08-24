import { useQuery, useQueryClient } from '@tanstack/react-query';
import { push } from 'connected-react-router';
import React from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useApi } from '../../../api';
import { OutlinedButton } from '../../../components';
import { Colors } from '../../../constants';
import { VersionInfo } from './components/VersionInfo';
import { ReportEditor } from './ReportEditor';
import { LoadingIndicator } from '../../../components/LoadingIndicator';

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
  const { name, dbRole } = report;
  console.log(report)
  return {
    name,
    query,
    status,
    dbRole,
    ...options,
    dataSources: dataSources?.join(', '),
  };
};

export const EditReportView = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const params = useParams();
  const dispatch = useDispatch();

  const { data: version, isLoading } = useQuery(
    ['version', params.versionId],
    () => api.get(`admin/reports/${params.reportId}/versions/${params.versionId}`),
    {
      enabled: !!params.versionId,
    },
  );

  const handleBack = () => {
    dispatch(push('administration/reports'));
  };

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
      const result = await api.post(`admin/reports/${version.reportId}/versions`, payload);
      toast.success(
        `Saved new version: ${result.versionNumber} for report ${version.reportDefinition.name}`,
      );
      queryClient.invalidateQueries(['reportVersions', version.reportDefinitionId]);
      queryClient.invalidateQueries(['reportList']);
      dispatch(push(`/administration/reports/${version.reportId}/versions/${result.id}/edit`));
    } catch (err) {
      toast.error(`Failed to save version: ${err.message}`);
    }
  };

  return (
    <Container>
      <StyledButton onClick={handleBack}>Back</StyledButton>
      {isLoading ? (
        <Box mt={2}>
          <LoadingIndicator height="400px" />
        </Box>
      ) : (
        <>
          <Box mt={2} mb={2}>
            <VersionInfo version={version} />
          </Box>
          <ReportEditor
            isEdit
            onSubmit={handleSave}
            initialValues={getInitialValues(version, version.reportDefinition)}
          />
        </>
      )}
    </Container>
  );
};
