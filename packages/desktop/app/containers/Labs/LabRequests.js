import React, { Component } from 'react';
import { TopBar } from '../../components';
import { BrowsableTable } from '../../components/BrowsableTable';
import { LabRequestsCollection } from '../../collections';

class LabRequestsTable extends Component {
  
  collection = new LabRequestsCollection();

  static columns = [
    { Header: 'Status', accessor: 'status' },
    { Header: 'Patient name', accessor: 'patient.displayName' },
    { Header: 'Requested by', accessor: 'requestedBy.displayName' },
    { Header: 'Date', accessor: 'requestedDate' },
    { Header: 'Actions', accessor: '_id' },
  ]

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

export const LabRequests = ({}) => (
  <div className="content">
    <TopBar title="Lab Requests" />
    <div className="detail">
      <LabRequestsTable />
    </div>
  </div>
);
