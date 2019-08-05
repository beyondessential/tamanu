import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import { NotActive } from '../NotActive';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={NotActive} />
        <Route path={`${url}/requests`} component={NotActive} />
        <Route path={`${url}/request/by-patient/:patientId/:id`} component={NotActive} />
        <Route path={`${url}/request/by-patient/:patientId`} component={NotActive} />
        <Route path={`${url}/request/:id`} component={NotActive} />
        <Route path={`${url}/request`} component={NotActive} />
        <Route path={`${url}/completed`} component={NotActive} />
        <Route path={`${url}/dispense`} component={NotActive} />
        <Route path={`${url}/return/new`} component={NotActive} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
