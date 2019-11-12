import React from 'react';
import { Route, Switch } from 'react-router-dom';

import { NotActiveView } from '../views';

import { MedicationListingView } from '../views/MedicationListingView';

export const MedicationRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Route path={`${match.path}/requests`} component={MedicationListingView} />
      <Route path={`${match.path}/request/by-patient/:patientId/:id`} component={NotActiveView} />
      <Route path={`${match.path}/request/by-patient/:patientId`} component={NotActiveView} />
      <Route path={`${match.path}/request/:id`} component={NotActiveView} />
      <Route path={`${match.path}/request`} component={NotActiveView} />
      <Route path={`${match.path}/completed`} component={NotActiveView} />
      <Route path={`${match.path}/dispense`} component={NotActiveView} />
      <Route path={`${match.path}/return/new`} component={NotActiveView} />
      <NotActiveView />
    </Switch>
  </div>
));
