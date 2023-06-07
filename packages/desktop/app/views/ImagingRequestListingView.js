import React from 'react';
import { IMAGING_REQUEST_STATUS_TYPES } from 'shared/constants/statuses';
import {
  TopBar,
  PageContainer,
  ImagingRequestsSearchBar,
  ContentPane,
  SearchTableTitle,
} from '../components';
import { ImagingRequestsTable } from '../components/ImagingRequestsTable';
import { IMAGING_REQUEST_SEARCH_KEYS } from '../contexts/ImagingRequests';

const ImagingRequestListing = ({ memoryKey, statuses }) => (
  // Since we need to track the state of the search bar and table for each version of the Imaging request table,
  // We assign a memoryKey to each version of the table that references a context that stores the state of the
  // search bar and table. We also pass in the actual statuses we want to filter the table by.
  <ContentPane>
    <SearchTableTitle>Imaging request search</SearchTableTitle>
    <ImagingRequestsSearchBar memoryKey={memoryKey} statuses={statuses} />
    <ImagingRequestsTable memoryKey={memoryKey} statuses={statuses} />
  </ContentPane>
);

export const ImagingRequestListingView = () => (
  <PageContainer>
    <TopBar title="Imaging requests" />
    <ImagingRequestListing
      memoryKey={IMAGING_REQUEST_SEARCH_KEYS.ACTIVE}
      statuses={[IMAGING_REQUEST_STATUS_TYPES.PENDING, IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS]}
    />
  </PageContainer>
);

export const CompletedImagingRequestListingView = () => (
  <PageContainer>
    <TopBar title="Completed imaging requests" />
    <ImagingRequestListing
      memoryKey={IMAGING_REQUEST_SEARCH_KEYS.COMPLETED}
      statuses={[IMAGING_REQUEST_STATUS_TYPES.COMPLETED]}
    />
  </PageContainer>
);
