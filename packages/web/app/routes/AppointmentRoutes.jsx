import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { LocationBookingsView, OutpatientAppointmentsView } from '../views/scheduling';

export const AppointmentRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/outpatients`} component={OutpatientAppointmentsView} />
    <Route path={`${match.path}/locations`} component={LocationBookingsView} />
    <Redirect to={`${match.path}/outpatients`} />
  </Switch>
));
