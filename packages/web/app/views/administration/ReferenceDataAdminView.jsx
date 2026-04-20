import React from 'react';
import TuneIcon from '@mui/icons-material/Tune';
import { GENERAL_IMPORTABLE_DATA_TYPES } from '@tamanu/constants/importable';
import { TranslatedText } from '../../components/Translation/TranslatedText';
import { ImportExportView } from './components/ImportExportView';
import { ManageReferenceDataTab } from './components/ManageReferenceDataTab';

const MANAGE_TAB = {
  label: (
    <TranslatedText
      stringId="admin.referenceData.manage"
      fallback="Manage"
      data-testid="translatedtext-refdata-manage"
    />
  ),
  key: 'manage',
  icon: <TuneIcon />,
  render: () => <ManageReferenceDataTab data-testid="manage-refdata-tab" />,
};

export const ReferenceDataAdminView = () => (
  <ImportExportView
    title="Reference data"
    endpoint="referenceData"
    dataTypes={GENERAL_IMPORTABLE_DATA_TYPES}
    dataTypesSelectable
    buildTabs={(importTab, exportTab) => [MANAGE_TAB, importTab, exportTab]}
    defaultTab="manage"
    data-testid="importexportview-d48b"
  />
);
