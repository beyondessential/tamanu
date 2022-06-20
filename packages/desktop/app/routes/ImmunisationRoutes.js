import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';
import { NotActiveView } from '../views';

import { ImmunisationsView, CovidCampaignView } from '../views/patients';

export const ImmunisationRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Redirect exact from={match.path} to={`${match.path}/all`} />
      <Route exact path={`${match.path}/all`} component={ImmunisationsView} />
      <Route path={`${match.path}/covid-campaign`} component={CovidCampaignView} />
      <NotActiveView />
    </Switch>
  </div>
));
