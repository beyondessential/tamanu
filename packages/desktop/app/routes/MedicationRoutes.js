import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { NotActiveView } from '../views';

export const MedicationRoutes = React.memo(({ match }) => {
  return (
    <div>
      <Switch>
        <Route exact path={match.url} component={NotActiveView} />
        <Route path={`${match.url}/requests`} component={NotActiveView} />
        <Route path={`${match.url}/request/by-patient/:patientId/:id`} component={NotActiveView} />
        <Route path={`${match.url}/request/by-patient/:patientId`} component={NotActiveView} />
        <Route path={`${match.url}/request/:id`} component={NotActiveView} />
        <Route path={`${match.url}/request`} component={NotActiveView} />
        <Route path={`${match.url}/completed`} component={NotActiveView} />
        <Route path={`${match.url}/dispense`} component={NotActiveView} />
        <Route path={`${match.url}/return/new`} component={NotActiveView} />
      </Switch>
    </div>
  );
});
