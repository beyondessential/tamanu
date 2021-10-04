import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { ProgramsView } from 'desktop/app/views/programs/ProgramsView';

import { ActiveCovid19PatientsView, NotActiveView } from '../views';

export const ProgramsRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Route path={`${match.path}/all-programs/patients`} component={ProgramsView} />
      <Route
        path={`${match.path}/active-covid-19-program/patients`}
        component={ActiveCovid19PatientsView}
      />
      <NotActiveView />
    </Switch>
  </div>
));
