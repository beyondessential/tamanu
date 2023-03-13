import React from 'react';
import {
  TopBar,
  PageContainer,
  LabRequestsSearchBar,
  ContentPane,
  SearchTableTitle,
} from '../components';
import { LabRequestsTable } from '../components/LabRequestsTable';

export const LabRequestListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Lab requests" />
    <ContentPane>
      <SearchTableTitle>Lab request search</SearchTableTitle>
      <LabRequestsSearchBar />
      <LabRequestsTable />
    </ContentPane>
  </PageContainer>
));
