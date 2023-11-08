import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { EditReportView } from '../views/administration/reports/EditReportView';
import { ReportsAdminView } from '../views';

export const ReportAdminRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/:reportId/versions/:versionId/edit`} component={EditReportView} />
    <Route path={match.path} component={ReportsAdminView} />
    <Redirect to={match.path} component={ReportsAdminView} />
  </Switch>
));
