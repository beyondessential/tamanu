import React, { Component } from 'react';
import { TopBar } from '../../components';
import { BrowsableTable } from '../../components/BrowsableTable';
import { LabRequestsCollection } from '../../collections';
import { LAB_REQUEST_STATUSES } from '../../../../shared/constants';

class PublishedLabRequestsTable extends Component {
  
  collection = (new LabRequestsCollection())
    .setKeyword(LAB_REQUEST_STATUSES.PUBLISHED, ['status']);

  static columns = [
    { Header: 'Status', accessor: 'status' },
    { Header: 'Category', accessor: 'category.name' },
    { Header: 'Patient name', accessor: 'patient.displayName' },
    { Header: 'Requested by', accessor: 'requestedBy.displayName' },
    { Header: 'Date', accessor: 'requestedDate' },
    { Header: 'Actions', accessor: '_id' },
  ]

  render() {
    return (
      <BrowsableTable
        collection={this.collection}
        columns={PublishedLabRequestsTable.columns}
        emptyNotification="No requests found"
      />
    );
  }

}

export const PublishedLabRequests = ({}) => (
  <div className="content">
    <TopBar title="Lab Results" />
    <div className="detail">
      <PublishedLabRequestsTable />
    </div>
  </div>
);
