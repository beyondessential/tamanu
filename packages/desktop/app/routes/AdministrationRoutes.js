import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { ReportAdminRoutes } from './ReportAdminRoutes';
import {
  AssetUploaderView,
  FhirJobStatsView,
  PatientMergeView,
  PermissionsAdminView,
  ProgramsAdminView,
  ReferenceDataAdminView,
  SyncView,
  TemplateView,
} from '../views';

export const AdministrationRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/templates`} component={TemplateView} />
    <Route path={`${match.path}/referenceData`} component={ReferenceDataAdminView} />
    <Route path={`${match.path}/permissions`} component={PermissionsAdminView} />
    <Route path={`${match.path}/programs`} component={ProgramsAdminView} />
    <Route path={`${match.path}/assets`} component={AssetUploaderView} />
    <Route path={`${match.path}/patientMerge`} component={PatientMergeView} />
    <Route path={`${match.path}/sync`} component={SyncView} />
    <Route path={`${match.path}/reports`} component={ReportAdminRoutes} />
    <Route path={`${match.path}/fhir/jobStats`} component={FhirJobStatsView} />
    <Redirect to={`${match.path}/referenceData`} />
  </Switch>
));
