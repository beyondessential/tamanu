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
import { useImagingRequests } from '../contexts/ImagingRequests';

export const ImagingRequestListingView = React.memo(({ status = '' }) => {
  const { searchParameters, setSearchParameters } = useImagingRequests();

  const tableTitle = status
    ? `${IMAGING_REQUEST_STATUS_CONFIG[status].label} imaging requests`
    : 'Imaging requests';
  const statusFilter = status ? { status } : {};

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
