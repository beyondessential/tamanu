import React from 'react';
import { REFERENCE_IMPORTABLE_DATA_TYPES, CLINICAL_IMPORTABLE_DATA_TYPES } from '@tamanu/constants/importable';
import { ImportExportView } from './components/ImportExportView';

export const ReferenceDataAdminView = () => (
  <ImportExportView
    title="Reference data"
    endpoint="referenceData"
    dataTypes={REFERENCE_IMPORTABLE_DATA_TYPES}
    dataTypesSelectable
  />
);

export const ClinicalDataAdminView = () => (
  <ImportExportView
    title="Clinical data"
    endpoint="referenceData"
    dataTypes={CLINICAL_IMPORTABLE_DATA_TYPES}
    dataTypesSelectable
  />
);

export const UserDataAdminView = () => (
  <ImportExportView
    title="User data"
    endpoint="referenceData"
    dataTypes={USER_IMPORTABLE_DATA_TYPES}
  />
);
