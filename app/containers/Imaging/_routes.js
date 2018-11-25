import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import NotActive from '../NotActive';
import Requests from './Requests';
import Completed from './Completed';
import NewRequest from './NewRequest';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={NotActive} />
        <Route path={`${url}/completed`} component={NotActive} />
        <Route path={`${url}/edit/new`} component={NotActive} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
