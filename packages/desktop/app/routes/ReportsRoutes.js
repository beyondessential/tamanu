import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { ReportGenerator } from '../views';

export const ReportsRoutes = ({ match }) => (
  <Switch>
    <Route path={`${match.path}/new`} component={ReportGenerator} />
    <Redirect to={`${match.path}/new`} />
  </Switch>
);
