/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import HomePage from './containers/HomePage';
import Inventory from './containers/Inventory';

export default () => (
  <App>
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/patients" component={HomePage} />
      <Route path="/scheduling" component={HomePage} />
      <Route path="/imaging" component={HomePage} />
      <Route path="/medication" component={HomePage} />
      <Route path="/labs" component={HomePage} />
      <Route path="/billing" component={HomePage} />
      <Route path="/incident" component={HomePage} />
      <Route path="/administration" component={HomePage} />
    </Switch>
  </App>
);
