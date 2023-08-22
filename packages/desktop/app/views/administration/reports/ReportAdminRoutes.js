import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { ReportsAdminView } from './ReportsAdminView';
import { EditReportView } from './EditReportView';

export const ReportAdminRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/version/:versionId/edit`} component={EditReportView} />
    <Route path={match.path} component={ReportsAdminView} />
    <Redirect to={match.path} component={ReportsAdminView} />
  </Switch>
));
