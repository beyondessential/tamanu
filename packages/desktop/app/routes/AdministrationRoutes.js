import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { NotActiveView, ProgramsAdminView, ReferenceDataAdminView } from '../views';

export const AdministrationRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Route path={`${match.path}/programs`} component={ProgramsAdminView} />
      <Route path={`${match.path}/data-import`} component={ReferenceDataAdminView} />
      <Route path={`${match.path}/settings`} component={NotActiveView} />
      <Route path={`${match.path}/users`} component={NotActiveView} />
      <Route path={`${match.path}/locations`} component={NotActiveView} />
      <Route path={`${match.path}/permissions`} component={NotActiveView} />
      <Redirect from="*" to={`${match.path}/programs`} />
    </Switch>
  </div>
));
