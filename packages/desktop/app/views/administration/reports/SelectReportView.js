import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import styled from 'styled-components';
import { useApi } from '../../../api';
import { ReportTable, VersionTable } from './ReportTables';
import { EditReportView } from './EditReportView';

const FlexContainer = styled.div`
  padding: 20px;
  display: flex;
  align-items: flex-start;
`;

const VersionsTableContainer = styled.div`
  margin-left: 20px;
`;

export const SelectReportView = () => {
  const [report, setReport] = useState(null);
  const [version, setVersion] = useState(null);
  const api = useApi();

  const { data: reportData = [], isLoading: isReportLoading, error: reportError } = useQuery(
    ['reportList'],
    () => api.get('admin/reports'),
  );

  const showVersions = !!report?.id;
  const { data: versionData, isLoading: areVersionsLoading, error: versionsError } = useQuery(
    ['reportVersions', report?.id],
    () => api.get(`admin/reports/${report?.id}/versions`),
    {
      enabled: showVersions,
    },
  );

  const handleBack = () => setVersion(null);

  return (
    <>
      {version ? (
        <EditReportView
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
          {report && (
            <VersionsTableContainer>
              <VersionTable
                data={versionData}
                loading={areVersionsLoading}
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
