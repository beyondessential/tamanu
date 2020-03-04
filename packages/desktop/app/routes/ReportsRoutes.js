import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { ReportScreen } from '../views';

export const ReportsRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Route path={`${match.path}/:reportId`} component={ReportScreen} />
    </Switch>
  </div>
));
