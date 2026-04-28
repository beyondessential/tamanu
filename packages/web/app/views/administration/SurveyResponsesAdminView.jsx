import { useTranslation } from '@tamanu/ui-components';
import React from 'react';
import { ImportExportView } from './components/ImportExportView';

/** @privateRemarks Survey response export is handled via reports */
const buildTabs = importTab => [importTab];

export const SurveyResponsesAdminView = () => {
  const { getTranslation } = useTranslation();
  return (
    <ImportExportView
      title={getTranslation('adminSidebar.surveyResponses', 'Survey responses')}
      endpoint="surveyResponses"
      buildTabs={buildTabs}
      data-testid="importexportview-6x88"
    />
  );
};
