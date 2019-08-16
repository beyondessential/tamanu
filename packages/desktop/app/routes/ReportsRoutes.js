import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { ReportGenerator } from '../views';

export const ReportsRoutes = React.memo(({ match }) => {
  return (
    <div>
      <Switch>
        <Route path={`${match.url}/:reportId`} component={ReportGenerator} />
      </Switch>
    </div>
  );
});
