import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { NotActiveView } from '../views';

export const ImagingRoutes = React.memo(({ match }) => {
  return (
    <div>
      <Switch>
        <Route exact path={match.path} component={NotActiveView} />
        <Route path={`${match.path}/requests`} component={NotActiveView} />
        <Route path={`${match.path}/request/by-patient/:patientId/:id`} component={NotActiveView} />
        <Route path={`${match.path}/request/by-patient/:patientId`} component={NotActiveView} />
        <Route path={`${match.path}/request/:id`} component={NotActiveView} />
        <Route path={`${match.path}/request`} component={NotActiveView} />
        <Route path={`${match.path}/completed`} component={NotActiveView} />
      </Switch>
    </div>
  );
});
