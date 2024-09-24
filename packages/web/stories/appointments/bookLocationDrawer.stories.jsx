import React from 'react';

import { BookLocationDrawer } from '../../app/components/Appointments/BookLocationDrawer'
import { MockedApi } from '../utils/mockedApi';
import { MockSettingsProvider } from '../utils/mockSettingsProvider';
import { Form } from '../../app/components';
import { toDateString } from '@tamanu/shared/utils/dateTime';

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
};

export default {
  title: 'Appointments/Book location drawer',
  component: BookLocationDrawer,
  decorators: [
    Story => (
      <MockedApi endpoints={endpoints}>
        <MockSettingsProvider mockSettings={mockSettings}>
          <Form
            onSubmit={async () => {}}
            initialValues={{
              date: new Date(),
              locationId: 'location-a',
            }}
            render={() => <Story />}
          />
        </MockSettingsProvider>
      </MockedApi>
    ),
  ],
};

export const Basic = () => <BookLocationDrawer />;
