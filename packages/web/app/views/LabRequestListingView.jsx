import React from 'react';
import styled from 'styled-components';
import { LAB_REQUEST_TABLE_STATUS_GROUPINGS } from '@tamanu/constants';
import {
  ContentPane,
  LabRequestsSearchBar,
  PageContainer,
  SearchTableTitle,
  TopBar,
} from '../components';
import { LabRequestsTable } from './LabRequestsTable';
import { LabRequestSearchParamKeys, useLabRequest } from '../contexts/LabRequest';
import { useEncounter } from '../contexts/Encounter';

const StyledContentPane = styled(ContentPane)`
  position: relative;
`;

const LabRequestListing = ({ statuses, searchParamKey = LabRequestSearchParamKeys.All }) => {
  const { loadEncounter } = useEncounter();
  const { loadLabRequest, searchParameters } = useLabRequest(searchParamKey);

  return (
    <StyledContentPane>
      <SearchTableTitle>Lab request search</SearchTableTitle>
      <LabRequestsSearchBar statuses={statuses} />
      <LabRequestsTable
        loadEncounter={loadEncounter}
        loadLabRequest={loadLabRequest}
        searchParameters={searchParameters}
        statuses={statuses}
      />
    </StyledContentPane>
  );
};

export const LabRequestListingView = () => (
  <PageContainer>
    <TopBar title="Active lab requests" data-test-id='topbar-rv2v' />
    <LabRequestListing statuses={LAB_REQUEST_TABLE_STATUS_GROUPINGS.ACTIVE} />
  </PageContainer>
);

export const PublishedLabRequestListingView = () => (
  <PageContainer>
    <TopBar title="Published lab requests" data-test-id='topbar-nint' />
    <LabRequestListing
      statuses={LAB_REQUEST_TABLE_STATUS_GROUPINGS.COMPLETED}
      searchParamKey={LabRequestSearchParamKeys.Published}
    />
  </PageContainer>
);
