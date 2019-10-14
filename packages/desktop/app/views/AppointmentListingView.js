import React from 'react';
import styled from 'styled-components';
import moment from 'moment';
import Paper from '@material-ui/core/Paper';

import { connect } from 'react-redux';

import { TopBar, PageContainer, DataFetchingTable } from '../components';
import { TriageStatisticsCard } from '../components/TriageStatisticsCard';

import { DateDisplay } from '../components/DateDisplay';

const COLUMNS = [
  {
    key: 'date',
    title: 'Date',
    accessor: row => <DateDisplay date={row.date} />,
  },
  {
    key: 'patientName',
    title: 'Patient',
    accessor: row => `${row.patients[0].firstName} ${row.patients[0].lastName}`,
  },
  {
    key: 'practitioner',
    title: 'Clinician',
    accessor: row => `${row.practitioner && row.practitioner.displayName}`,
  },
  { key: 'location', title: 'Location', accessor: row => row.location.name },
];

const AppointmentTable = connect(
  null,
  dispatch => ({ onViewVisit: (triage) => dispatch(viewPatientVisit(triage.patient[0]._id, triage.visit._id)) })
)(React.memo(({ onViewVisit, ...props }) => (
  <DataFetchingTable
    endpoint="appointment"
    columns={COLUMNS}
    noDataMessage="No patients found"
    initialSort={{ order: 'asc', orderBy: 'date' }}
    {...props}
  />
)));

export const AppointmentListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Appointments" />
    <AppointmentTable />
  </PageContainer>
));
