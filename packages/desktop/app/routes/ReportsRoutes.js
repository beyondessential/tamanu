import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { ReportGenerator } from '../views';
import { ConnectedVillageDiagnosesByWeekReport } from '../views/reports/VillageDiagnosesByWeekReport';

export const ReportsRoutes = React.memo(({ match }) => {
  return (
    <div>
      <Switch>
        <Route path={`${match.path}/diagnosesByWeek`} component={ConnectedVillageDiagnosesByWeekReport} />
        <Route path={`${match.path}/:reportId`} component={ReportGenerator} />
      </Switch>
    </div>
  );
});
