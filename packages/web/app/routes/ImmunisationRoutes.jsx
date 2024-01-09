import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { ImmunisationsView, CovidCampaignView } from '../views/patients';

export const ImmunisationRoutes = React.memo(({ match }) => (
  <Switch>
    <Route exact path={`${match.path}/all`} component={ImmunisationsView} />
    <Route path={`${match.path}/covid-campaign`} component={CovidCampaignView} />
    <Redirect to={`${match.path}/all`} />
  </Switch>
));
