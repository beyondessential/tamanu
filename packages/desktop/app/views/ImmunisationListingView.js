import React from 'react';

import { TopBar, PageContainer } from '../components';
import { ImmunisationsTable } from '../components/ImmunisationsTable';

export const ImmunisationListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Immunisation Register" />
    <ImmunisationsTable />
  </PageContainer>
));
