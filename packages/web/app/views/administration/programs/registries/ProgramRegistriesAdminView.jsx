import React from 'react';

import { AdminViewContainer } from '../../components/AdminViewContainer';
import { ManageProgramRegistriesAdminView } from './ManageProgramRegistriesAdminView';
import { TranslatedText } from '@tamanu/ui-components';

export const ProgramRegistriesAdminView = () => {
  return (
    <AdminViewContainer
      title={
        <TranslatedText stringId="admin.programRegistries.title" fallback="Program registries" />
      }
    >
      <ManageProgramRegistriesAdminView />
    </AdminViewContainer>
  );
};
