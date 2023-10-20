import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { FhirJobStatsView } from '../views';

export const FhirAdminRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/jobStats`} component={FhirJobStatsView} />
    <Redirect to={`${match.path}/jobStats`} />
  </Switch>
));
