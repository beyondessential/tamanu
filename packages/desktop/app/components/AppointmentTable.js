import React from 'react';
import { connect } from 'react-redux';

import { Table } from './Table';
import { DateDisplay } from './DateDisplay';

const StatusDisplay = React.memo(({ status }) => {
  switch (status) {
    case 'scheduled':
      return 'Scheduled';
    case 'attended':
      return 'Attended';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'Unknown';
  }
});

const getDate = ({ date }) => <DateDisplay date={date} />;
const getDepartment = ({ location }) => (location ? location.name : 'Unknown');
const getFacility = ({ facility }) => (facility ? facility.name : 'Unknown');
const getDisplayName = ({ referringDoctor }) => (referringDoctor || {}).displayName || 'Unknown';
const getStatus = ({ status }) => <StatusDisplay status={status} />;

const columns = [
  { key: 'date', title: 'Appointment date', accessor: getDate },
  { key: 'department', title: 'Department', accessor: getDepartment },
  { key: 'facility', title: 'Facility', accessor: getFacility },
  { key: 'practitioner', title: 'Referring doctor', accessor: getDisplayName },
  { key: 'status', title: 'Status', accessor: getStatus },
];

const DumbAppointmentTable = React.memo(({ appointments, onAppointmentSelect }) => (
  <Table columns={columns} data={appointments} onRowClick={row => onAppointmentSelect(row)} />
));

export const AppointmentTable = connect(
  null,
  dispatch => ({ onAppointmentSelect: appointment => dispatch(viewAppointment(appointment._id)) }),
)(DumbAppointmentTable);
