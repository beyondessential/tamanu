import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import { PatientListing } from './PatientListing';
import { connect } from 'react-redux';

import { AdmittedPatients } from './AdmittedPatients';
import { PatientView } from '../../views/PatientView';
import { NotActive } from '../NotActive';

const ConnectedPatientView = connect(
  state => ({ ...state.patient }),
)(({ loading, ...patient }) => (
  loading 
    ? <div>{ `Loading patient ${patient.id}` }</div>
    : <PatientView patient={patient} />
));

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={PatientListing} />

        <Route path={`${url}/admitted`} component={AdmittedPatients} />
        <Route path={`${url}/new`} component={AdmittedPatients} />
        <Route path={`${url}/view`} component={ConnectedPatientView} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
