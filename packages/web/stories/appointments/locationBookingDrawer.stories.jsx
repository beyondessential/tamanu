import React, { useState } from 'react';

import { LocationBookingDrawer } from '../../app/components/Appointments/LocationBookingForm/LocationBookingDrawer';
import { MockedApi } from '../utils/mockedApi';
import { MockSettingsProvider } from '../utils/mockSettingsProvider';
import { Button } from '@tamanu/ui-components';
import { toDateString } from '@tamanu/utils/dateTime';
import styled from 'styled-components';
import {
  mockLocationData,
  mockLocationGroupData,
  mockLocationGroupSuggesterEndpoint,
  mockLocationSuggesterEndpoint,
  mockPatientData,
  mockPatientSuggesterEndpoint,
} from '../utils/mockSuggesterData';
import Chance from 'chance';

const chance = new Chance();

const todaysDate = toDateString(new Date());

// Create some fake appointments for todays date. should be enough for testing
const generateMockLocationBooking = (startTime, endtime) => ({
  startTime: `${todaysDate} ${startTime}`,
  endTime: `${todaysDate} ${endtime}`,
  status: 'Confirmed',
  locationGroupId: chance.pickone(mockLocationGroupData).id,
  locationId: chance.pickone(mockLocationData).id,
  date: todaysDate,
  bookingType: chance.pickone(['Standard', 'Emergency', 'Specialist', 'Other']),
  patientId: chance.pickone(mockPatientData).id,
});

const mockAppointments = [
  generateMockLocationBooking('9:00:00', '9:30:00'),
  generateMockLocationBooking('11:30:00', '12:00:00'),
  generateMockLocationBooking('15:00:00', '16:30:00'),
];

const mockSettings = {
  appointments: {
    bookingSlots: {
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: '30min',
    },
  },
};

const endpoints = {
  appointments: () => {
    return {
      data: mockAppointments,
    };
  },
  ...mockLocationGroupSuggesterEndpoint,
  ...mockLocationSuggesterEndpoint,
  ...mockPatientSuggesterEndpoint,
};

export default {
  title: 'Appointments/Book location drawer',
  component: LocationBookingDrawer,
  decorators: [
    Story => (
      <MockedApi endpoints={endpoints}>
        <MockSettingsProvider mockSettings={mockSettings}>
          <Story />
        </MockSettingsProvider>
      </MockedApi>
    ),
  ],
};

const MockCalendar = styled.div`
  width: 100%;
  height: 96vh;
  background-color: white;
  border: 1px black solid;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 3px;
  position: relative;
  flex-direction: column;
  overflow: hidden;
`;

export const NewBooking = () => {
  const [open, setOpen] = useState(false);
  const openDrawer = () => setOpen(true);
  const closeDrawer = () => setOpen(false);

  return (
    <MockCalendar>
      CALENDAR GOES HERE <Button onClick={openDrawer}>+ Book location</Button>
      <LocationBookingDrawer closeDrawer={closeDrawer} open={open} />
    </MockCalendar>
  );
};

export const ModifyBooking = () => {
  const [open, setOpen] = useState(false);
  const openDrawer = () => setOpen(true);
  const closeDrawer = () => setOpen(false);

  return (
    <MockCalendar>
      CALENDAR GOES HERE <Button onClick={openDrawer}>+ Book location</Button>
      <LocationBookingDrawer
        editMode
        closeDrawer={closeDrawer}
        open={open}
        existingBooking={generateMockLocationBooking('10:00:00', '10:30:00')}
      />
    </MockCalendar>
  );
};
