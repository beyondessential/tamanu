import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { IMAGING_REQUEST_STATUS_TYPES } from 'shared-src/src/constants/statuses';

import { ImagingRequestListingView } from '../views/ImagingRequestListingView';

export const ImagingRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Route
        path={`${match.path}/active`}
        render={props => (
          <ImagingRequestListingView {...props} status={IMAGING_REQUEST_STATUS_TYPES.COMPLETED} />
        )}
      />
      <Route
        path={`${match.path}/completed`}
        render={props => (
          <ImagingRequestListingView {...props} status={IMAGING_REQUEST_STATUS_TYPES.COMPLETED} />
        )}
      />
      <Redirect to={`${match.path}/active`} />
    </Switch>
  </div>
));
