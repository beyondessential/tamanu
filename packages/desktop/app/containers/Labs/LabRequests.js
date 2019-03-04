import React, { Component } from 'react';
import { TopBar, Button } from '../../components';
import { BrowsableTable } from '../../components/BrowsableTable';
import { LabRequestsCollection } from '../../collections';

export class LabRequestsTable extends Component {
  
  collection = new LabRequestsCollection();

  static columns = [
    { Header: 'Status', accessor: 'status' },
    { Header: 'Category', accessor: 'category.name' },
    { Header: 'Patient name', accessor: 'patient.displayName' },
    { Header: 'Requested by', accessor: 'requestedBy.displayName' },
    { Header: 'Date', accessor: 'requestedDate' },
    { 
      Header: 'Actions', 
      Cell: ({ original: labRequestData }) => (
        <Button 
          color="primary" 
          variant="contained"
          to={`/labs/request/${labRequestData._id}`}
        >View</Button>
      )
    },
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
