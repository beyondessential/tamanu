import React from 'react';
import { ReferralsView } from 'desktop/app/views/referrals/ReferralsView';
import { Redirect, Route, Switch } from 'react-router-dom';

export const ReferralsRoutes = React.memo(({ match }) => (
  <Switch>
    <Redirect exact from={match.path} to={`${match.path}/new`} />
    <Route path={`${match.path}/new`} component={ReferralsView} />
  </Switch>
));
