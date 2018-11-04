import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import NotActive from '../NotActive';

export const Reports = ({ url }) => (
  <Switch>
    <Route exact path={url} component={NotActive} />
  </Switch>
);

Reports.propTypes = {
  url: PropTypes.string.isRequired,
};
