import React from 'react';
import { PERMISSIONS_IMPORTABLE_DATA_TYPES } from 'shared/constants/importable';
import { ImporterView } from './components/ImporterView';

export const PermissionsAdminView = () => (
  <ImporterView
    title="Permissions"
    endpoint="refData"
    dataTypes={PERMISSIONS_IMPORTABLE_DATA_TYPES}
  />
);
