import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import styled from 'styled-components';
import { useApi } from '../../../api';
import { TopBar, PageContainer } from '../../../components';
import { ReportTable, VersionTable } from './ReportTables';
import { VersionEditor } from './VersionEditor';
import { useAuth } from '../../../contexts/Auth';

const InnerContainer = styled.div`
  display: flex;
  padding: 20px;
  align-items: flex-start;
`;

const VersionsTableContainer = styled.div`
  margin-left: 20px;
`;

export const ReportsAdminView = React.memo(() => {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [report, setReport] = useState(null);
  const [version, setVersion] = useState(null);
  const api = useApi();

  const { data: reportData = [], isLoading: reportLoading, error: reportError } = useQuery(
    ['reportList'],
    () => api.get('admin/reports'),
  );

  const { data: versionData, isLoading: versionsLoading, error: versionsError } = useQuery(
    ['reportVersions', report?.id],
    () => api.get(`admin/reports/${report?.id}/versions`),
    {
      enabled: !!report?.id,
    },
  );

  const handleBack = () => setVersion(null);

  const handleSave = async (data, newVersion) => {
    const result = newVersion
      ? await api.post(`admin/reports/${report.id}/versions`, data)
      : await api.put(`admin/reports/${report.id}/versions/${version.id}`, data);

    setVersion({
      ...result,
      createdBy: newVersion
        ? {
            displayName: currentUser.displayName,
          }
        : version.createdBy,
    });
    queryClient.invalidateQueries(['reportVersions', report?.id]);
    queryClient.invalidateQueries(['reportList']);
  };

  return (
    <PageContainer>
      <TopBar title="Reports" />
      <InnerContainer>
        {version ? (
          <VersionEditor
            report={report}
            version={version}
            onBack={handleBack}
            onSave={handleSave}
          />
        ) : (
          <>
            <ReportTable
              data={reportData}
              selected={report?.id}
              onRowClick={setReport}
              loading={reportLoading}
              error={reportError?.message}
            />
            {versionData && (
              <VersionsTableContainer>
                <VersionTable
                  data={versionData}
                  loading={versionsLoading}
                  error={versionsError?.message}
                  onRowClick={setVersion}
                />
              </VersionsTableContainer>
            )}
          </>
        )}
      </InnerContainer>
    </PageContainer>
  );
});
