import React from 'react';
import {
  TopBar,
  PageContainer,
  LabRequestsSearchBar,
  ContentPane,
  SearchTableTitle,
} from '../components';
import { LabRequestsTable } from './LabRequestsTable';
import { LabRequestSearchParamKeys, useLabRequest } from '../contexts/LabRequest';
import { useEncounter } from '../contexts/Encounter';

export const LabRequestListingView = React.memo(() => {
  const { loadEncounter } = useEncounter();
  const { loadLabRequest, searchParameters } = useLabRequest(LabRequestSearchParamKeys.All);

  return (
    <PageContainer>
      <TopBar title="Active lab requests" />
      <ContentPane>
        <SearchTableTitle>Lab request search</SearchTableTitle>
        <LabRequestsSearchBar />
        <LabRequestsTable
          loadEncounter={loadEncounter}
          loadLabRequest={loadLabRequest}
          searchParameter={searchParameters}
        />
      </ContentPane>
    </PageContainer>
  );
});
