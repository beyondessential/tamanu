import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import PatientListing from './PatientListing';
import AdmittedPatients from './AdmittedPatients';
import Outpatient from './Outpatient';
import NewPatient from './NewPatient';
import Reports from './Reports';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={PatientListing} />
        <Route path={`${url}/admitted`} component={AdmittedPatients} />
        <Route path={`${url}/outpatient`} component={Outpatient} />
        <Route path={`${url}/edit/new`} component={NewPatient} />
        <Route path={`${url}/reports`} component={Reports} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
