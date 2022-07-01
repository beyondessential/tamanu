import React from 'react';
import { TopBar, PageContainer, ContentPane } from '../components';
import { TriageTable } from '../components/TriageTable';
import { TriageDashboard } from '../components/TriageDashboard';

export const TriageListingView = React.memo(() => {
  return (
    <PageContainer>
      <TopBar title="Emergency patients" />
      <ContentPane>
        <TriageDashboard />
      </ContentPane>
      <ContentPane>
        <TriageTable />
      </ContentPane>
    </PageContainer>
  );
});
