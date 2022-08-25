import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { NotActiveView } from '../views';
import { MedicationListingView } from '../views/MedicationListingView';

export const MedicationRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Route path={`${match.path}/all`} component={MedicationListingView} />
      <Route path={`${match.path}/new`} component={NotActiveView} />
      <Route path={`${match.path}/completed`} component={NotActiveView} />
      <Route path={`${match.path}/dispense`} component={NotActiveView} />
      <Redirect to={`${match.path}/all`} />
    </Switch>
  </div>
));
