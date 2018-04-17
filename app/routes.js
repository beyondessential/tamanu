/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import HomePage from './containers/HomePage';
import Inventory from './containers/Inventory';
import Patients from './containers/Patients';
import Scheduling from './containers/Scheduling';
import Imaging from './containers/Imaging';
import Medication from './containers/Medication';
import Labs from './containers/Labs';
import Billing from './containers/Billing';
import Incident from './containers/Incident';
import Administration from './containers/Administration';

export default () => (
  <App>
    <Switch>
      <Route exact path="/" component={HomePage} />
      <Route exact path="/inventory" component={Inventory} />
      <Route exact path="/patients" component={Patients} />
      <Route exact path="/scheduling" component={Scheduling} />
      <Route exact path="/imaging" component={Imaging} />
      <Route exact path="/medication" component={Medication} />
      <Route exact path="/labs" component={Labs} />
      <Route exact path="/billing" component={Billing} />
      <Route exact path="/incident" component={Incident} />
      <Route exact path="/administration" component={Administration} />
    </Switch>
  </App>
);
