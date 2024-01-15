import React from 'react';
import { ImportExportView } from './components/ImportExportView';

export const SurveyResponsesAdminView = () => (
  // TODO: when export is supported in TAN-2029, remove disableExport support everywhere
  <ImportExportView 
    title="Survey Responses" 
    endpoint="surveyResponses" 
    disableExport 
  /> 
);
