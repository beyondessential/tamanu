import React from 'react';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';

import { AppointmentStatusSelector } from '../../app/components';

export default {
  title: 'Appointments/Appointment Status Selector',
  component: AppointmentStatusSelector,
};

export const StatusSelector = () => {
  const [status, setStatus] = React.useState(APPOINTMENT_STATUSES.CONFIRMED);
  return (
    <div style={{ width: '16rem' }}>
      <AppointmentStatusSelector selectedStatus={status} updateAppointmentStatus={setStatus} />
    </div>
  );
};

export const Disabled = () => {
  const [status, setStatus] = React.useState(APPOINTMENT_STATUSES.CONFIRMED);
  return (
    <div style={{ width: '16rem' }}>
      <AppointmentStatusSelector
        disabled
        selectedStatus={status}
        updateAppointmentStatus={setStatus}
      />
    </div>
  );
};
