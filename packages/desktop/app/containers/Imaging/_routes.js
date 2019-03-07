import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import Request from './Request';
import Requests from './Requests';
import Completed from './Completed';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={Requests} />
        <Route path={`${url}/requests`} component={Requests} />
        <Route path={`${url}/request/by-patient/:patientId/:id`} component={Request} />
        <Route path={`${url}/request/by-patient/:patientId`} component={Request} />
        <Route path={`${url}/request/:id`} component={Request} />
        <Route path={`${url}/request`} component={Request} />
        <Route path={`${url}/completed`} component={Completed} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
