import React from 'react';
import { ContentPane, PageContainer, TopBar } from '../components';

export const MedicationListingView = React.memo(() => (
  <PageContainer data-testid="pagecontainer-fqd5">
    <TopBar title="Medication requests" data-testid="topbar-5pha" />
    <ContentPane data-testid="contentpane-jykr">
      {/* to be updated */}
    </ContentPane>
  </PageContainer>
));
