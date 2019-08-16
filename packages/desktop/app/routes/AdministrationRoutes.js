import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { NotActiveView } from '../views';

export const AdministrationRoutes = React.memo(({ match }) => {
  return (
    <div>
      <Switch>
        <Route exact path={match.url} component={NotActiveView} />
        <Route path={`${match.url}/settings`} component={NotActiveView} />
        <Route exact path={`${match.url}/users`} component={NotActiveView} />
        <Route path={`${match.url}/users/edit/new`} component={NotActiveView} />
        <Route path={`${match.url}/permissions`} component={NotActiveView} />
      </Switch>
    </div>
  );
});
