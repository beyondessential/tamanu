import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { IMAGING_REQUEST_STATUS_TYPES } from '@tamanu/shared/constants/statuses';

import { ImagingRequestListingView } from '../views/ImagingRequestListingView';

export const ImagingRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Route
        path={`${match.path}/all`}
        render={props => <ImagingRequestListingView {...props} />}
      />
      <Route
        path={`${match.path}/completed`}
        render={props => (
          <ImagingRequestListingView {...props} status={IMAGING_REQUEST_STATUS_TYPES.COMPLETED} />
        )}
      />
      <Redirect to={`${match.path}/all`} />
    </Switch>
  </div>
));
