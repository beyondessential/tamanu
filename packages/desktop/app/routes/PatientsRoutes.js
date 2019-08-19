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
        <Route exact path={match.path} component={PatientListingView} />

        <Route path={`${match.path}/admitted`} component={AdmittedPatientsView} />
        <Route path={`${match.path}/new`} component={NotActiveView} />

        <Route path={`${match.path}/view`} component={PatientView} />
        <Route path={`${match.path}/visit`} component={VisitView} />
        <NotActiveView />
      </Switch>
    </div>
  );
});
