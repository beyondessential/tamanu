import React from 'react';
import { ImportExportView } from './components/ImportExportView';

export const PermissionsAdminView = () => (
  <ImportExportView title="Permissions" endpoint="refData" dataTypes={['permissions']} />
);
