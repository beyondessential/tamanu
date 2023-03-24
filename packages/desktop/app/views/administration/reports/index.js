import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import styled from 'styled-components';
import { JsonEditor } from 'jsoneditor-react';
import { useApi } from '../../../api';
import { TopBar, PageContainer, Table, Heading4, Button } from '../../../components';

const StyledTable = styled(Table)``;

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
      <div style={{ width: 'auto', padding: 20, display: 'flex', alignItems: 'flex-start' }}>
        {version ? (
          <div>
            <Button variant="outlined" onClick={handleBack} style={{ marginBottom: 20 }}>
              Back
            </Button>
            <Heading4 marginBottom={2}>
              <b>Report name:</b> {report.name}
            </Heading4>
            <Heading4 marginBottom={2}>
              <b>Report version:</b> {version.versionNumber}
            </Heading4>
            <JsonEditor value={version} />
          </div>
        ) : (
          <>
            <StyledTable
              allowExport={false}
              onRowClick={setReport}
              rowStyle={({ id }) => (id === report?.id ? { backgroundColor: '#f5f5f5' } : {})}
              columns={[
                {
                  title: 'Name',
                  key: 'name',
                  minWidth: 400,
                },
                {
                  title: 'Last updated',
                  key: 'lastUpdated',
                  minWidth: 300,
                  accessor: ({ lastUpdated }) => new Date(lastUpdated).toLocaleString(),
                },
                {
                  title: 'Version count',
                  key: 'versionCount',
                  numeric: true,
                  minWidth: 200,
                },
              ]}
              data={reportData}
              elevated={false}
              isLoading={reportLoading}
              errorMessage={reportError?.message}
            />
            {versionData && (
              <>
                <div style={{ marginLeft: 20 }}>
                  <StyledTable
                    allowExport={false}
                    onRowClick={setVersion}
                    columns={[
                      {
                        title: 'Version number',
                        key: 'versionNumber',
                        minWidth: 200,
                      },
                      {
                        title: 'Last updated',
                        key: 'updatedAt',
                        minWidth: 300,
                        accessor: ({ updatedAt }) => new Date(updatedAt).toLocaleString(),
                      },
                      {
                        title: 'Status',
                        key: 'status',
                      },
                    ]}
                    data={versionData}
                    elevated={false}
                    isLoading={versionsLoading}
                    errorMessage={versionsError?.message}
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
});
