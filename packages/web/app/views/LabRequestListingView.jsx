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
    <StyledContentPane data-testid='styledcontentpane-l071'>
      <SearchTableTitle data-testid='searchtabletitle-f5fy'>Lab request search</SearchTableTitle>
      <LabRequestsSearchBar statuses={statuses} data-testid='labrequestssearchbar-xktv' />
      <LabRequestsTable
        loadEncounter={loadEncounter}
        loadLabRequest={loadLabRequest}
        searchParameters={searchParameters}
        statuses={statuses}
        data-testid='labrequeststable-s0ka' />
    </StyledContentPane>
  );
};

export const LabRequestListingView = () => (
  <PageContainer data-testid='pagecontainer-qljt'>
    <TopBar title="Active lab requests" data-testid='topbar-576y' />
    <LabRequestListing
      statuses={LAB_REQUEST_TABLE_STATUS_GROUPINGS.ACTIVE}
      data-testid='labrequestlisting-bxu7' />
  </PageContainer>
);

export const PublishedLabRequestListingView = () => (
  <PageContainer data-testid='pagecontainer-u7ab'>
    <TopBar title="Published lab requests" data-testid='topbar-gc5j' />
    <LabRequestListing
      statuses={LAB_REQUEST_TABLE_STATUS_GROUPINGS.COMPLETED}
      searchParamKey={LabRequestSearchParamKeys.Published}
      data-testid='labrequestlisting-3j4y' />
  </PageContainer>
);
