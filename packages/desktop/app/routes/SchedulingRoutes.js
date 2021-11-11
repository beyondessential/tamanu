import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { AppointmentListingView } from '../views/scheduling/AppointmentListingView';
import { NewAppointmentView } from '../views/scheduling/NewAppointmentView';
import { AppointmentsCalendar } from '../views/scheduling/AppointmentsCalendar';

export const SchedulingRoutes = React.memo(({ match }) => (
  <Switch>
    <Route exact path={match.path} component={AppointmentListingView} />
    <Route path={`${match.path}/calendar`} component={AppointmentsCalendar} />
    <Route path={`${match.path}/appointment/new`} component={NewAppointmentView} />
  </Switch>
));
