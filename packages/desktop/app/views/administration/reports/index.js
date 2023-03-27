import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import styled from 'styled-components';
import { useApi } from '../../../api';
import { TopBar, PageContainer } from '../../../components';
import { ReportTable, VersionTable } from './ReportTables';
import { VersionEditor } from './VersionEditor';

const InnerContainer = styled.div`
  display: flex;
  padding: 20px;
  align-items: flex-start;
`;

const VersionsTableContainer = styled.div`
  margin-left: 20px;
`;

export const ReportsAdminView = React.memo(() => {
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

  return (
    <PageContainer>
      <TopBar title="Reports" />
      <InnerContainer>
        {version ? (
          <VersionEditor report={report} version={version} onBack={handleBack} />
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
