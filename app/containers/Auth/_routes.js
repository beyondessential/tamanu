import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import Login from './Login';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={Login} />
        <Route exact path={`${url}/login`} component={Login} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
