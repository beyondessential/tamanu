import React from 'react';

import { TopBar, PageContainer } from '../components';
import { DataFetchingLabRequestsTable } from '../components/LabRequestsTable';

export const LabRequestListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Lab requests" />
    <DataFetchingLabRequestsTable />
  </PageContainer>
));
