import React, { Component } from 'react';
import { TopBar, Button } from '../../components';
import { BrowsableTable } from '../../components/BrowsableTable';
import { LabRequestsCollection } from '../../collections';

const requestWithPatientInfo = (row) => {
  const data = row.toJSON();
  const { visits: [visit] } = data;

  if(!visit) return data;

  // 'visit.patient' is actually an array containing one patient
  const { patient: patients = [] } = visit;
  const patient = patients[0];
  const patientName = `${patient.firstName} ${patient.lastName}`;

  return {
    ...data,
    patientName,
  };
};

export class LabRequestsTable extends Component {
  
  collection = new LabRequestsCollection();

  static columns = [
    { Header: 'Status', accessor: 'status' },
    { Header: 'Category', accessor: 'category.name' },
    { Header: 'Patient name', accessor: 'patientName' },
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
        transformRow={requestWithPatientInfo}
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
