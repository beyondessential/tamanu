import React, { useState } from 'react';
import { TopBar, PageContainer, ImagingRequestsSearchBar, ContentPane } from '../components';
import { ImagingRequestsTable } from '../components/ImagingRequestsTable';

export const ImagingRequestListingView = React.memo(() => {
  const [searchParameters, setSearchParameters] = useState({});

  return (
    <PageContainer>
      <TopBar title="Imaging requests" />
      <ImagingRequestsSearchBar setSearchParameters={setSearchParameters} />
      <ContentPane>
        <ImagingRequestsTable searchParameters={searchParameters} />
      </ContentPane>
    </PageContainer>
  );
});
