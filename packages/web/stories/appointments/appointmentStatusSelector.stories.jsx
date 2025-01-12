import Chance from 'chance';
import React from 'react';

import { createDummyPatient } from '@tamanu/database/demoData';

import { fakePractitioner } from '../../.storybook/__mocks__/defaultEndpoints';
import { AppointmentStatusSelector } from '../../app/components/Appointments/AppointmentDetailPopper/AppointmentStatusSelector';

export default {
  title: 'Appointments/Appointment Status Selector',
  component: AppointmentStatusSelector,
};

const chance = new Chance();
const partialAppointment = {
  id: chance.guid(),
  startTime: '2024-09-05 13:57:00',
  endTime: '2024-09-05 14:57:00',
  patient: createDummyPatient(null, { id: chance.guid() }),
  clinician: fakePractitioner(),
  location: { name: 'Bed 1', id: 'bed1' },
  locationGroup: { name: 'Ward 1', id: 'ward1' },
  appointmentType: { name: 'Standard', id: 'standard' },
};

export const StatusSelector = () => {
  return (
    <div style={{ width: '16rem' }}>
      <AppointmentStatusSelector appointment={partialAppointment} />
    </div>
  );
};

export const Disabled = () => {
  return (
    <div style={{ width: '16rem' }}>
      <AppointmentStatusSelector appointment={partialAppointment} disabled />
    </div>
  );
};
