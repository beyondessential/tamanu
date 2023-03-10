import React from 'react';
import { TopBar, PageContainer, LabRequestsSearchBar, ContentPane, BodyText } from '../components';
import { LabRequestsTable } from './LabRequestsTable';

export const LabRequestListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Lab requests" />
    <ContentPane>
      <BodyText fontWeight={500} mb={1}>
        Lab request search
      </BodyText>
      <LabRequestsSearchBar />
      <LabRequestsTable />
    </ContentPane>
  </PageContainer>
));
