import { LAB_REQUEST_TABLE_STATUS_GROUPINGS } from '@tamanu/constants';
import React from 'react';
import styled from 'styled-components';
import {
  ContentPane,
  LabRequestsSearchBar,
  SearchTableTitle,
  TopBar,
} from '../components';
import { useEncounter } from '../contexts/Encounter';
import { LabRequestSearchParamKeys, useLabRequest } from '../contexts/LabRequest';
import { LabRequestsTable } from './LabRequestsTable';

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
  <div>
    <TopBar title="Active lab requests" />
    <LabRequestListing statuses={LAB_REQUEST_TABLE_STATUS_GROUPINGS.ACTIVE} />
  </div>
);

export const PublishedLabRequestListingView = () => (
  <div>
    <TopBar title="Published lab requests" />
    <LabRequestListing
      statuses={LAB_REQUEST_TABLE_STATUS_GROUPINGS.COMPLETED}
      searchParamKey={LabRequestSearchParamKeys.Published}
    />
  </div>
);
