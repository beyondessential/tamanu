import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { AppointmentsCalendar, AppointmentsCalendarOld } from '../views/scheduling';

export const AppointmentRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/calendar`} component={AppointmentsCalendar} />
    <Route path={`${match.path}/old-calendar`} component={AppointmentsCalendarOld} />
    <Redirect to={`${match.path}/calendar`} />
  </Switch>
));
