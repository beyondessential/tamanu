import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { MedicationListingView } from '../views/MedicationListingView';

export const MedicationRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Route path={`${match.path}/all`} component={MedicationListingView} />
      <Redirect to={`${match.path}/all`} />
    </Switch>
  </div>
));
