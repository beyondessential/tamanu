import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import { PatientListing } from './PatientListing';
import { AdmittedPatients } from './AdmittedPatients';
import { NotActive } from '../NotActive';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={PatientListing} />
        <Route path={`${url}/admitted`} component={AdmittedPatients} />
        <Route path={`${url}/outpatient`} component={NotActive} />
        <Route path={`${url}/edit/new`} component={NotActive} />
        <Route path={`${url}/reports`} component={NotActive} />
        <Route path={`${url}/editPatient/:id`} component={NotActive} />

        <Route path={`${url}/patient::patientId/visit/operationReport::id`} component={NotActive} />
        <Route
          path={`${url}/patient::patientId/visit::visitId/operativePlan`}
          component={NotActive}
        />
        <Route
          path={`${url}/patient::patientId/visit::visitId/operativePlan::id`}
          component={NotActive}
        />
        <Route path={`${url}/patient::patientId/visit/operativePlan`} component={NotActive} />
        <Route path={`${url}/patient::patientId/visit/operativePlan::id`} component={NotActive} />

        <Route path={`${url}/visit/:patientId/:visitId/procedure/:id`} component={NotActive} />
        <Route path={`${url}/visit/:patientId/:visitId/procedure`} component={NotActive} />
        <Route path={`${url}/visit/:patientId/:id`} component={NotActive} />
        <Route path={`${url}/visit/:patientId`} component={NotActive} />
        <Route path={`${url}/check-in/:patientId`} component={NotActive} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
