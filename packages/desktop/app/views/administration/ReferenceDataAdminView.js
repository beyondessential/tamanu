import React from 'react';
import { GENERAL_IMPORTABLE_DATA_TYPES } from '@tamanu/shared/constants/importable';
import { ImportExportView } from './components/ImportExportView';

export const ReferenceDataAdminView = () => (
  <ImportExportView
    title="Reference data"
    endpoint="referenceData"
    dataTypes={GENERAL_IMPORTABLE_DATA_TYPES}
    dataTypesSelectable
    useChunkData
  />
);
