import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { AppointmentsCalendar } from '../views/scheduling/AppointmentsCalendar';

export const AppointmentRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/calendar`} component={AppointmentsCalendar} />
    <Redirect to={`${match.path}/calender`} />
  </Switch>
));
