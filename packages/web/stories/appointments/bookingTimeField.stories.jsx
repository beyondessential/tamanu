import React from 'react';

import { BookingTimeField } from '../../app/components/Appointments/BookingTimeField';
import { MockedApi } from '../utils/mockedApi';
import { MockSettingsProvider } from '../utils/mockSettingsProvider';

const endpoints = {
  appointments: () => {
    return {
      count: 2,
      // Not all data just the stuff i think ill need
      data: [
        {
          id: '1c47b441-7485-4dca-93c6-fef78747afd4',
          startTime: '2024-09-23 09:00:00',
          endTime: '2024-09-23 09:30:00',
          type: 'Standard',
          status: 'Confirmed',
          deletedAt: null,
          clinicianId: 'bb6512d9-4f94-47ef-8e1b-954bcb820fa7',
          locationGroupId: 'locationgroup-EDBed-tamanu',
          locationId: null,
        },
        {
          id: '1c47b441-7485-4dca-93c6-fef7874dafd4',
          startTime: '2024-09-23 11:30:00',
          endTime: '2024-09-23 12:00:00',
          type: 'Standard',
          status: 'Confirmed',
          deletedAt: null,
          clinicianId: 'bb6512d9-4f94-47ef-8e1b-954bcb820fa7',
          locationGroupId: 'locationgroup-EDBed-tamanu',
          locationId: null,
        },
        {
          id: '1c47b441-7485-4dca-93c6-gef7874dafd4',
          startTime: '2024-09-23 15:00:00',
          endTime: '2024-09-23 16:30:00',
          type: 'Standard',
          status: 'Confirmed',
          deletedAt: null,
          clinicianId: 'bb6512d9-4f94-47ef-8e1b-954bcb820fa7',
          locationGroupId: 'locationgroup-EDBed-tamanu',
          locationId: null,
        },
      ],
    };
  },
};

export default {
  title: 'Appointments/Booking time field',
  component: BookingTimeField,
  decorators: [
    Story => (
      <MockedApi endpoints={endpoints}>
        <MockSettingsProvider
          mockSettings={{
            appointments: {
              bookingSlots: {
                startTime: '09:00',
                endTime: '17:00',
                slotDuration: '30min',
              },
            },
          }}
        >
          <Story />
        </MockSettingsProvider>
      </MockedApi>
    ),
  ],
};

// TODO: args?
export const Disabled = () => <BookingTimeField disabled />;
export const RandomAvailability30Mins = () => <BookingTimeField />;
