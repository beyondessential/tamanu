import React from 'react';
import { ContentPane, PageContainer, TopBar } from '../components';
import { DataFetchingMedicationTable } from '../components/MedicationTable';

export const MedicationListingView = React.memo(() => (
  <PageContainer data-testid="pagecontainer-fqd5">
    <TopBar title="Medication requests" data-testid="topbar-5pha" />
    <ContentPane data-testid="contentpane-jykr">
      <DataFetchingMedicationTable data-testid="datafetchingmedicationtable-0r1r" />
    </ContentPane>
  </PageContainer>
));
