import React from 'react';

import { TopBar, PageContainer } from '../components';
import { LabRequestsTable } from '../components/LabRequestsTable';

export const LabRequestListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Lab requests" />
    <LabRequestsTable />
  </PageContainer>
));
