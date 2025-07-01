import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import { UserProfileView } from '../views/UserProfile/UserProfileView';

export const UserRoutes = () => {
  const { path } = useRouteMatch();

  return (
    <Switch>
      <Route exact path={`${path}/profile`} component={UserProfileView} />
    </Switch>
  );
};