import React from 'react';
import { GENERAL_IMPORTABLE_DATA_TYPES } from 'shared/constants/importable';
import { ImporterView } from './components/ImporterView';

export const ReferenceDataAdminView = () => (
  <ImporterView
    title="Reference data"
    endpoint="refData"
    dataTypes={GENERAL_IMPORTABLE_DATA_TYPES}
    dataTypesSelectable
  />
);
