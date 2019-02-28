import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import NotActive from '../NotActive';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={NotActive} />
        <Route path={`${url}/settings`} component={NotActive} />
        <Route exact path={`${url}/users`} component={NotActive} />
        <Route path={`${url}/users/edit/new`} component={NotActive} />
        <Route path={`${url}/permissions`} component={NotActive} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
