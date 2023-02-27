import React from 'react';
import { ImporterView } from './components/ImporterView';

export const PermissionsAdminView = () => (
  <ImporterView title="Permissions" endpoint="refData" dataTypes={['permissions']} />
);
