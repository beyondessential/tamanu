import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import NotActive from '../NotActive';

export default function Routes({ url }) {
  return (
    <div>
      <Switch>
        <Route exact path={url} component={NotActive} />
        <Route exact path={`${url}/draft`} component={NotActive} />
        <Route exact path={`${url}/all`} component={NotActive} />
        <Route exact path={`${url}/paid`} component={NotActive} />
        <Route exact path={`${url}/edit/new`} component={NotActive} />
        <Route exact path={`${url}/pricing`} component={NotActive} />
        <Route exact path={`${url}/pricing/imaging`} component={NotActive} />
        <Route exact path={`${url}/pricing/lab`} component={NotActive} />
        <Route exact path={`${url}/pricing/procedure`} component={NotActive} />
        <Route exact path={`${url}/pricing/ward`} component={NotActive} />
        <Route exact path={`${url}/pricing/profiles`} component={NotActive} />
      </Switch>
    </div>
  );
}

Routes.propTypes = {
  url: PropTypes.string.isRequired,
};
