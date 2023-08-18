import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import styled from 'styled-components';
import { Box } from '@material-ui/core';
import { useApi } from '../../../api';
import { ReportTable, VersionTable } from './ReportTables';
import { useAuth } from '../../../contexts/Auth';
import { OutlinedButton } from '../../../components';
import { Colors } from '../../../constants';
import { VersionInfo } from './components/VersionInfo';
import { ReportEditor } from './ReportEditor';

const Container = styled.div`
  padding: 20px;
`;

const FlexContainer = styled(Container)`
  display: flex;
  align-items: flex-start;
`;

const VersionsTableContainer = styled.div`
  margin-left: 20px;
`;

const StyledButton = styled(OutlinedButton)`
  background: ${Colors.white};
  &.Mui-disabled {
    border-color: ${Colors.outline};
  }
`;

const getInitialValues = (version, report) => {
  const { query, status, queryOptions } = version;
  const { name } = report;
  return {
    name,
    query,
    status,
    ...queryOptions,
  };
};

const VersionEditorView = ({ report, version, setVersion, onBack }) => {
  const api = useApi();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const handleSave = async ({ query, status, name, ...queryOptions }) => {
    const payload = {
      queryOptions,
      query,
      status,
    };
    try {
      const result = await api.post(`admin/reports/${report.id}/versions`, payload);
      toast.success(`Saved new version: ${result.versionNumber}`);
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

export const EditReportView = () => {
  const [report, setReport] = useState(null);
  const [version, setVersion] = useState(null);
  const api = useApi();

  const { data: reportData = [], isLoading: isReportLoading, error: reportError } = useQuery(
    ['reportList'],
    () => api.get('admin/reports'),
  );

  const areVersionsEnabled = !!report?.id;
  const { data: versionData, isLoading: areVersionsLoading, error: versionsError } = useQuery(
    ['reportVersions', report?.id],
    () => api.get(`admin/reports/${report?.id}/versions`),
    {
      enabled: areVersionsEnabled,
    },
  );

  const handleBack = () => setVersion(null);

  return (
    <>
      {version ? (
        <VersionEditorView
          report={report}
          version={version}
          onBack={handleBack}
          setVersion={setVersion}
        />
      ) : (
        <FlexContainer>
          <ReportTable
            data={reportData}
            selected={report?.id}
            onRowClick={setReport}
            loading={isReportLoading}
            error={reportError?.message}
          />
          {versionData && (
            <VersionsTableContainer>
              <VersionTable
                data={versionData}
                loading={areVersionsEnabled && areVersionsLoading}
                error={versionsError?.message}
                onRowClick={setVersion}
              />
            </VersionsTableContainer>
          )}
        </FlexContainer>
      )}
    </>
  );
};
