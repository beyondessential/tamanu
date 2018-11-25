import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import NotActive from '../NotActive';
import LabRequests from './LabRequests';
import Completed from './Completed';
import NewRequest from './NewRequest';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={NotActive} />
        <Route path={`${url}/completed`} component={NotActive} />
        <Route path={`${url}/edit/new`} component={NotActive} />
        {/* <Route exact path={url} component={LabRequests} />
        <Route path={`${url}/completed`} component={Completed} />
        <Route path={`${url}/edit/new`} component={NewRequest} /> */}
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
