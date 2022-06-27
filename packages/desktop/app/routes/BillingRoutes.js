import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { NotActiveView } from '../views';

export const BillingRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Route exact path={match.path} component={NotActiveView} />
      <Route exact path={`${match.path}/draft`} component={NotActiveView} />
      <Route exact path={`${match.path}/all`} component={NotActiveView} />
      <Route exact path={`${match.path}/paid`} component={NotActiveView} />
      <Route exact path={`${match.path}/edit/new`} component={NotActiveView} />
      <Route exact path={`${match.path}/pricing`} component={NotActiveView} />
      <Route exact path={`${match.path}/pricing/imaging`} component={NotActiveView} />
      <Route exact path={`${match.path}/pricing/lab`} component={NotActiveView} />
      <Route exact path={`${match.path}/pricing/procedure`} component={NotActiveView} />
      <Route exact path={`${match.path}/pricing/ward`} component={NotActiveView} />
      <Route exact path={`${match.path}/pricing/profiles`} component={NotActiveView} />
      <Redirect to={match.path} />
    </Switch>
  </div>
));
