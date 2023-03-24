import { useQuery } from '@tanstack/react-query';
import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { KeyboardArrowDownRounded } from '@material-ui/icons';
import { JsonEditor as Editor } from 'jsoneditor-react';
import 'jsoneditor-react/es/editor.min.css';
import { useApi } from '../../../api';
import {
  TopBar,
  PageContainer,
  SelectInput,
  FormGrid,
  Form,
  Table,
  useSelectableColumn,
  Heading2,
  Heading4,
  Button,
} from '../../../components';
import { Colors } from '../../../constants';

const StyledTable = styled(Table)``;

export const ReportsAdminView = React.memo(() => {
  const [report, setReport] = useState(null);
  const [version, setVersion] = useState(null);
  const [json, setJSON] = useState(null);

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

  console.log(json)

  return (
    <PageContainer>
      <TopBar title="Reports" />
      <div style={{ width: 'auto', padding: 20 }}>
        {version ? (
          <div>
            <Button variant="outlined" onClick={handleBack} style={{ marginBottom: 20 }}>
              Back
            </Button>
            <Heading2>
              <b>Report name:</b> {report.name}
            </Heading2>
            <Heading2>
              <b>Report version:</b> {version.versionNumber}
            </Heading2>
<Editor value={version} onChange={(w) => {
  console.log(w)
}}/>

          </div>
        ) : (
          <>
            <StyledTable
              allowExport={false}
              onRowClick={row => setReport(row)}
              rowStyle={({ id }) => {
                return id === report?.id ? { backgroundColor: '#f5f5f5' } : {};
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
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    width: '100%',
                    marginTop: 35,
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Heading4>Select version</Heading4>
                    <KeyboardArrowDownRounded style={{ fontSize: '44px' }} />
                  </div>
                </div>
                <div style={{ marginTop: 20 }}>
                  <StyledTable
                    allowExport={false}
                    onRowClick={row => {
                      setVersion(row);
                      console.log(row);
                    }}
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
          </>
        )}
      </div>
    </PageContainer>
  );
});
