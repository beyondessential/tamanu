import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { ReportGenerator } from '../views';

export const ReportsRoutes = ({ match }) => (
  <Switch>
    <Redirect exact from={match.path} to={`${match.path}/new`} />
    <Route path={`${match.path}/new`} component={ReportGenerator} />
  </Switch>
);
