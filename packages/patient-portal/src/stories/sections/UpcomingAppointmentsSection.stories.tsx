import type { Meta, StoryObj } from '@storybook/react-vite';
import { UpcomingAppointmentsSection } from '../../components/sections/UpcomingAppointmentsSection';
import { MockedApi } from '../utils/mockedApi';

// TODO - ideally this could use fake data package
const mockAppointments = {
  data: [
    {
      id: 'appt-1',
      startTime: '2024-03-15T14:30:00.000Z',
      endTime: '2024-03-15T15:00:00.000Z',
      status: 'Confirmed',
      isHighPriority: false,
      clinician: {
        id: 'clinician-1',
        displayName: 'Dr. Sarah Wilson',
        firstName: 'Sarah',
        lastName: 'Wilson',
      },
      location: {
        id: 'location-1',
        name: 'Room 205',
        locationGroup: {
          id: 'location-group-1',
          name: 'Cardiology',
          facility: {
            id: 'facility-1',
            name: 'General Hospital',
          },
        },
      },
      locationGroup: {
        id: 'location-group-1',
        name: 'Cardiology',
        facility: {
          id: 'facility-1',
          name: 'General Hospital',
        },
      },
      appointmentType: {
        id: 'type-1',
        name: 'Follow-up Consultation',
        code: 'FOLLOWUP',
        type: 'appointmentType',
      },
      bookingType: {
        id: 'booking-1',
        name: 'Standard',
        code: 'STANDARD',
        type: 'bookingType',
      },
    },
    {
      id: 'appt-2',
      startTime: '2024-03-20T09:00:00.000Z',
      endTime: '2024-03-20T09:30:00.000Z',
      status: 'Confirmed',
      isHighPriority: false,
      clinician: {
        id: 'clinician-2',
        displayName: 'Dr. John Smith',
        firstName: 'John',
        lastName: 'Smith',
      },
      location: {
        id: 'location-2',
        name: 'Room 101',
        locationGroup: {
          id: 'location-group-2',
          name: 'General Practice',
          facility: {
            id: 'facility-2',
            name: 'Community Health Centre',
          },
        },
      },
      locationGroup: {
        id: 'location-group-2',
        name: 'General Practice',
        facility: {
          id: 'facility-2',
          name: 'Community Health Centre',
        },
      },
      appointmentType: {
        id: 'type-2',
        name: 'Annual Check-up',
        code: 'ANNUAL',
        type: 'appointmentType',
      },
      bookingType: {
        id: 'booking-2',
        name: 'Standard',
        code: 'STANDARD',
        type: 'bookingType',
      },
    },
  ],
  count: 2,
};

const singleAppointment = {
  data: [mockAppointments.data[0]],
  count: 1,
};

const meta: Meta<typeof UpcomingAppointmentsSection> = {
  title: 'Components/Sections/UpcomingAppointmentsSection',
  component: UpcomingAppointmentsSection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <MockedApi endpoints={{ '/patient/me/appointments': () => mockAppointments }}>
        <Story />
      </MockedApi>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleAppointment: Story = {
  decorators: [
    Story => (
      <MockedApi endpoints={{ '/patient/me/appointments': () => singleAppointment }}>
        <Story />
      </MockedApi>
    ),
  ],
};

export const EmptyState: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/patient/me/appointments': () => ({
            data: [],
            count: 0,
          }),
        }}
      >
        <Story />
      </MockedApi>
    ),
  ],
};

export const LoadingState: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/patient/me/appointments': () => new Promise(() => {}), // Never resolves to show loading state
        }}
      >
        <Story />
      </MockedApi>
    ),
  ],
};

export const ManyAppointments: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/patient/me/appointments': () => ({
            data: [
              ...mockAppointments.data,
              {
                id: 'appt-3',
                startTime: '2024-03-25T11:15:00.000Z',
                endTime: '2024-03-25T12:00:00.000Z',
                status: 'Confirmed',
                isHighPriority: true,
                clinician: {
                  id: 'clinician-3',
                  displayName: 'Dr. Maria Rodriguez',
                  firstName: 'Maria',
                  lastName: 'Rodriguez',
                },
                location: undefined,
                locationGroup: {
                  id: 'location-group-3',
                  name: 'Physiotherapy',
                  facility: {
                    id: 'facility-3',
                    name: 'Rehabilitation Centre',
                  },
                },
                appointmentType: {
                  id: 'type-3',
                  name: 'Physiotherapy Session',
                  code: 'PHYSIO',
                  type: 'appointmentType',
                },
                bookingType: {
                  id: 'booking-3',
                  name: 'Recurring',
                  code: 'RECURRING',
                  type: 'bookingType',
                },
              },
              {
                id: 'appt-4',
                startTime: '2024-03-28T16:30:00.000Z',
                endTime: undefined,
                status: 'Confirmed',
                isHighPriority: false,
                clinician: undefined,
                location: {
                  id: 'location-4',
                  name: 'Emergency Room',
                  locationGroup: {
                    id: 'location-group-4',
                    name: 'Emergency',
                    facility: {
                      id: 'facility-4',
                      name: 'Main Hospital',
                    },
                  },
                },
                locationGroup: undefined,
                appointmentType: {
                  id: 'type-4',
                  name: 'Emergency Consultation',
                  code: 'EMERGENCY',
                  type: 'appointmentType',
                },
                bookingType: undefined,
              },
            ],
            count: 4,
          }),
        }}
      >
        <Story />
      </MockedApi>
    ),
  ],
};
