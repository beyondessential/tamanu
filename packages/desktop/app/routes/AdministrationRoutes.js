import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import {
  ProgramsAdminView,
  ReferenceDataAdminView,
  PermissionsAdminView,
  PatientMergeView,
} from '../views';

export const AdministrationRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/refdata`} component={ReferenceDataAdminView} />
    <Route path={`${match.path}/permissions`} component={PermissionsAdminView} />
    <Route path={`${match.path}/programs`} component={ProgramsAdminView} />
    <Route path={`${match.path}/patientMerge`} component={PatientMergeView} />
    <Redirect to={`${match.path}/refdata`} />
  </Switch>
));
