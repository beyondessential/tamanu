import React from 'react';
import { PERMISSION_IMPORTABLE_DATA_TYPES } from '@tamanu/shared/constants/importable';
import { ImportExportView } from './components/ImportExportView';

export const PermissionsAdminView = () => (
  <ImportExportView
    title="Permissions"
    endpoint="referenceData"
    disableExport
    dataTypes={PERMISSION_IMPORTABLE_DATA_TYPES}
  />
);
