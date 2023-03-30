import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import {
  ProgramsAdminView,
  ReferenceDataAdminView,
  PermissionsAdminView,
  PatientMergeView,
  SyncView,
  ReportsAdminView,
} from '../views';

export const AdministrationRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/refdata`} component={ReferenceDataAdminView} />
    <Route path={`${match.path}/permissions`} component={PermissionsAdminView} />
    <Route path={`${match.path}/programs`} component={ProgramsAdminView} />
    <Route path={`${match.path}/patientMerge`} component={PatientMergeView} />
    <Route path={`${match.path}/reports`} component={ReportsAdminView} />
    <Route path={`${match.path}/sync`} component={SyncView} />
    <Redirect to={`${match.path}/refdata`} />
  </Switch>
));
