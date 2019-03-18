import React, { Component } from 'react';
import { TopBar, Button } from '../../components';
import { BrowsableTable } from '../../components/BrowsableTable';
import { DateDisplay } from '../../components/DateDisplay';
import { LabRequestsCollection } from '../../collections';
import { toTitleCase } from '../../utils';

const requestWithPatientInfo = (row) => {
  const data = row.toJSON();

  const patient = row.getPatient();
  if (!patient) return data;

  return {
    ...data,
    patientName: patient.getDisplayName(),
  };
};

export class LabRequestsTable extends Component {
  collection = new LabRequestsCollection();

  static columns = [
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ original }) => toTitleCase(original.status),
    },
    { Header: 'Category', accessor: 'category.name' },
    { Header: 'Patient name', accessor: 'patientName' },
    { Header: 'Requested by', accessor: 'requestedBy.displayName' },
    {
      Header: 'Date',
      accessor: 'requestedDate',
      Cell: ({ original }) => <DateDisplay date={original.requestedDate} />,
    },
    {
      Header: 'Actions',
      Cell: ({ original: labRequestData }) => (
        <Button
          color="primary"
          variant="contained"
          to={`/labs/request/${labRequestData._id}`}
        >
View
        </Button>
      ),
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
