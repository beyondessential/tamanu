import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { LocationBookingsView, OutpatientAppointmentsView } from '../views/scheduling';
import { LocationBookingProvider } from '../contexts/LocationBooking';

export const AppointmentRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/outpatients`} component={OutpatientAppointmentsView} />
    <Route path={`${match.path}/locations`}>
      <LocationBookingProvider>
        <LocationBookingsView />
      </LocationBookingProvider>
    </Route>
    <Redirect to={`${match.path}/outpatients`} />
  </Switch>
));
