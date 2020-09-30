import React from 'react';

import { TopBar, PageContainer } from '../components';
import { ImagingRequestsTable } from '../components/ImagingRequestsTable';

export const ImagingRequestListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Imaging requests" />
    <ImagingRequestsTable />
  </PageContainer>
));
