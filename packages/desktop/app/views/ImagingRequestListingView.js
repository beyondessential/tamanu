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

const ImagingRequestListing = ({ status = '' }) => (
  <ContentPane>
    <SearchTableTitle>Imaging request search</SearchTableTitle>
    <ImagingRequestsSearchBar status={status} />
    <ImagingRequestsTable status={status} />
  </ContentPane>
);

export const ImagingRequestListingView = () => (
  <PageContainer>
    <TopBar title="Imaging requests" />
    <ImagingRequestListing />
  </PageContainer>
);

export const CompletedImagingRequestListingView = () => (
  <PageContainer>
    <TopBar title="Completed imaging requests" />
    <ImagingRequestListing status={IMAGING_REQUEST_STATUS_TYPES.COMPLETED} />
  </PageContainer>
);
