import Chance from 'chance';
import React from 'react';

import { APPOINTMENT_STATUSES } from '@tamanu/constants';

import { AppointmentTile } from '../../app/components/Appointments/AppointmentTile';
import { fakePractitioner } from '../../.storybook/__mocks__/defaultEndpoints';
import { createDummyPatient } from '@tamanu/shared/demoData/patients';

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
  patient: createDummyPatient(patientId),
  clinician: fakePractitioner(),
  location: { name: 'Bed 1' },
  LocationGroup: { name: 'Ward 1' },
};

const partialConfirmedAppt = { ...partialAppointment, status: APPOINTMENT_STATUSES.CONFIRMED };
const partialArrivedAppt = { ...partialAppointment, status: APPOINTMENT_STATUSES.ARRIVED };
const partialAssessedAppt = { ...partialAppointment, status: APPOINTMENT_STATUSES.ASSESSED };
const partialSeenAppt = { ...partialAppointment, status: APPOINTMENT_STATUSES.SEEN };
const partialNoShowAppt = { ...partialAppointment, status: APPOINTMENT_STATUSES.NO_SHOW };

export const Confirmed = () => <AppointmentTile appointment={partialConfirmedAppt} />;
export const Arrived = () => <AppointmentTile appointment={partialArrivedAppt} />;
export const Assessed = () => <AppointmentTile appointment={partialAssessedAppt} />;
export const Seen = () => <AppointmentTile appointment={partialSeenAppt} />;
export const NoShow = () => <AppointmentTile appointment={partialNoShowAppt} />;

export const SelectedConfirmed = () => (
  <AppointmentTile appointment={partialAppointment} selected />
);
export const SelectedArrived = () => <AppointmentTile appointment={partialArrivedAppt} selected />;
export const SelectedAssessed = () => (
  <AppointmentTile appointment={partialAssessedAppt} selected />
);
export const SelectedSeen = () => <AppointmentTile appointment={partialSeenAppt} selected />;
export const SelectedNoShow = () => <AppointmentTile appointment={partialNoShowAppt} selected />;
