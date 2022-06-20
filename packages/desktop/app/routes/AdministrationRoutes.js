import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { NotActiveView, ProgramsAdminView, ReferenceDataAdminView } from '../views';

export const AdministrationRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Redirect exact from={match.path} to={`${match.path}/programs`} />
      <Route path={`${match.path}/programs`} component={ProgramsAdminView} />
      <Route path={`${match.path}/data-import`} component={ReferenceDataAdminView} />
      {/* Placeholder routes visible in submenu */}
      <Route path={`${match.path}/settings`} component={NotActiveView} />
      <Route path={`${match.path}/users`} component={NotActiveView} />
      <Route path={`${match.path}/locations`} component={NotActiveView} />
      <Route path={`${match.path}/permissions`} component={NotActiveView} />
    </Switch>
  </div>
));
