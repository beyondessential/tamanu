import React from 'react';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';
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

const LabRequestListing = ({ status = '', searchParamKey = LabRequestSearchParamKeys.All }) => {
  const { loadEncounter } = useEncounter();
  const { loadLabRequest, searchParameters } = useLabRequest(searchParamKey);

  return (
    <ContentPane>
      <SearchTableTitle>Lab request search</SearchTableTitle>
      <LabRequestsSearchBar status={status} />
      <LabRequestsTable
        loadEncounter={loadEncounter}
        loadLabRequest={loadLabRequest}
        searchParameters={searchParameters}
        status={status}
      />
    </ContentPane>
  );
};

export const LabRequestListingView = () => (
  <PageContainer>
    <TopBar title="Active lab requests" />
    <LabRequestListing />
  </PageContainer>
);

export const PublishedLabRequestListingView = () => (
  <PageContainer>
    <TopBar title="Published lab requests" />
    <LabRequestListing
      status={LAB_REQUEST_STATUSES.PUBLISHED}
      searchParamKey={LabRequestSearchParamKeys.Published}
    />
  </PageContainer>
);
