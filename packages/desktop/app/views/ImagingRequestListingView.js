import React from 'react';
import {
  TopBar,
  PageContainer,
  ImagingRequestsSearchBar,
  ContentPane,
  SearchTableTitle,
} from '../components';
import { ImagingRequestsTable } from '../components/ImagingRequestsTable';
import { useImagingRequests } from '../contexts/ImagingRequests';

export const ImagingRequestListingView = React.memo(() => {
  const { searchParameters, setSearchParameters } = useImagingRequests();
  return (
    <PageContainer>
      <TopBar title="Imaging requests" />
      <ContentPane>
        <SearchTableTitle>Imaging request search</SearchTableTitle>
        <ImagingRequestsSearchBar
          searchParameters={searchParameters}
          setSearchParameters={setSearchParameters}
        />
        <ImagingRequestsTable searchParameters={searchParameters} />
      </ContentPane>
    </PageContainer>
  );
});
