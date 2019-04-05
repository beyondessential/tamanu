import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import PatientListing from './PatientListing';
import AdmittedPatients from './AdmittedPatients';
import Outpatient from './Outpatient';
import NewPatient from './NewPatient';
import Visit from './Visit';
import Procedure from './Visit/Procedures/Procedure';
import EditPatient from './EditPatient';
import OperativePlan from './OperativePlan';
import OperationReport from './OperationReport';
import NotActive from '../NotActive';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={PatientListing} />
        <Route path={`${url}/admitted`} component={AdmittedPatients} />
        <Route path={`${url}/outpatient`} component={Outpatient} />
        <Route path={`${url}/edit/new`} component={NewPatient} />
        <Route path={`${url}/reports`} component={NotActive} />
        <Route path={`${url}/editPatient/:id`} component={EditPatient} />

        <Route path={`${url}/patient::patientId/visit/operationReport::id`} component={OperationReport} />
        <Route path={`${url}/patient::patientId/visit::visitId/operativePlan`} component={OperativePlan} />
        <Route path={`${url}/patient::patientId/visit/operativePlan`} component={OperativePlan} />
        <Route path={`${url}/patient::patientId/visit/operativePlan::id`} component={OperativePlan} />

        <Route path={`${url}/visit/:patientId/:visitId/procedure/:id`} component={Procedure} />
        <Route path={`${url}/visit/:patientId/:visitId/procedure`} component={Procedure} />
        <Route path={`${url}/visit/:patientId/:id`} component={Visit} />
        <Route path={`${url}/visit/:patientId`} component={Visit} />
        <Route path={`${url}/check-in/:patientId`} component={Visit} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
