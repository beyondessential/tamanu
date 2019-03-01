import React from 'react';
import { Switch, Route, Redirect } from 'react-router';
import App from './containers/App';
import { Patients } from './containers/Patients';
import { Scheduling } from './containers/Scheduling';
import { Imaging } from './containers/Imaging';
import { Medication } from './containers/Medication';
import { Labs } from './containers/Labs';
import { Billing } from './containers/Billing';
import Administration from './containers/Administration';
import { Programs } from './containers/Programs';
import { Reports } from './containers/Reports';

export default () => (
  <App>
    <Switch>
      <Redirect exact path="/" to="/patients" />
      <Route path="/patients" component={Patients} />
      <Route path="/appointments" component={Scheduling} />
      <Route path="/imaging" component={Imaging} />
      <Route path="/medication" component={Medication} />
      <Route path="/labs" component={Labs} />
      <Route path="/invoices" component={Billing} />
      <Route path="/admin" component={Administration} />
      <Route path="/programs" component={Programs} />
      <Route path="/reports" component={Reports} />
    </Switch>
  </App>
);
