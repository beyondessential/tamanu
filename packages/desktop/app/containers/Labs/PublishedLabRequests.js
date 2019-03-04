import React, { Component } from 'react';

import { TopBar } from '../../components';
import { BrowsableTable } from '../../components/BrowsableTable';
import { LabRequestsCollection } from '../../collections';
import { LAB_REQUEST_STATUSES } from '../../../../shared/constants';

import { LabRequestsTable } from './LabRequests';

class PublishedLabRequestsTable extends Component {
  
  collection = (new LabRequestsCollection())
    .setKeyword(LAB_REQUEST_STATUSES.PUBLISHED, ['status']);

  render() {
    return (
      <BrowsableTable
        collection={this.collection}
        columns={LabRequestsTable.columns}
        emptyNotification="No requests found"
      />
    );
  }

}

export const PublishedLabRequests = ({}) => (
  <div className="content">
    <TopBar title="Published Lab Requests" />
    <div className="detail">
      <PublishedLabRequestsTable />
    </div>
  </div>
);
