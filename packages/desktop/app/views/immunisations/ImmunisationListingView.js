import React from 'react';

import { TopBar, PageContainer } from '../../components';
import { ImmunisationRegisterTable } from './ImmunisationRegisterTable';

export const ImmunisationListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Immunisation Register" />
    <ImmunisationRegisterTable />
  </PageContainer>
));
