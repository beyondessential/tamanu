import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import styled from 'styled-components';
import { useApi } from '../../../api';
import { ReportTable, VersionTable } from './ReportTables';
import { useAuth } from '../../../contexts/Auth';
import { OutlinedButton } from '../../../components';
import { Colors } from '../../../constants';
import { NewReportView } from './NewReportView';

const InnerContainer = styled.div`
  display: flex;
  padding: 20px;
  align-items: flex-start;
`;

const VersionsTableContainer = styled.div`
  margin-left: 20px;
`;

const ButtonContainer = styled.div`
  padding-left: 20px;
  padding-right: 20px;
`;

const StyledButton = styled(OutlinedButton)`
  background: ${Colors.white};
  &.Mui-disabled {
    border-color: ${Colors.outline};
  }
`;

export const EditReportView = () => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
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

  const handleSave = async data => {
    const result = await api.post(`admin/reports/${report.id}/versions`, data);
    setVersion({
      ...result,
      createdBy: {
        displayName: currentUser.displayName,
      },
    });
    queryClient.invalidateQueries(['reportVersions', report?.id]);
    queryClient.invalidateQueries(['reportList']);
    return result;
  };

  return (
    <>
      {version ? (
        <>
          <ButtonContainer>
            <StyledButton onClick={handleBack}>Back</StyledButton>
          </ButtonContainer>
          <NewReportView version={version} report={report} />
        </>
      ) : (
        <InnerContainer>
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
        </InnerContainer>
      )}
    </>
  );
};
