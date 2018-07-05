/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import HomePage from './containers/Home';
import { Patients } from './containers/Patients';
import Scheduling from './containers/Scheduling';
// import { Imaging } from './containers/Imaging';
import Medication from './containers/Medication';
import { Labs } from './containers/Labs';
import { Billing } from './containers/Billing';
// import { Incident } from './containers/Incident';
import Administration from './containers/Administration';
import { Programs } from './containers/Programs';
import { Pregnancy } from './containers/Pregnancy';

export default () => (
  <App>
    <Switch>
      <Route exact path="/" component={HomePage} />
      <Route path="/patients" component={Patients} />
      <Route path="/appointments" component={Scheduling} />
      {/* <Route path="/imaging" component={Imaging} /> */}
      <Route path="/medication" component={Medication} />
      <Route path="/labs" component={Labs} />
      <Route path="/invoices" component={Billing} />
      {/* <Route path="/incident" component={Incident} /> */}
      <Route path="/admin" component={Administration} />
      <Route path="/programs" component={Programs} />
      <Route path="/pregnancy" component={Pregnancy} />
    </Switch>
  </App>
);
