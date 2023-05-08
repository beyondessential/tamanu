import React from 'react';
import { IMAGING_REQUEST_STATUS_CONFIG } from '@tamanu/shared/constants/statuses';
import {
  TopBar,
  PageContainer,
  ImagingRequestsSearchBar,
  ContentPane,
  SearchTableTitle,
} from '../components';
import { ImagingRequestsTable } from '../components/ImagingRequestsTable';

export const ImagingRequestListingView = React.memo(({ status = '' }) => {
  const tableTitle = status
    ? `${IMAGING_REQUEST_STATUS_CONFIG[status].label} imaging requests`
    : 'Imaging requests';

  return (
    <PageContainer>
      <TopBar title={tableTitle} />
      <ContentPane>
        <SearchTableTitle>Imaging request search</SearchTableTitle>
        <ImagingRequestsSearchBar status={status} />
        <ImagingRequestsTable status={status} />
      </ContentPane>
    </PageContainer>
  );
});
