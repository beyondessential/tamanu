import React from 'react';
import { BrowserRouter as Router, Switch, Redirect } from 'react-router-dom';
import { LoginView, RegistrationView, DashboardView, RequestLoginTokenView } from './views';
import { PublicRoute } from '@routes/PublicRoute';
import { PrivateRoute } from '@routes/PrivateRoute';

export const App = () => {
  return (
    <Router>
      <Switch>
        <PrivateRoute path="/" exact component={DashboardView} />
        <PublicRoute path="/login" component={RequestLoginTokenView} />
        <PublicRoute path="/login-submit" component={LoginView} />
        <PublicRoute path="/register/:token" component={RegistrationView} />
        <Redirect path="*" to="/" exact />
      </Switch>
    </Router>
  );
};
