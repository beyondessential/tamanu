import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { PATIENT_PATHS } from '../constants/patientPaths';
import {
  AdmittedPatientsView,
  OutpatientsView,
  PatientListingView,
  TriageListingView,
} from '../views';
import { PatientRoutes } from './PatientRoutes';

export const PatientsRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={PATIENT_PATHS.PATIENT} component={PatientRoutes} />
    <Route
      path={PATIENT_PATHS.CATEGORY}
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
