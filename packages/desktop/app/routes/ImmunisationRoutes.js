import React from 'react';
import { Route, Switch, Redirect } from 'react-router-dom';

import { ImmunisationsView, CovidCampaignView } from '../views/patients';

export const ImmunisationRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Route exact path={`${match.path}/all`} component={ImmunisationsView} />
      <Route path={`${match.path}/covid-campaign`} component={CovidCampaignView} />
      <Redirect from="*" to={`${match.path}/all`} />
    </Switch>
  </div>
));
