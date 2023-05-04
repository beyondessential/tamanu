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

export const ImagingRequestListingView = React.memo(({ memoryKey, status = '' }) => {
  const tableTitle = status
    ? `${memoryKey} imaging requests`
    : 'Imaging requests';

  return (
    <PageContainer>
      <TopBar title={tableTitle} />
      <ContentPane>
        <SearchTableTitle>Imaging request search</SearchTableTitle>
        <ImagingRequestsSearchBar memoryKey={memoryKey} status={status} />
        <ImagingRequestsTable memoryKey={memoryKey} status={status} />
      </ContentPane>
    </PageContainer>
  );
});
