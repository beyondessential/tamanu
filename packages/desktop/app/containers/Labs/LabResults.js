import React, { Component } from 'react';
import { TopBar } from '../../components';
import { BrowsableTable } from '../../components/BrowsableTable';
import { LabTestsCollection } from '../../collections';

class LabResultsTable extends Component {
  
  collection = new LabTestsCollection();

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
        columns={LabResultsTable.columns}
        emptyNotification="No requests found"
      />
    );
  }

}

export const LabResults = ({}) => (
  <div className="content">
    <TopBar title="Lab Results" />
    <div className="detail">
      <LabResultsTable />
    </div>
  </div>
);
