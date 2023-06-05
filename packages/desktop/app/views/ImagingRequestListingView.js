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
