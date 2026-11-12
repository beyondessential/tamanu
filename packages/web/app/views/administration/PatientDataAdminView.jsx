import React from 'react';
import { PATIENT_IMPORTABLE_DATA_TYPES } from '@tamanu/constants/importable';
import { TranslatedText, useTranslation } from '@tamanu/ui-components';
import { ImportExportView } from './components/ImportExportView';

const IMPORT_WARNING = {
  title: (
    <TranslatedText
      stringId="admin.patientData.importWarning.title"
      fallback="Import patient data"
      data-testid="translatedtext-patientdata-importwarning-title"
    />
  ),
  subText: (
    <TranslatedText
      stringId="admin.patientData.importWarning.text"
      fallback="This import will create new records and overwrite existing patient data that matches rows in the file. This cannot be undone. Are you sure you want to continue?"
      data-testid="translatedtext-patientdata-importwarning-text"
    />
  ),
};

/** @privateRemarks Patient sheets go through the reference data importer, which resolves their dependencies */
export const PatientDataAdminView = () => {
  const { getTranslation } = useTranslation();
  return (
    <ImportExportView
      title={getTranslation('adminSidebar.patientData', 'Patient data')}
      endpoint="referenceData"
      dataTypes={PATIENT_IMPORTABLE_DATA_TYPES}
      dataTypesSelectable
      importWarning={IMPORT_WARNING}
      data-testid="importexportview-patientdata"
    />
  );
};
