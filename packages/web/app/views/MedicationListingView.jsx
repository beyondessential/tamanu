import React from 'react';
import { ContentPane, PageContainer, TopBar, TranslatedText } from '../components';
import { DataFetchingMedicationTable } from '../components/MedicationTable';

export const MedicationListingView = React.memo(() => (
  <PageContainer data-testid="pagecontainer-fqd5">
    <TopBar
      title={
        <TranslatedText
          stringId="medicationList.title"
          fallback="Medication requests"
          data-testid="translatedtext-df12"
        />
      }
      data-testid="topbar-5pha"
    />
    <ContentPane data-testid="contentpane-jykr">
      <DataFetchingMedicationTable data-testid="datafetchingmedicationtable-0r1r" />
    </ContentPane>
  </PageContainer>
));
