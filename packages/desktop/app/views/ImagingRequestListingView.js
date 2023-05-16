import React from 'react';
import { IMAGING_REQUEST_STATUS_CONFIG } from 'shared-src/src/constants/statuses';
import {
  TopBar,
  PageContainer,
  ImagingRequestsSearchBar,
  ContentPane,
  SearchTableTitle,
} from '../components';
import { ImagingRequestsTable } from '../components/ImagingRequestsTable';
import { IMAGING_REQUEST_SEARCH_KEYS } from '../contexts/ImagingRequests';

export const ImagingRequestListingView = React.memo(({ memoryKey, statuses = [] }) => {
  const tableTitle =
    memoryKey === IMAGING_REQUEST_SEARCH_KEYS.COMPLETED
      ? 'Completed imaging requests'
      : 'Active imaging requests';

  return (
    <PageContainer>
      <TopBar title={tableTitle} />
      <ContentPane>
        <SearchTableTitle>Imaging request search</SearchTableTitle>
        <ImagingRequestsSearchBar memoryKey={memoryKey} statuses={statuses} />
        <ImagingRequestsTable memoryKey={memoryKey} statuses={statuses} />
      </ContentPane>
    </PageContainer>
  );
});
