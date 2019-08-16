import React from 'react';
import { Route, Switch } from 'react-router-dom';

import {
  PatientListingView,
  AdmittedPatientsView,
  PatientView,
  VisitView,
  NotActiveView,
} from '../views';

export const PatientsRoutes = React.memo(({ match }) => {
  return (
    <div>
      <Switch>
        <Route exact path={match.url} component={PatientListingView} />

        <Route path={`${match.url}/admitted`} component={AdmittedPatientsView} />
        <Route path={`${match.url}/new`} component={NotActiveView} />

        <Route path={`${match.url}/view`} component={PatientView} />
        <Route path={`${match.url}/visit`} component={VisitView} />
        <NotActiveView />
      </Switch>
    </div>
  );
});
