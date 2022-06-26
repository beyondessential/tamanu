import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import {
  PatientListingView,
  TriageListingView,
  AdmittedPatientsView,
  OutpatientsView,
} from '../views';
import { PatientRoutes } from './PatientRoutes';
import { ProgramsView } from '../views/programs/ProgramsView';
import { ReferralsView } from '../views/referrals/ReferralsView';

export const PatientsRoutes = React.memo(({ match }) => (
  <Switch>
    <Route
      path={`${match.path}/:category(all|emergency|inpatient|outpatient)/:patientId/referrals/new`}
      component={ReferralsView}
    />
    <Route
      path={`${match.path}/:category(all|emergency|inpatient|outpatient)/:patientId/programs/new`}
      component={ProgramsView}
    />
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
    <Redirect exact from="*" to={`${match.path}/all`} />
  </Switch>
));
