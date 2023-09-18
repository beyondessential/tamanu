import React from 'react';
import { PERMISSION_IMPORTABLE_DATA_TYPES } from '@tamanu/constants/importable';
import { ImportExportView } from './components/ImportExportView';

export const PermissionsAdminView = () => (
  <ImportExportView
    title="Permissions"
    endpoint="referenceData"
    dataTypes={PERMISSION_IMPORTABLE_DATA_TYPES}
  />
);
