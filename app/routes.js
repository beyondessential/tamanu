/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import HomePage from './containers/HomePage';
import Inventory from './containers/Inventory';

export default () => (
  <App>
    <Switch>
      <Route exact path="/" component={HomePage} />
      <Route exact path="/inventory" component={Inventory} />
      <Route exact path="/patients" component={HomePage} />
      <Route exact path="/scheduling" component={HomePage} />
      <Route exact path="/imaging" component={HomePage} />
      <Route exact path="/medication" component={HomePage} />
      <Route exact path="/labs" component={HomePage} />
      <Route exact path="/billing" component={HomePage} />
      <Route exact path="/incident" component={HomePage} />
      <Route exact path="/administration" component={HomePage} />
    </Switch>
  </App>
);
