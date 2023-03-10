import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { BedManagement } from '../views/facility/BedManagement';

export const FacilityAdminRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/reports`} component={null} />
    <Route path={`${match.path}/bed-management`} component={BedManagement} />
    <Redirect to={`${match.path}/bed-management`} />
  </Switch>
));
