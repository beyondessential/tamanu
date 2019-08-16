import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { NotActiveView } from '../views';

export const SchedulingRoutes = React.memo(({ match }) => {
  return (
    <Switch>
      <Route exact path={match.url} component={NotActiveView} />
      <Route path={`${match.url}/week`} component={NotActiveView} />
      <Route path={`${match.url}/today`} component={NotActiveView} />
      <Route path={`${match.url}/search`} component={NotActiveView} />
      <Route path={`${match.url}/calendar`} component={NotActiveView} />
      <Route path={`${match.url}/appointmentByPatient/:patientId`} component={NotActiveView} />
      <Route path={`${match.url}/appointment/new`} component={NotActiveView} />
      <Route path={`${match.url}/appointment/:id`} component={NotActiveView} />
      <Route path={`${match.url}/theater`} component={NotActiveView} />
      <Route path={`${match.url}/surgery/new`} component={NotActiveView} />
      <Route path={`${match.url}/surgery/:id`} component={NotActiveView} />
    </Switch>
  );
});
