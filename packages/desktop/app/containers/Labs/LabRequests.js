import React, { Component } from 'react';
import { Grid } from '@material-ui/core';
import { TopBar, Button } from '../../components';
import { BrowsableTable } from '../../components/BrowsableTable';
import { DateDisplay } from '../../components/DateDisplay';
import { LabRequestsCollection } from '../../collections';
import { toTitleCase } from '../../utils';
import { headerStyle, columnStyle } from '../../constants';

const cellStyles = { headerStyle, style: columnStyle };
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
  static columns = [
    {
      Header: 'Status',
      accessor: 'status',
      Cell: ({ original }) => toTitleCase(original.status),
      ...cellStyles,
    },
    {
      Header: 'Category',
      accessor: 'category.name',
      ...cellStyles,
    },
    {
      Header: 'Patient name',
      accessor: 'patientName',
      ...cellStyles,
    },
    {
      Header: 'Requested by',
      accessor: 'requestedBy.displayName',
      ...cellStyles,
    },
    {
      Header: 'Date',
      accessor: 'requestedDate',
      Cell: ({ original }) => <DateDisplay date={original.requestedDate} />,
      ...cellStyles,
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
      ...cellStyles,
    },
  ]

  collection = new LabRequestsCollection();

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

export const LabRequests = () => (
  <React.Fragment>
    <TopBar
      title="Lab Requests"
      buttons={{
        to: '/labs/request',
        text: 'New Request',
        can: { do: 'create', on: 'lab' },
      }}
    />
    <Grid container item>
      <LabRequestsTable />
    </Grid>
  </React.Fragment>
);
