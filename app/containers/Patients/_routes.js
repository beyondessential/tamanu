import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import List from './List';
import AdmittedPatients from './AdmittedPatients';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={List} />
        <Route path={`${url}/admitted`} component={AdmittedPatients} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
