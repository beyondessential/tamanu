import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { NotActiveView } from '../views';
import { ImagingRequestListingView } from '../views/ImagingRequestListingView';

export const ImagingRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Route path={`${match.path}/all`} component={ImagingRequestListingView} />
      <Route path={`${match.path}/new`} component={NotActiveView} />
      <Route path={`${match.path}/completed`} component={NotActiveView} />
      <Redirect to={`${match.path}/all`} />
    </Switch>
  </div>
));
