import React from 'react';
import { ImporterView } from './components/ImporterView';

export const PermissionsAdminView = () => (
  <ImporterView title="Import permissions" endpoint="admin/importRefData" />
);
