import React from 'react';
import { GENERAL_IMPORTABLE_DATA_TYPES } from 'shared/constants/importable';
import { ImportExportView } from './components/ImportExportView';

export const ReferenceDataAdminView = () => (
  <ImportExportView
    title="Reference data"
    endpoint="refData"
    dataTypes={GENERAL_IMPORTABLE_DATA_TYPES}
    dataTypesSelectable
  />
);
