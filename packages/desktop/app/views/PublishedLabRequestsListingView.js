import React from 'react';
import { LAB_REQUEST_STATUSES } from '@tamanu/shared/constants';
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

export const PublishedLabRequestsListingView = React.memo(() => {
  const { loadLabRequest, searchParameters } = useLabRequest(LabRequestSearchParamKeys.Published);
  const { loadEncounter } = useEncounter();
  return (
    <PageContainer>
      <TopBar title="Published lab requests" />
      <ContentPane>
        <SearchTableTitle>Lab request search</SearchTableTitle>
        <LabRequestsSearchBar status={LAB_REQUEST_STATUSES.PUBLISHED} />
        <LabRequestsTable
          loadEncounter={loadEncounter}
          loadLabRequest={loadLabRequest}
          searchParameters={searchParameters}
          status={LAB_REQUEST_STATUSES.PUBLISHED}
        />
      </ContentPane>
    </PageContainer>
  );
});
