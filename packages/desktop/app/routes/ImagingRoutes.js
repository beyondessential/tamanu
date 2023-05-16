import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import { IMAGING_REQUEST_STATUS_TYPES } from 'shared-src/src/constants/statuses';

import { ImagingRequestListingView } from '../views/ImagingRequestListingView';
import { IMAGING_REQUEST_SEARCH_KEYS } from '../contexts/ImagingRequests';

export const ImagingRoutes = React.memo(({ match }) => (
  <div>
    <Switch>
      <Route
        path={`${match.path}/active`}
        render={props => (
          <ImagingRequestListingView
            {...props}
            memoryKey={IMAGING_REQUEST_SEARCH_KEYS.ACTIVE}
            statuses={[
              IMAGING_REQUEST_STATUS_TYPES.PENDING,
              IMAGING_REQUEST_STATUS_TYPES.IN_PROGRESS,
            ]}
          />
        )}
      />
      <Route
        path={`${match.path}/completed`}
        render={props => (
          <ImagingRequestListingView
            {...props}
            memoryKey={IMAGING_REQUEST_SEARCH_KEYS.COMPLETED}
            statuses={[IMAGING_REQUEST_STATUS_TYPES.COMPLETED]}
          />
        )}
      />
      <Redirect to={`${match.path}/active`} />
    </Switch>
  </div>
));
