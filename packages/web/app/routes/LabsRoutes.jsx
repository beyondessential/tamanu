import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import {
  LabRequestListingView,
  PublishedLabRequestListingView,
} from '../views/LabRequestListingView';

export const LabsRoutes = React.memo(({ match }) => (
  <Switch>
    <Route path={`${match.path}/active`} component={LabRequestListingView} />
    <Route path={`${match.path}/published`} component={PublishedLabRequestListingView} />
    <Redirect to={`${match.path}/active`} />
  </Switch>
));
