import React from 'react';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { AdminViewContainer } from './components/AdminViewContainer';

export const RolesAndDesignationsAdminView = () => (
  <AdminViewContainer
    title={
      <TranslatedText
        stringId="adminSidebar.rolesAndDesignations"
        fallback="Roles & designations"
        data-testid="translatedtext-roles-designations-title"
      />
    }
  />
);
