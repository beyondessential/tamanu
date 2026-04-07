import React from 'react';
import { ImportExportView } from './components/ImportExportView';

/** @privateRemarks Survey response export is handled via reports */
const buildTabs = importTab => [importTab];

export const SurveyResponsesAdminView = () => (
  <ImportExportView
    title="Survey Responses"
    endpoint="surveyResponses"
    buildTabs={buildTabs}
    data-testid="importexportview-6x88"
  />
);
