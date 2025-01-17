import React from 'react';
import { ContentPane, TopBar } from '../components';
import { DataFetchingMedicationTable } from '../components/MedicationTable';

export const MedicationListingView = React.memo(() => (
  <div>
    <TopBar title="Medication requests" />
    <ContentPane>
      <DataFetchingMedicationTable />
    </ContentPane>
  </div>
));
