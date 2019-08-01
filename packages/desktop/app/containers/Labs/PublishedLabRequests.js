import React from 'react';
import { TopBar } from '../../components';
import { BrowsableTable } from '../../components/BrowsableTable';
import { LabRequestsCollection } from '../../collections';
import { LAB_REQUEST_STATUSES } from '../../../../shared/constants';
import { LabRequestsTable } from './LabRequests';

const PublishedLabRequestsTable = () => {
  const collection = new LabRequestsCollection().setKeyword(LAB_REQUEST_STATUSES.PUBLISHED, [
    'status',
  ]);
  return (
    <BrowsableTable
      collection={collection}
      columns={LabRequestsTable.columns}
      emptyNotification="No requests found"
    />
  );
};

export const PublishedLabRequests = () => (
  <React.Fragment>
    <TopBar title="Published Lab Requests" />
    <PublishedLabRequestsTable />
  </React.Fragment>
);
