import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { BedManagement } from '../views/facility/BedManagement';
import { ReportGenerator } from '../views/reports';

export const FacilityAdminRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/reports`} component={ReportGenerator} />
    <Route path={`${match.path}/bed-management`} component={BedManagement} />
    <Redirect to={`${match.path}/bed-management`} />
  </Switch>
));
