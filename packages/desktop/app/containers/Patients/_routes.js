import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import { PatientListing } from './PatientListing';
import { AdmittedPatients } from './AdmittedPatients';
import { PatientView } from '../../views/PatientView';
import { NotActive } from '../NotActive';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={PatientListing} />

        <Route path={`${url}/admitted`} component={AdmittedPatients} />
        <Route path={`${url}/new`} component={AdmittedPatients} />

        <Route path={`${url}/view`} component={PatientView} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
