import React from 'react';
import { ImportExportView } from './components/ImportExportView';

// TODO: when export is supported in TAN-2029, remove disableExport support everywhere
export const SurveyResponsesAdminView = () => (
  <ImportExportView 
    title="Survey Responses" 
    endpoint="surveyResponses" 
    disableExport 
  /> 
);
