import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import { LabRequests } from './LabRequests';
import Completed from './Completed';
import Request from './Request';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={LabRequests} />
        <Route path={`${url}/LabRequests`} component={LabRequests} />
        <Route path={`${url}/request/by-patient/:patientId/:id`} component={Request} />
        <Route path={`${url}/request/by-patient/:patientId`} component={Request} />
        <Route path={`${url}/request/:id`} component={Request} />
        <Route path={`${url}/request`} component={Request} />
        <Route path={`${url}/completed`} component={Completed} />
        <Route path={`${url}/edit/new`} component={Request} />
        <Route path={`${url}/edit/:id`} component={Request} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
