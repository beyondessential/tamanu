import React from 'react';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';

import { AppointmentStatusToken } from '../../app/components/Scheduling/StatusToken';

export default {
  title: 'Scheduling/Appointment Status Token',
  component: AppointmentStatusToken,
};

export const Confirmed = () => (
  <AppointmentStatusToken appointmentStatus={APPOINTMENT_STATUSES.CONFIRMED} />
);

export const Arrived = () => (
  <AppointmentStatusToken appointmentStatus={APPOINTMENT_STATUSES.ARRIVED} />
);

export const Assessed = () => (
  <AppointmentStatusToken appointmentStatus={APPOINTMENT_STATUSES.ASSESSED} />
);

export const Seen = () => <AppointmentStatusToken appointmentStatus={APPOINTMENT_STATUSES.SEEN} />;

export const NoShow = () => (
  <AppointmentStatusToken appointmentStatus={APPOINTMENT_STATUSES.NO_SHOW} />
);

export const Deselected = () => (
  <AppointmentStatusToken appointmentStatus={APPOINTMENT_STATUSES.CONFIRMED} inactive />
);

export const Disabled = () => (
  <AppointmentStatusToken appointmentStatus={APPOINTMENT_STATUSES.CONFIRMED} disabled />
);
