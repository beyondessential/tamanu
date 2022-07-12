import React from 'react';
import { TopBar, PageContainer, LabRequestsSearchBar } from '../components';
import { LabRequestsTable } from '../components/LabRequestsTable';

export const LabRequestListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Lab requests" />
    <LabRequestsSearchBar />
    <LabRequestsTable />
  </PageContainer>
));
