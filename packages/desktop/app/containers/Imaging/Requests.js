import React from 'react';
import { TopBar } from '../../components';
import ImagingRequestsTable from './components/ImagingRequestsTable';
import { IMAGING_REQUEST_STATUSES } from '../../constants';

export const Requests = () => (
  <div className="content">
    <TopBar
      title="Imaging Requests"
      button={{
        to: '/imaging/request',
        text: 'New Request',
        can: { do: 'create', on: 'imaging' },
      }}
    />
    <div className="detail">
      <ImagingRequestsTable status={IMAGING_REQUEST_STATUSES.PENDING} />
    </div>
  </div>
);

export default Requests;
