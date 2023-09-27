import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { ProgramRegistryView } from '../views/programRegistry/ProgramRegistryView';

export const ProgramRegistryRoutes = React.memo(({ match }) => {
  return (
    <div>
      <Switch>
        <Route path={`${match.path}/:programRegistryCode`} component={ProgramRegistryView} />
        <Redirect to={`${match.path}`} />
      </Switch>
    </div>
  );
});
