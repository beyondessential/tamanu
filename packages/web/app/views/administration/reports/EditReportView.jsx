import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { useParams, useNavigate } from 'react-router';
import { OutlinedButton } from '@tamanu/ui-components';
import { Colors } from '../../../constants/styles';
import { useApi } from '../../../api';
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
  const { dataSources, parameters, dateRangeLabel, defaultDateRange, dhis2DataSet, ...advancedConfig } = queryOptions;
  const { name, dbSchema } = report;
  return {
    name,
    query,
    status,
    dbSchema,
    parameters,
    dateRangeLabel,
    defaultDateRange,
    dhis2DataSet,
    dataSources,
    notes,
    advancedConfig: Object.keys(advancedConfig).length > 0 ? advancedConfig : null,
  };
};

export const EditReportView = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const params = useParams();
  const navigate = useNavigate();

  const { data: version, isLoading } = useQuery(
    ['version', params.versionId],
    () => api.get(`admin/reports/${params.reportId}/versions/${params.versionId}`),
    {
      enabled: !!params.versionId,
    },
  );

  const handleBack = () => {
    navigate('/admin/reports');
  };

  const handleSave = async ({
    query,
    status,
    dbSchema,
    notes,
    parameters,
    dateRangeLabel,
    defaultDateRange,
    dhis2DataSet,
    dataSources,
    advancedConfig = {},
  }) => {
    const payload = {
      queryOptions: {
        parameters,
        dateRangeLabel,
        defaultDateRange,
        dhis2DataSet,
        dataSources,
        ...advancedConfig,
      },
      query,
      status,
      dbSchema,
      notes,
    };

    try {
      const { reportDefinition } = version;
      const result = await api.post(`admin/reports/${reportDefinition.id}/versions`, payload);
      toast.success(
        <TranslatedText
          stringId="admin.report.notification.saveReportSuccess"
          fallback={`Saved new version: ${result.versionNumber} for report ${reportDefinition.name}`}
          replacements={{ versionNumber: result.versionNumber, name: reportDefinition.name }}
          data-testid="translatedtext-hjbe"
        />,
      );
      queryClient.invalidateQueries(['reportVersions', reportDefinition.id]);
      queryClient.invalidateQueries(['reportList']);
      navigate(`/admin/reports/${reportDefinition.id}/versions/${result.id}/edit`);
    } catch (err) {
      toast.error(
        <TranslatedText
          stringId="admin.report.notification.saveReportFailed"
          fallback={`Failed to save version: ${err.message}`}
          replacements={{ message: err.message }}
          data-testid="translatedtext-eu3y"
        />,
      );
    }
  };

  return (
    <Container data-testid="container-y6i6">
      <StyledButton onClick={handleBack} data-testid="styledbutton-45ah">
        <TranslatedText
          stringId="general.action.back"
          fallback="Back"
          data-testid="translatedtext-m17q"
        />
      </StyledButton>
      {isLoading ? (
        <Box mt={2} data-testid="box-58sj">
          <LoadingIndicator height="400px" data-testid="loadingindicator-lyul" />
        </Box>
      ) : (
        <>
          <Box mt={2} mb={2} data-testid="box-1f58">
            <VersionInfo version={version} data-testid="versioninfo-1dbs" />
          </Box>
          <ReportEditor
            isEdit
            onSubmit={handleSave}
            initialValues={getInitialValues(version, version.reportDefinition)}
            data-testid="reporteditor-89qw"
          />
        </>
      )}
    </Container>
  );
};
