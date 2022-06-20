import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { ActiveCovid19PatientsView, NotActiveView } from '../views';

export const ProgramsRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      {/** TODO: move to patient router */}
      {/* <Route exact path={match.path} component={ProgramsView} /> */}
      <Redirect exact from={match.path} to={`${match.path}/active-covid-19-patients`} />
      <Route
        path={`${match.path}/active-covid-19-patients`}
        component={ActiveCovid19PatientsView}
      />
      <NotActiveView />
    </Switch>
  </div>
));
