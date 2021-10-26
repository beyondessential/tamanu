import React, { useState } from 'react';

import { TopBar, PageContainer } from '../components';
import { ImagingRequestsSearchBar } from '../components/ImagingRequestsSearchBar';
import { ImagingRequestsTable } from '../components/ImagingRequestsTable';

export const ImagingRequestListingView = React.memo(() => {
  const [searchParameters, setSearchParameters] = useState({});

  return (
  <PageContainer>
    <TopBar title="Imaging requests" />
    <ImagingRequestsSearchBar
      searchParameters={searchParameters}
      setSearchParameters={setSearchParameters}
    />
    <ImagingRequestsTable searchParameters={searchParameters} />
  </PageContainer>
  );
});
