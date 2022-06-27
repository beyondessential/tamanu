import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { ProgramsAdminView, ReferenceDataAdminView } from '../views';

export const AdministrationRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Route path={`${match.path}/programs`} component={ProgramsAdminView} />
      <Route path={`${match.path}/refdata`} component={ReferenceDataAdminView} />
      <Redirect to={`${match.path}/programs`} />
    </Switch>
  </div>
));
