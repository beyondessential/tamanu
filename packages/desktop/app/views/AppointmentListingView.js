import React from 'react';

import { connect } from 'react-redux';

import { TopBar, PageContainer, DataFetchingTable } from '../components';
import { DateDisplay } from '../components/DateDisplay';
import NewAppointmentButton from '../components/Appointments/NewAppointmentButton';

const COLUMNS = [
  {
    key: 'date',
    title: 'Date',
    accessor: row => <DateDisplay date={row.date} showTime />,
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

const AppointmentTable = connect(null, () => ({ onViewAppointment: () => null }))(
  React.memo(({ onViewAppointment, ...props }) => (
    <DataFetchingTable
      endpoint="appointments"
      columns={COLUMNS}
      noDataMessage="No appointments found"
      initialSort={{ order: 'asc', orderBy: 'startTime' }}
      onRowClick={onViewAppointment}
      {...props}
    />
  )),
);

export const AppointmentListingView = React.memo(() => (
  <PageContainer>
    <TopBar title="Appointments">
      <NewAppointmentButton />
    </TopBar>
    <AppointmentTable />
  </PageContainer>
));
