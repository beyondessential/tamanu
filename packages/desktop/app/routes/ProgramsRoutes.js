import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { ActiveCovid19PatientsView, NotActiveView } from '../views';
import { ProgramsView } from '../views/programs/ProgramsView';

export const ProgramsRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Redirect exact from={match.path} to={`${match.path}/active-covid-19-patients`} />
      <Route exact path={`${match.path}/new`} component={ProgramsView} />
      <Route
        path={`${match.path}/active-covid-19-patients`}
        component={ActiveCovid19PatientsView}
      />
      <NotActiveView />
    </Switch>
  </div>
));
