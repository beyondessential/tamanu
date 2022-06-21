import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import {
  PatientListingView,
  TriageListingView,
  AdmittedPatientsView,
  OutpatientsView,
} from '../views';
import { PatientRoutes } from './PatientRoutes';

export const PatientsRoutes = React.memo(({ match }) => (
  <Switch>
    <Route
      path={`${match.path}/:category(all|emergency|inpatient|outpatient)/:patientId/:modal?`}
      component={PatientRoutes}
    />
    <Route path={`${match.path}/all`} component={PatientListingView} />
    <Route path={`${match.path}/emergency`} component={TriageListingView} />
    <Route path={`${match.path}/inpatient`} component={AdmittedPatientsView} />
    <Route path={`${match.path}/outpatient`} component={OutpatientsView} />
    <Redirect exact path="*" to={`${match.path}/all`} />
  </Switch>
));
