import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { ReportGenerator } from '../views';

export const ReportsRoutes = React.memo(({ match }) => (
    <div>
        <Switch>
            <Route exact path={match.path} component={ReportGenerator} />
        </Switch>
    </div>
));
