import React from 'react';
import { TopBar, PageContainer, LabRequestsSearchBar, ContentPane } from '../components';
import { LabRequestsTable } from './LabRequestsTable';
import { useLabRequest } from '../contexts/LabRequest';
import { useEncounter } from '../contexts/Encounter';

export const LabRequestListingView = React.memo(() => {
  const { loadEncounter } = useEncounter();
  const { loadLabRequest, searchParameters } = useLabRequest();

  return (
    <PageContainer>
      <TopBar title="Lab requests" />
      <LabRequestsSearchBar />
      <ContentPane>
        <LabRequestsTable
          loadEncounter={loadEncounter}
          loadLabRequest={loadLabRequest}
          searchParameters={searchParameters}
        />
      </ContentPane>
    </PageContainer>
  );
});
