import React from 'react';
import { IMAGING_REQUEST_STATUS_TYPES } from 'shared-src/src/constants/statuses';
import {
  TopBar,
  PageContainer,
  ImagingRequestsSearchBar,
  ContentPane,
  SearchTableTitle,
} from '../components';
import { ImagingRequestsTable } from '../components/ImagingRequestsTable';

export const CompletedImagingRequestListingView = () => (
  <PageContainer>
    <TopBar title="Completed imaging requests" />
    <ContentPane>
      <SearchTableTitle>Imaging request search</SearchTableTitle>
      <ImagingRequestsSearchBar status={IMAGING_REQUEST_STATUS_TYPES.COMPLETED} />
      <ImagingRequestsTable status={IMAGING_REQUEST_STATUS_TYPES.COMPLETED} />
    </ContentPane>
  </PageContainer>
);
