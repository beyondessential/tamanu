import React from 'react';
import { Navigate, Route, Routes } from 'react-router';

import { useSettings } from '../contexts/Settings';
import { LocationAssignmentsContextProvider } from '../contexts/LocationAssignments';
import {
  AssetUploaderView,
  AiFormBuilderView,
  DesignationsAdminView,
  InsurerPaymentsAdminView,
  LocationAssignmentsAdminView,
  ManageProgramRegistriesRoutes,
  ManageProgramsAdminView,
  PatientMergeView,
  PermissionsAdminView,
  ProgramRegistriesAdminView,
  ProgramsAdminView,
  ProgramsExportTab,
  ProgramsImportTab,
  ReferenceDataAdminView,
  RolesAdminView,
  RolesAndDesignationsAdminView,
  SettingsView,
  SurveyResponsesAdminView,
  SyncView,
  TemplateView,
  TranslationAdminView,
  UserProfilesAdminView,
} from '../views';
import { FhirAdminRoutes } from './FhirAdminRoutes';
import { ReportAdminRoutes } from './ReportAdminRoutes';

export const AdministrationRoutes = React.memo(() => {
  const { getSetting } = useSettings();
  const isAiFormBuilderEnabled = Boolean(getSetting('formBuilder.enabled'));

  return (
    <Routes>
      <Route path="assets" element={<AssetUploaderView />} />
      <Route path="fhir/*" element={<FhirAdminRoutes />} />
      <Route path="patientMerge" element={<PatientMergeView />} />
      <Route path="permissions" element={<PermissionsAdminView />} />
      <Route path="programs">
        <Route index element={<Navigate to="forms" replace />} />
        <Route path="forms/*" element={<ProgramsAdminView />}>
          <Route
            index
            element={<Navigate to={isAiFormBuilderEnabled ? 'aiFormBuilder' : 'manage'} replace />}
          />
          {isAiFormBuilderEnabled && (
            <Route path="aiFormBuilder" element={<AiFormBuilderView />} />
          )}
          <Route path="manage" element={<ManageProgramsAdminView />} />
          <Route path="manage/:programId" element={<ManageProgramsAdminView />} />
          <Route path="import" element={<ProgramsImportTab />} />
          <Route path="export" element={<ProgramsExportTab />} />
        </Route>
        <Route path="registries" element={<ProgramRegistriesAdminView />}>
          <Route path=":programRegistryId/*" element={<ManageProgramRegistriesRoutes />} />
        </Route>
      </Route>
      <Route path="referenceData" element={<ReferenceDataAdminView />} />
      <Route path="reports/*" element={<ReportAdminRoutes />} />
      <Route path="settings" element={<SettingsView />} />
      <Route path="surveyResponses" element={<SurveyResponsesAdminView />} />
      <Route path="sync" element={<SyncView />} />
      <Route path="templates" element={<TemplateView />} />
      <Route path="translation" element={<TranslationAdminView />} />
      <Route path="users">
        <Route index element={<Navigate to="profiles" replace />} />
        <Route path="profiles" element={<UserProfilesAdminView />} />

        <Route path="rolesAndDesignations" element={<RolesAndDesignationsAdminView />}>
          <Route index element={<Navigate to="roles" replace />} />
          <Route path="roles">
            <Route index element={<RolesAdminView />} />
            <Route path="new" element={<RolesAdminView />} />
            <Route path="delete/:id" element={<RolesAdminView />} />
          </Route>
          <Route path="designations">
            <Route index element={<DesignationsAdminView />} />
            <Route path="new" element={<DesignationsAdminView />} />
            <Route path="delete/:id" element={<DesignationsAdminView />} />
          </Route>
        </Route>
        <Route
          path="locationAssignment"
          element={
            <LocationAssignmentsContextProvider>
              <LocationAssignmentsAdminView />
            </LocationAssignmentsContextProvider>
          }
        />
      </Route>
      <Route path="insurerPayments" element={<InsurerPaymentsAdminView />} />
      <Route path="*" element={<Navigate to="referenceData" replace />} />
    </Routes>
  );
});
