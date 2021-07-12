import React from 'react';
import { Route, Switch } from 'react-router-dom';

import {
  NotActiveView,
  LocationAdminView,
  ProgramsAdminView,
  UserAdminView,
  ReferenceDataAdminView,
} from '../views';

export const AdministrationRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Route exact path={match.path} component={NotActiveView} />
      <Route path={`${match.path}/settings`} component={NotActiveView} />
      <Route path={`${match.path}/users`} component={UserAdminView} />
      <Route path={`${match.path}/locations`} component={NotActiveView} />
      <Route path={`${match.path}/permissions`} component={NotActiveView} />
      <Route path={`${match.path}/programs`} component={ProgramsAdminView} />
      <Route path={`${match.path}/refdata`} component={ReferenceDataAdminView} />
    </Switch>
  </div>
));
