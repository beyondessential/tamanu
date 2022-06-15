import React, { useState } from 'react';
import { TopBar, PageContainer, ImagingRequestsSearchBar } from '../components';
import { ImagingRequestsTable } from '../components/ImagingRequestsTable';

export const ImagingRequestListingView = React.memo(() => {
  const [searchParameters, setSearchParameters] = useState({});

  return (
    <PageContainer>
      <TopBar title="Imaging requests" />
      <ImagingRequestsSearchBar setSearchParameters={setSearchParameters} />
      <ImagingRequestsTable searchParameters={searchParameters} />
    </PageContainer>
  );
});
