import { useQuery } from '@tanstack/react-query';
import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { KeyboardArrowDownRounded } from '@material-ui/icons';
import { useApi } from '../../../api';
import {
  TopBar,
  PageContainer,
  SelectInput,
  FormGrid,
  Form,
  Table,
  useSelectableColumn,
} from '../../../components';
import { Colors } from '../../../constants';

const StyledTable = styled(Table)``;

export const ReportsAdminView = React.memo(() => {
  const [reportId, setReportId] = useState(null);
  const [versionId, setVersionId] = useState(null);

  const api = useApi();
  const { data: reportData = [], isLoading: reportLoading, error: reportError } = useQuery(
    ['reportList'],
    () => api.get('admin/reports'),
  );

  const { data: versionData, isLoading: versionsLoading, error: versionsError } = useQuery(
    ['reportVersions', reportId],
    () => api.get(`admin/reports/${reportId}/versions`),
    {
      enabled: !!reportId,
    },
  );

  return (
    <PageContainer>
      <TopBar title="Reports" />
      <div style={{ width: 'auto', padding: 20 }}>
        <StyledTable
          allowExport={false}
          onRowClick={row => setReportId(row.id)}
          rowStyle={({ id }) => {
            return id === reportId ? { backgroundColor: '#f5f5f5' } : {};
          }}
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
            <div
              style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: 20 }}
            >
              <KeyboardArrowDownRounded style={{ fontSize: '44px' }} />
            </div>
            <div style={{ marginTop: 20 }}>
              <StyledTable
                allowExport={false}
                onRowClick={row => setVersionId(row.id)}
                columns={[
                  {
                    title: 'Version number',
                    key: 'versionNumber',
                    minWidth: 400,
                  },
                  {
                    title: 'Last updated',
                    key: 'updatedAt',
                    minWidth: 300,
                    accessor: ({ updatedAt }) => new Date(updatedAt).toLocaleString(),
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
      </div>
    </PageContainer>
  );
});
