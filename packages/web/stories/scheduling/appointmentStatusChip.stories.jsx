import React from 'react';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';

import { AppointmentStatusChip } from '../../app/components/Scheduling/AppointmentStatusChip';

export default {
  title: 'Scheduling/Appointment Status Token',
  component: AppointmentStatusChip,
  argTypes: {
    appointmentStatus: {
      control: 'select',
      options: Object.values(APPOINTMENT_STATUSES),
    },
    deselected: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export const Confirmed = () => (
  <AppointmentStatusChip appointmentStatus={APPOINTMENT_STATUSES.CONFIRMED} />
);

export const Arrived = () => (
  <AppointmentStatusChip appointmentStatus={APPOINTMENT_STATUSES.ARRIVED} />
);

export const Assessed = () => (
  <AppointmentStatusChip appointmentStatus={APPOINTMENT_STATUSES.ASSESSED} />
);

export const Seen = () => <AppointmentStatusChip appointmentStatus={APPOINTMENT_STATUSES.SEEN} />;

export const NoShow = () => (
  <AppointmentStatusChip appointmentStatus={APPOINTMENT_STATUSES.NO_SHOW} />
);

export const Deselected = () => (
  <AppointmentStatusChip appointmentStatus={APPOINTMENT_STATUSES.CONFIRMED} deselected />
);

export const Disabled = () => (
  <AppointmentStatusChip appointmentStatus={APPOINTMENT_STATUSES.CONFIRMED} disabled />
);
