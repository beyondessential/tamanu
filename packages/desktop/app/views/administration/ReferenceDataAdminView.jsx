import { GENERAL_IMPORTABLE_DATA_TYPES } from '@tamanu/constants/importable';
import React from 'react';
import { ImportExportView } from './components/ImportExportView';

export const ReferenceDataAdminView = () => (
  <ImportExportView
    title="Reference data"
    endpoint="referenceData"
    dataTypes={GENERAL_IMPORTABLE_DATA_TYPES}
    dataTypesSelectable
  />
);
