import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { NotActiveView } from '../views';

import { ImmunisationsView, CovidCampaignView } from '../views/patients';

export const ImmunisationRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Route exact path={match.path} component={ImmunisationsView} />

      <Route path={`${match.path}/covid`} component={CovidCampaignView} />

      <NotActiveView />
    </Switch>
  </div>
));
