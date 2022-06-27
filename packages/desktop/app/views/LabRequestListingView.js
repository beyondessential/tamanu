import React from 'react';

import { TopBar, PageContainer } from '../components';
import { LabRequestsSearchBar } from '../components/LabRequestsSearchBar';
import { LabRequestsTable } from '../components/LabRequestsTable';

export const LabRequestListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Lab requests" />
    <LabRequestsSearchBar />
    <LabRequestsTable />
  </PageContainer>
));
