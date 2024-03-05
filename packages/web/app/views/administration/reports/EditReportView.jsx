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
import { TranslatedText } from '../../../components/Translation/TranslatedText';

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
  const { query, status, queryOptions, notes } = version;
  const { dataSources, ...options } = queryOptions;
  const { name, dbSchema } = report;
  return {
    name,
    query,
    status,
    dbSchema,
    ...options,
    dataSources,
    notes,
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
    dispatch(push('admin/reports'));
  };

  const handleSave = async ({ query, status, dbSchema, notes, ...queryOptions }) => {
    delete queryOptions.name;

    const { dataSources } = queryOptions;
    const { reportDefinition } = version;
    const payload = {
      queryOptions: {
        ...queryOptions,
        dataSources,
      },
      query,
      status,
      dbSchema,
      notes,
    };
    try {
      const result = await api.post(`admin/reports/${reportDefinition.id}/versions`, payload);
      toast.success(
        <TranslatedText
          stringId="admin.report.notification.saveReportSuccess"
          fallback={`Saved new version: ${result.versionNumber} for report ${reportDefinition.name}`}
          replacements={{ versionNumber: result.versionNumber, name: reportDefinition.name }}
        />
      );
      queryClient.invalidateQueries(['reportVersions', reportDefinition.id]);
      queryClient.invalidateQueries(['reportList']);
      dispatch(push(`/admin/reports/${reportDefinition.id}/versions/${result.id}/edit`));
    } catch (err) {
      toast.error(
        <TranslatedText
          stringId="admin.report.notification.saveReportFailed"
          fallback={`Failed to save version: ${err.message}`}
          replacements={{ message: err.message }}
        />  
      );
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
