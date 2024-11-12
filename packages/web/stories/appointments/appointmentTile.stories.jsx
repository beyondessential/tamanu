import Chance from 'chance';
import React, { useState } from 'react';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';

import { AppointmentTile } from '../../app/components/Appointments/AppointmentTile';
import { fakePractitioner } from '../../.storybook/__mocks__/defaultEndpoints';
import { createDummyPatient } from '@tamanu/shared/demoData/patients';
import { MockedApi } from '../utils/mockedApi';

const endpoints = {
  '/patient/:id/additionalData': () => {
    return {};
  },
  'appointments/:id': () => {
    return {
      status: 200,
      data: {
        message: 'OK',
      },
    };
  },
  'public/translations': () => {
    return {};
  },
};

export default {
  title: 'Appointments/Appointment Tile',
  component: AppointmentTile,
};

const chance = new Chance();
const patientId = chance.guid();

const partialAppointment = {
  id: chance.guid(),
  startTime: '2024-09-05 13:57:00',
  endTime: '2024-09-05 14:57:00',
  patient: createDummyPatient(null, { id: patientId }),
  clinician: fakePractitioner(),
  location: { name: 'Bed 1', id: 'bed1' },
  locationGroup: { name: 'Ward 1', id: 'ward1' },
  appointmentType: { name: 'Standard', id: 'standard' },
};

const partialConfirmedAppt = {
  ...partialAppointment,
  status: APPOINTMENT_STATUSES.CONFIRMED,
};
const partialArrivedAppt = {
  ...partialAppointment,
  status: APPOINTMENT_STATUSES.ARRIVED,
};
const partialAssessedAppt = {
  ...partialAppointment,
  status: APPOINTMENT_STATUSES.ASSESSED,
};
const partialSeenAppt = {
  ...partialAppointment,
  status: APPOINTMENT_STATUSES.SEEN,
};
const partialNoShowAppt = {
  ...partialAppointment,
  status: APPOINTMENT_STATUSES.NO_SHOW,
};

const Template = args => {
  const [selected, setSelected] = useState(args.selected);
  const onClose = () => setSelected(false);
  return (
    <MockedApi endpoints={endpoints}>
      <AppointmentTile
        appointment={args.appointment}
        selected={selected}
        onClick={() => setSelected(true)}
        onClose={onClose}
        onUpdated={() => {}}
      />
    </MockedApi>
  );
};

export const Confirmed = Template.bind({});
Confirmed.args = { appointment: partialConfirmedAppt, selected: false };

export const Arrived = Template.bind({});
Arrived.args = { appointment: partialArrivedAppt, selected: false };

export const Assessed = Template.bind({});
Assessed.args = { appointment: partialAssessedAppt, selected: false };

export const Seen = Template.bind({});
Seen.args = { appointment: partialSeenAppt, selected: false };

export const NoShow = Template.bind({});
NoShow.args = { appointment: partialNoShowAppt, selected: false };

export const SelectedConfirmed = Template.bind({});
SelectedConfirmed.args = { appointment: partialConfirmedAppt, selected: true };

export const SelectedArrived = Template.bind({});
SelectedArrived.args = { appointment: partialArrivedAppt, selected: true };

export const SelectedAssessed = Template.bind({});
SelectedAssessed.args = { appointment: partialAssessedAppt, selected: true };

export const SelectedSeen = Template.bind({});
SelectedSeen.args = { appointment: partialSeenAppt, selected: true };

export const SelectedNoShow = Template.bind({});
SelectedNoShow.args = { appointment: partialNoShowAppt, selected: true };
