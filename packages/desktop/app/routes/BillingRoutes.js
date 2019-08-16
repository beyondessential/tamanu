import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { NotActiveView } from '../views';

export const BillingRoutes = React.memo(({ match }) => {
  return (
    <div>
      <Switch>
        <Route exact path={match.url} component={NotActiveView} />
        <Route exact path={`${match.url}/draft`} component={NotActiveView} />
        <Route exact path={`${match.url}/all`} component={NotActiveView} />
        <Route exact path={`${match.url}/paid`} component={NotActiveView} />
        <Route exact path={`${match.url}/edit/new`} component={NotActiveView} />
        <Route exact path={`${match.url}/pricing`} component={NotActiveView} />
        <Route exact path={`${match.url}/pricing/imaging`} component={NotActiveView} />
        <Route exact path={`${match.url}/pricing/lab`} component={NotActiveView} />
        <Route exact path={`${match.url}/pricing/procedure`} component={NotActiveView} />
        <Route exact path={`${match.url}/pricing/ward`} component={NotActiveView} />
        <Route exact path={`${match.url}/pricing/profiles`} component={NotActiveView} />
      </Switch>
    </div>
  );
});
