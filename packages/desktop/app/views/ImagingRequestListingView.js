import React from 'react';

import { TopBar, PageContainer } from '../components';
import { DataFetchingImagingRequestsTable } from '../components/ImagingRequestsTable';

export const ImagingRequestListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Imaging requests" />
    <DataFetchingImagingRequestsTable />
  </PageContainer>
));
