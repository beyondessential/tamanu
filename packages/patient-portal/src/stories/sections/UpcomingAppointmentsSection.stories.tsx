import type { Meta, StoryObj } from '@storybook/react-vite';
import { UpcomingAppointmentsSection } from '../../components/sections/Appointments/UpcomingAppointmentsSection';
import { MockedApi } from '../utils/mockedApi';

import { generateMock } from '@anatine/zod-mock';
import { AppointmentSchema } from '@tamanu/shared/schemas/responses/appointment.schema';

// TODO - ideally this could use fake data package
const mockAppointments = {
  data: [generateMock(AppointmentSchema as any), generateMock(AppointmentSchema as any)],
  count: 2,
};

const singleAppointment = {
  data: [generateMock(AppointmentSchema as any)],
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
              generateMock(AppointmentSchema as any),
              generateMock(AppointmentSchema as any),
              generateMock(AppointmentSchema as any),
              generateMock(AppointmentSchema as any),
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
