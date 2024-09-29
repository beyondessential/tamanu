import React, { useState } from 'react';

import { BookLocationDrawer } from '../../app/components/Appointments/BookLocationDrawer';
import { MockedApi } from '../utils/mockedApi';
import { MockSettingsProvider } from '../utils/mockSettingsProvider';
import { Button, Form } from '../../app/components';
import { toDateString } from '@tamanu/shared/utils/dateTime';
import styled from 'styled-components';
import {
  mockLocationGroupSuggesterEndpoint,
  mockLocationSuggesterEndpoint,
  mockPatientSuggesterEndpoint,
} from '../utils/mockSuggesterData';

const todaysDate = toDateString(new Date());

const mockAppointments = [
  {
    startTime: `${todaysDate} 09:00:00`,
    endTime: `${todaysDate} 09:30:00`,
    type: 'Standard',
    status: 'Confirmed',
    locationGroupId: 'locationGroup-a',
    locationId: 'location-a',
  },
  {
    startTime: `${todaysDate} 11:30:00`,
    endTime: `${todaysDate} 12:00:00`,
    type: 'Standard',
    status: 'Confirmed',
    locationGroupId: 'locationGroup-a',
    locationId: 'location-a',
  },
  {
    startTime: `${todaysDate} 15:00:00`,
    endTime: `${todaysDate} 16:30:00`,
    type: 'Standard',
    status: 'Confirmed',
    locationGroupId: 'locationGroup-a',
    locationId: 'location-a',
  },
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
  component: BookLocationDrawer,
  decorators: [
    Story => (
      <MockedApi endpoints={endpoints}>
        <MockSettingsProvider mockSettings={mockSettings}>
          <Form onSubmit={async () => {}} render={() => <Story />} />
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

export const Basic = () => {
  const [open, setOpen] = useState(false);
  const openDrawer = () => setOpen(true);
  const closeDrawer = () => setOpen(false);

  return (
    <MockCalendar>
      CALENDAR GOES HERE <Button onClick={openDrawer}>+ Book location</Button>
      <BookLocationDrawer onCancel={closeDrawer} open={open} />
    </MockCalendar>
  );
};
