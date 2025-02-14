import React from 'react';
import { ImportExportView } from './components/ImportExportView';

export const SurveyResponsesAdminView = () => (
  <ImportExportView
    title="Survey Responses"
    endpoint="surveyResponses"
    buildTabs={importTab => [importTab]} // survey response export is handled via reports
  />
);
