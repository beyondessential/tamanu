import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppointmentCard } from '../../components/AppointmentCard';

const meta: Meta<typeof AppointmentCard> = {
  title: 'Components/AppointmentCard',
  component: AppointmentCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    appointment: {
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
  },
};

export const WithoutClinician: Story = {
  args: {
    appointment: {
      id: 'appt-2',
      startTime: '2024-03-16T09:00:00.000Z',
      endTime: '2024-03-16T09:30:00.000Z',
      status: 'Confirmed',
      isHighPriority: false,
      clinician: undefined,
      location: {
        id: 'location-2',
        name: 'Room 101',
        locationGroup: {
          id: 'location-group-2',
          name: 'General Practice',
          facility: {
            id: 'facility-1',
            name: 'Community Health Centre',
          },
        },
      },
      locationGroup: undefined,
      appointmentType: {
        id: 'type-2',
        name: 'Initial Consultation',
        code: 'INITIAL',
        type: 'appointmentType',
      },
      bookingType: undefined,
    },
  },
};

export const WithMissingData: Story = {
  args: {
    appointment: {
      id: 'appt-3',
      startTime: '2024-03-17T11:15:00.000Z',
      endTime: undefined,
      status: 'Confirmed',
      isHighPriority: true,
      clinician: {
        id: 'clinician-2',
        displayName: undefined,
        firstName: 'John',
        lastName: 'Smith',
      },
      location: undefined,
      locationGroup: {
        id: 'location-group-3',
        name: 'Emergency',
        facility: undefined,
      },
      appointmentType: undefined,
      bookingType: {
        id: 'booking-2',
        name: 'Urgent',
        code: 'URGENT',
        type: 'bookingType',
      },
    },
  },
};

export const LocationGroupOnly: Story = {
  args: {
    appointment: {
      id: 'appt-4',
      startTime: '2024-03-18T16:45:00.000Z',
      endTime: '2024-03-18T17:15:00.000Z',
      status: 'Confirmed',
      isHighPriority: false,
      clinician: {
        id: 'clinician-3',
        displayName: 'Dr. Maria Rodriguez',
        firstName: 'Maria',
        lastName: 'Rodriguez',
      },
      location: undefined,
      locationGroup: {
        id: 'location-group-4',
        name: 'Physiotherapy',
        facility: {
          id: 'facility-2',
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
  },
};

export const EmptyData: Story = {
  args: {
    appointment: {
      id: 'appt-5',
      startTime: undefined,
      endTime: undefined,
      status: 'Confirmed',
      isHighPriority: false,
      clinician: undefined,
      location: undefined,
      locationGroup: undefined,
      appointmentType: undefined,
      bookingType: undefined,
    },
  },
};
