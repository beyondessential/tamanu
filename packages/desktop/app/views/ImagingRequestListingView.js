import React from 'react';
import { TopBar, PageContainer, ImagingRequestsSearchBar, ContentPane } from '../components';
import { ImagingRequestsTable } from '../components/ImagingRequestsTable';
import { useImagingRequests } from '../contexts/ImagingRequests';

export const ImagingRequestListingView = React.memo(() => {
  const { searchParameters, setSearchParameters } = useImagingRequests();
  return (
    <PageContainer>
      <TopBar title="Imaging requests" />
      <ImagingRequestsSearchBar
        searchParameters={searchParameters}
        setSearchParameters={setSearchParameters}
      />
      <ContentPane>
        <ImagingRequestsTable searchParameters={searchParameters} />
      </ContentPane>
    </PageContainer>
  );
});
