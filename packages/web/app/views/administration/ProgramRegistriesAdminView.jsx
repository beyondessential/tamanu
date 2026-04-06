import React from 'react';
import { TranslatedText } from '@tamanu/ui-components';

import { AdminViewContainer } from './components/AdminViewContainer';

export const ProgramRegistriesAdminView = () => (
  <AdminViewContainer
    title={
      <TranslatedText
        stringId="adminSidebar.programRegistries"
        fallback="Program registries"
        data-testid="translatedtext-programregistries-title"
      />
    }
  />
);
