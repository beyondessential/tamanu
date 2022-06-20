import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { AppointmentListingView } from '../views/scheduling/AppointmentListingView';
import { NewAppointmentView } from '../views/scheduling/NewAppointmentView';
import { AppointmentsCalendar } from '../views/scheduling/AppointmentsCalendar';

export const AppointmentRoutes = React.memo(({ match }) => (
  <Switch>
    <Redirect exact from={match.path} to={`${match.path}/all`} />
    <Route path={`${match.path}/all`} component={AppointmentListingView} />
    <Route path={`${match.path}/calendar`} component={AppointmentsCalendar} />
    <Route path={`${match.path}/new`} component={NewAppointmentView} />
  </Switch>
));
