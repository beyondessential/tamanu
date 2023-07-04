import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { ActiveCovid19PatientsView } from '../views';

export const ProgramsRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Route
        path={`${match.path}/active-covid-19-patients`}
        component={ActiveCovid19PatientsView}
      />
      <Redirect to={`${match.path}/active-covid-19-patients`} />
    </Switch>
  </div>
));
