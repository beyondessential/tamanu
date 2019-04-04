import React from 'react';
import { Grid } from '@material-ui/core';
import { TopBar } from '../../components';
import ImagingRequestsTable from './components/ImagingRequestsTable';
import { IMAGING_REQUEST_STATUSES } from '../../constants';

export default () => (
  <React.Fragment>
    <TopBar
      title="Completed Imaging Requests"
      button={{
        to: '/imaging/request',
        text: 'New Request',
        can: { do: 'create', on: 'imaging' },
      }}
    />
    <Grid container item>
      <ImagingRequestsTable status={IMAGING_REQUEST_STATUSES.COMPLETED} />
    </Grid>
  </React.Fragment>
);
