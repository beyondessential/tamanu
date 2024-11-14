import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { LocationBookingsContextProvider } from '../contexts/LocationBookings';
import { LocationBookingsView, OutpatientAppointmentsView } from '../views/scheduling';

export const AppointmentRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/outpatients`} component={OutpatientAppointmentsView} />
    <Route path={`${match.path}/locations`}>
      <LocationBookingsContextProvider>
        <LocationBookingsView />
      </LocationBookingsContextProvider>
    </Route>
    <Redirect to={`${match.path}/outpatients`} />
  </Switch>
));
