import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { LabRequestListingView } from '../views/LabRequestListingView';
import { PublishedLabRequestsListingView } from '../views/PublishedLabRequestsListingView';

export const LabsRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/all`} component={LabRequestListingView} />
    <Route path={`${match.path}/published`} component={PublishedLabRequestsListingView} />
    <Redirect to={`${match.path}/all`} />
  </Switch>
));
