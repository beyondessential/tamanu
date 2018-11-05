import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';

import { ReportSelector } from './ReportSelector';
import { ReportGenerator } from './ReportGenerator';

export const Reports = ({ match }) => (
  <div className="content">
    <Switch>
      <Route path={ match.url + '/:reportId' } component={ReportGenerator} />
      <Route exact path={ match.url } component={ReportSelector} />
    </Switch>
  </div>
);

