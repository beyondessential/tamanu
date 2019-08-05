import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import { ReportGenerator } from './ReportGenerator';

export const Reports = ({ match }) => (
  <div className="content">
    <Switch>
      <Route path={`${match.url}/:reportId`} component={ReportGenerator} />
    </Switch>
  </div>
);