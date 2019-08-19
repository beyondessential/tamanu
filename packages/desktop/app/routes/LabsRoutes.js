import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { NotActiveView } from '../views';

export const LabsRoutes = React.memo(({ match }) => {
  return (
    <Switch>
      <Route exact path={match.path} component={NotActiveView} />
      <Route path={`${match.path}/requests`} component={NotActiveView} />
      <Route path={`${match.path}/request/by-patient/:patientId/:id`} component={NotActiveView} />
      <Route path={`${match.path}/request/by-patient/:patientId`} component={NotActiveView} />
      <Route path={`${match.path}/request/:id`} component={NotActiveView} />
      <Route path={`${match.path}/request`} component={NotActiveView} />
      <Route path={`${match.path}/completed`} component={NotActiveView} />
      <Route path={`${match.path}/edit/new`} component={NotActiveView} />
      <Route path={`${match.path}/edit/:id`} component={NotActiveView} />
    </Switch>
  );
});
