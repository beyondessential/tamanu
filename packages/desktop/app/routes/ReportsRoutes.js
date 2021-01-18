import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { ReportGenerator } from '../views';

export const ReportsRoutes = (({ match }) => (
    <Switch>
        <Route exact path={match.path} component={ReportGenerator} />
    </Switch>
));
