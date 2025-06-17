import React from 'react';
import { ContentPane, PageContainer, TopBar, TranslatedText } from '../components';

export const MedicationListingView = React.memo(() => (
  <PageContainer data-testid="pagecontainer-fqd5">
    <TopBar
      title={
        <TranslatedText
          stringId="medication.list.title"
          fallback="Medication requests"
          data-testid="translatedtext-df12"
        />
      }
      data-testid="topbar-5pha"
    />
    <ContentPane data-testid="contentpane-jykr">
      {/* to be updated */}
    </ContentPane>
  </PageContainer>
));
