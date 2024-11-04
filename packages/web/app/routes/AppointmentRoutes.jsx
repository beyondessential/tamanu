import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { LocationBookingsView, OutpatientAppointmentsView } from '../views/scheduling';
import { LocationBookingFiltersProvider } from '../contexts/LocationBookingFilters';

export const AppointmentRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/outpatients`} component={OutpatientAppointmentsView} />
    <Route path={`${match.path}/locations`}>
      <LocationBookingFiltersProvider>
        <LocationBookingsView />
      </LocationBookingFiltersProvider>
    </Route>
    <Redirect to={`${match.path}/outpatients`} />
  </Switch>
));
