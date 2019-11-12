import React from 'react';

import { TopBar, PageContainer } from '../components';
import { DataFetchingMedicationTable } from '../components/MedicationTable';

export const MedicationListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Medication requests" />
    <DataFetchingMedicationTable />
  </PageContainer>
));
