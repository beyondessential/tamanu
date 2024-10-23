import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { LocationBookingsView, OutpatientAppointmentsCalendar } from '../views/scheduling';


export const AppointmentRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/calendar`} component={OutpatientAppointmentsCalendar} />
    <Route path={`${match.path}/locations`} component={LocationBookingsView} />
    <Redirect to={`${match.path}/calendar`} />
  </Switch>
));
