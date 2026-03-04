import React from 'react';
import { Routes, Route, Navigate } from 'react-router';

import { LocationAssignmentsContextProvider } from '../contexts/LocationAssignments';
import { ReportAdminRoutes } from './ReportAdminRoutes';
import { FhirAdminRoutes } from './FhirAdminRoutes';
import {
  AssetUploaderView,
  InsurerPaymentsAdminView,
  LocationAssignmentsAdminView,
  PatientMergeView,
  PermissionsAdminView,
  ProgramsAdminView,
  SurveyResponsesAdminView,
  ReferenceDataAdminView,
  SyncView,
  TemplateView,
  TranslationAdminView,
  SettingsView,
  UserAdminView,
} from '../views';

export const AdministrationRoutes = React.memo(() => (
  <Routes>
    <Route path="assets" element={<AssetUploaderView />} />
    <Route path="fhir/*" element={<FhirAdminRoutes />} />
    <Route path='locationAssignments' element={<LocationAssignmentsContextProvider>
      <LocationAssignmentsAdminView />
    </LocationAssignmentsContextProvider>} />
    <Route path="patientMerge" element={<PatientMergeView />} />
    <Route path="permissions" element={<PermissionsAdminView />} />
    <Route path="programs" element={<ProgramsAdminView />} />
    <Route path="referenceData" element={<ReferenceDataAdminView />} />
    <Route path="reports/*" element={<ReportAdminRoutes />} />
    <Route path="settings" element={<SettingsView />} />
    <Route path="surveyResponses" element={<SurveyResponsesAdminView />} />
    <Route path="sync" element={<SyncView />} />
    <Route path="templates" element={<TemplateView />} />
    <Route path="translation" element={<TranslationAdminView />} />
    <Route path="users" element={<UserAdminView />} />
    <Route path="insurerPayments" element={<InsurerPaymentsAdminView />} />
    <Route path="*" element={<Navigate to="referenceData" replace />} />
  </Routes>
));
