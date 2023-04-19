import React from 'react';
import { TopBar, PageContainer, LabRequestsSearchBar, ContentPane } from '../components';
import { LabRequestsTable } from './LabRequestsTable';

export const LabRequestListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Lab requests" />
    <LabRequestsSearchBar />
    <ContentPane>
      <LabRequestsTable />
    </ContentPane>
  </PageContainer>
));
