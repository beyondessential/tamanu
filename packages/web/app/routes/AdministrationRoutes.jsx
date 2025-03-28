import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { ReportAdminRoutes } from './ReportAdminRoutes';
import { FhirAdminRoutes } from './FhirAdminRoutes';
import {
  AssetUploaderView,
  InsurerPaymentsAdminView,
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

export const AdministrationRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/assets`} component={AssetUploaderView} />
    <Route path={`${match.path}/fhir`} component={FhirAdminRoutes} />
    <Route path={`${match.path}/patientMerge`} component={PatientMergeView} />
    <Route path={`${match.path}/permissions`} component={PermissionsAdminView} />
    <Route path={`${match.path}/programs`} component={ProgramsAdminView} />
    <Route path={`${match.path}/referenceData`} component={ReferenceDataAdminView} />
    <Route path={`${match.path}/reports`} component={ReportAdminRoutes} />
    <Route path={`${match.path}/settings`} component={SettingsView} />
    <Route path={`${match.path}/surveyResponses`} component={SurveyResponsesAdminView} />
    <Route path={`${match.path}/sync`} component={SyncView} />
    <Route path={`${match.path}/templates`} component={TemplateView} />
    <Route path={`${match.path}/translation`} component={TranslationAdminView} />
    <Route path={`${match.path}/users`} component={UserAdminView} />
    <Route path={`${match.path}/fhir`} component={FhirAdminRoutes} />
    <Route path={`${match.path}/insurerPayments`} component={InsurerPaymentsAdminView} />
    <Redirect to={`${match.path}/referenceData`} />
  </Switch>
));
