import React from 'react';
import { ContentPane, PageContainer, TopBar } from '../components';
import { DataFetchingMedicationTable } from '../components/MedicationTable';

export const MedicationListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Medication requests" data-test-id='topbar-xdyr' />
    <ContentPane>
      <DataFetchingMedicationTable />
    </ContentPane>
  </PageContainer>
));
