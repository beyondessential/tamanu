import { startOfToday } from 'date-fns';
import React from 'react';

import { toDateString } from '@tamanu/utils/dateTime';
import { Form } from '@tamanu/ui-components';

import { TimeSlotPicker } from '../../app/components/Appointments/LocationBookingForm/DateTimeRangeField/TimeSlotPicker';
import { MockSettingsProvider } from '../utils/mockSettingsProvider';
import { MockedApi } from '../utils/mockedApi';

const todaysDate = toDateString(startOfToday());

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
      endTime: '19:00',
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
  title: 'Appointments/Time slot picker',
  component: TimeSlotPicker,
  decorators: [
    Story => (
      <MockedApi endpoints={endpoints}>
        <MockSettingsProvider mockSettings={mockSettings}>
          <Form
            onSubmit={async () => {}}
            initialValues={{
              date: startOfToday(),
              locationId: 'location-a',
            }}
            render={({ values }) => {
              return (
                <>
                  <Story />
                  <h2>Debug form state</h2>
                  <p>
                    Selected time range: {values.startTime}&nbsp;&ndash {values.endTime}
                  </p>
                </>
              );
            }}
          />
        </MockSettingsProvider>
      </MockedApi>
    ),
  ],
};

export const Basic30Mins = () => <TimeSlotPicker />;

export const Disabled = () => <TimeSlotPicker disabled />;
