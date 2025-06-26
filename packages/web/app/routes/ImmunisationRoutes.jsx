import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { ImmunisationsView } from '../views/patients';

export const ImmunisationRoutes = React.memo(({ match }) => (
  <Switch>
    <Route exact path={`${match.path}/all`} component={ImmunisationsView} />
    <Redirect to={`${match.path}/all`} />
  </Switch>
));
