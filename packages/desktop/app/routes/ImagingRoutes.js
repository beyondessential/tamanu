import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { ImagingRequestListingView } from '../views/ImagingRequestListingView';

export const ImagingRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Route path={`${match.path}/all`} component={ImagingRequestListingView} />
      <Redirect to={`${match.path}/all`} />
    </Switch>
  </div>
));
