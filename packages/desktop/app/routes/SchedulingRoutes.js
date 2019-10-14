import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { NotActiveView } from '../views';

import { AppointmentListingView } from '../views/AppointmentListingView';

export const SchedulingRoutes = React.memo(({ match }) => (
  <Switch>
    <Route exact path={match.path} component={AppointmentListingView} />
    <Route path={`${match.path}/week`} component={NotActiveView} />
    <Route path={`${match.path}/today`} component={NotActiveView} />
    <Route path={`${match.path}/search`} component={NotActiveView} />
    <Route path={`${match.path}/calendar`} component={NotActiveView} />
    <Route path={`${match.path}/appointmentByPatient/:patientId`} component={NotActiveView} />
    <Route path={`${match.path}/appointment/new`} component={NotActiveView} />
    <Route path={`${match.path}/appointment/:id`} component={NotActiveView} />
    <Route path={`${match.path}/theater`} component={NotActiveView} />
    <Route path={`${match.path}/surgery/new`} component={NotActiveView} />
    <Route path={`${match.path}/surgery/:id`} component={NotActiveView} />
  </Switch>
));
