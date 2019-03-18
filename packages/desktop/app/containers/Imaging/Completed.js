import React from 'react';
import { TopBar } from '../../components';
import ImagingRequestsTable from './components/ImagingRequestsTable';
import { IMAGING_REQUEST_STATUSES } from '../../constants';

const CompletedImagingRequests = () => (
  <div className="content">
    <TopBar
      title="Completed Imaging Requests"
      button={{
        to: '/imaging/request',
        text: 'New Request',
        can: { do: 'create', on: 'imaging' },
      }}
    />
    <div className="detail">
      <ImagingRequestsTable status={IMAGING_REQUEST_STATUSES.COMPLETED} />
    </div>
  </div>
);

export default CompletedImagingRequests;
