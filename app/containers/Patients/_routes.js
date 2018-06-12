import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import PatientListing from './PatientListing';
import AdmittedPatients from './AdmittedPatients';
import Outpatient from './Outpatient';
import NewPatient from './NewPatient';
import Reports from './Reports';
import CheckInPatient from './CheckInPatient';
import EditVisit from './EditVisit';
import EditPatient from './EditPatient';
import OperativePlan from './OperativePlan';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={PatientListing} />
        <Route path={`${url}/admitted`} component={AdmittedPatients} />
        <Route path={`${url}/outpatient`} component={Outpatient} />
        <Route path={`${url}/edit/new`} component={NewPatient} />
        <Route path={`${url}/reports`} component={Reports} />
        <Route path={`${url}/checkin/:id`} component={CheckInPatient} />
        <Route path={`${url}/editvisit/:id`} component={EditVisit} />
        <Route path={`${url}/editPatient/:id`} component={EditPatient} />
        <Route path={`${url}/operativePlan/:patientId/:id`} component={OperativePlan} />
        <Route path={`${url}/operativePlan/:patientId`} component={OperativePlan} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
