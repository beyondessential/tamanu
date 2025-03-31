import React from 'react';
import { ImportExportView } from './components/ImportExportView';

export const SurveyResponsesAdminView = () => (
  <ImportExportView
    title="Survey Responses"
    endpoint="surveyResponses"
    // survey response export is handled via reports
    buildTabs={importTab => [importTab]}
    data-testid='importexportview-6x88' />
);
