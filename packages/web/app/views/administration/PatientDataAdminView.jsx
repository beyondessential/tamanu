import React from 'react';
import { PATIENT_IMPORTABLE_DATA_TYPES } from '@tamanu/constants/importable';
import { useTranslation } from '@tamanu/ui-components';
import { ImportExportView } from './components/ImportExportView';

/** @privateRemarks Patient sheets go through the reference data importer, which resolves their dependencies */
export const PatientDataAdminView = () => {
  const { getTranslation } = useTranslation();
  return (
    <ImportExportView
      title={getTranslation('adminSidebar.patientData', 'Patient data')}
      endpoint="referenceData"
      dataTypes={PATIENT_IMPORTABLE_DATA_TYPES}
      dataTypesSelectable
      data-testid="importexportview-patientdata"
    />
  );
};
