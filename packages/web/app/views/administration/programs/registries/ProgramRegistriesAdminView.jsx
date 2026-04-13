import TuneIcon from '@mui/icons-material/Tune';
import React from 'react';

import { PROGRAM_REFERENCE_TYPES } from '@tamanu/constants/importable';
import { TranslatedText } from '@tamanu/ui-components';
import { useTranslation } from '../../../../contexts/Translation';
import { ImportExportView } from '../../components/ImportExportView';
import { ManageProgramRegistriesAdminView } from './ManageProgramRegistriesAdminView';

const PROGRAM_REGISTRY_DATA_TYPES = /** @type {const} */ ([
  PROGRAM_REFERENCE_TYPES.PROGRAM_REGISTRY,
  PROGRAM_REFERENCE_TYPES.PROGRAM_REGISTRY_CONDITION,
  PROGRAM_REFERENCE_TYPES.PROGRAM_REGISTRY_CONDITION_CATEGORY,
  PROGRAM_REFERENCE_TYPES.PROGRAM_REGISTRY_CLINICAL_STATUS,
]);

const manageTab = /** @type {const} */ ({
  label: (
    <TranslatedText
      stringId="admin.programRegistries.tab.manage"
      fallback="Manage"
      data-testid="translatedtext-programregistries-tab-manage"
    />
  ),
  key: 'manage',
  icon: <TuneIcon />,
  render: ManageProgramRegistriesAdminView,
});

function buildTabs(importTab, exportTab) {
  return [manageTab, importTab, exportTab];
}

export const ProgramRegistriesAdminView = () => {
  const { getTranslation } = useTranslation();

  return (
    <ImportExportView
      title={getTranslation('admin.programRegistries.title', 'Program registries')}
      endpoint="program"
      dataTypes={PROGRAM_REGISTRY_DATA_TYPES}
      dataTypesSelectable
      buildTabs={buildTabs}
      defaultTab="manage"
      data-testid="importexportview-programregistries"
    />
  );
};
