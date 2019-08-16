import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { NotActiveView } from '../views';

export const LabsRoutes = React.memo(({ match }) => {
  return (
    <Switch>
      <Route exact path={match.url} component={NotActiveView} />
      <Route path={`${match.url}/requests`} component={NotActiveView} />
      <Route path={`${match.url}/request/by-patient/:patientId/:id`} component={NotActiveView} />
      <Route path={`${match.url}/request/by-patient/:patientId`} component={NotActiveView} />
      <Route path={`${match.url}/request/:id`} component={NotActiveView} />
      <Route path={`${match.url}/request`} component={NotActiveView} />
      <Route path={`${match.url}/completed`} component={NotActiveView} />
      <Route path={`${match.url}/edit/new`} component={NotActiveView} />
      <Route path={`${match.url}/edit/:id`} component={NotActiveView} />
    </Switch>
  );
});
