import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { NotActiveView } from '../views';
import { ImagingRequestListingView } from '../views/ImagingRequestListingView';

export const ImagingRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Redirect exact from={match.path} to={`${match.path}/all`} />
      <Route path={`${match.path}/all`} component={ImagingRequestListingView} />
      {/* Placeholder routes visible in submenu */}
      <Route path={`${match.path}/new`} component={NotActiveView} />
      <Route path={`${match.path}/completed`} component={NotActiveView} />
    </Switch>
  </div>
));
