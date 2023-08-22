import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import {
  ProgramsAdminView,
  AssetUploaderView,
  ReferenceDataAdminView,
  ClinicalDataAdminView,
  UserDataAdminView,
  TemplateView,
  PermissionsAdminView,
  PatientMergeView,
  SyncView,
  ReportsAdminView,
} from '../views';

export const AdministrationRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/templates`} component={TemplateView} />
    <Route path={`${match.path}/referenceData`} component={ReferenceDataAdminView} />
    <Route path={`${match.path}/clinicalData`} component={ClinicalDataAdminView} />
    <Route path={`${match.path}/userData`} component={UserDataAdminView} />
    <Route path={`${match.path}/permissions`} component={PermissionsAdminView} />
    <Route path={`${match.path}/programs`} component={ProgramsAdminView} />
    <Route path={`${match.path}/assets`} component={AssetUploaderView} />
    <Route path={`${match.path}/patientMerge`} component={PatientMergeView} />
    <Route path={`${match.path}/sync`} component={SyncView} />
    <Route path={`${match.path}/reports`} component={ReportsAdminView} />
    <Redirect to={`${match.path}/referenceData`} />
  </Switch>
));
