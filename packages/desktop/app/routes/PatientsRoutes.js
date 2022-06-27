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
    <Route
      path={`${match.path}/:category(all|emergency|inpatient|outpatient)`}
      render={props =>
        ({
          all: <PatientListingView />,
          emergency: <TriageListingView />,
          inpatient: <AdmittedPatientsView />,
          outpatient: <OutpatientsView />,
        }[props.match.params.category])
      }
    />
    <Redirect to={`${match.path}/all`} />
  </Switch>
));
