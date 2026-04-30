import EditIcon from '@mui/icons-material/Edit';
import React from 'react';

import { PERMISSION_IMPORTABLE_DATA_TYPES } from '@tamanu/constants/importable';
import { TranslatedText } from '../../../components/Translation/TranslatedText';
import { ImportExportView } from '../components/ImportExportView';
import { PermissionsEditView } from './PermissionsEditView';

const EDIT_TAB = {
  label: (
    <TranslatedText
      stringId="general.action.edit"
      fallback="Edit"
      data-testid="translatedtext-ylkq"
    />
  ),
  key: 'edit',
  icon: <EditIcon />,
  render: PermissionsEditView,
};

const buildTabs = (importTab, exportTab) => [EDIT_TAB, importTab, exportTab];

export const PermissionsAdminView = () => (
  <ImportExportView
    title="Permissions"
    endpoint="referenceData"
    dataTypes={PERMISSION_IMPORTABLE_DATA_TYPES}
    buildTabs={buildTabs}
    defaultTab="edit"
    data-testid="importexportview-2fw2"
  />
);
