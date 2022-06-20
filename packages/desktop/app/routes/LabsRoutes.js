import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { NotActiveView } from '../views';
import { LabRequestListingView } from '../views/LabRequestListingView';

export const LabsRoutes = React.memo(({ match }) => (
  <Switch>
    <Redirect exact path={match.path} to={`${match.path}/all`} />
    <Route path={`${match.path}/all`} component={LabRequestListingView} />
    <Route path={`${match.path}/completed`} component={NotActiveView} />
    <Route path={`${match.path}/new`} component={NotActiveView} />
  </Switch>
));
