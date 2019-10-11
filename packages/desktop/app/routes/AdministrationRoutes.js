import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { NotActiveView, LocationAdminView } from '../views';

export const AdministrationRoutes = React.memo(({ match }) => {
  return (
    <div>
      <Switch>
        <Route exact path={match.path} component={NotActiveView} />
        <Route path={`${match.path}/settings`} component={NotActiveView} />
        <Route exact path={`${match.path}/users`} component={NotActiveView} />
        <Route path={`${match.path}/locations`} component={LocationAdminView} />
        <Route path={`${match.path}/users/edit/new`} component={NotActiveView} />
        <Route path={`${match.path}/permissions`} component={NotActiveView} />
      </Switch>
    </div>
  );
});
