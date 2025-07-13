import type { Meta, StoryObj } from '@storybook/react-vite';
import { AppointmentCard } from '../../components/sections/Appointments/AppointmentCard';

import { generateMock } from '@anatine/zod-mock';
import { AppointmentSchema } from '@tamanu/shared/schemas/responses/appointment.schema';

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
    appointment: generateMock(AppointmentSchema as any),
  },
};

export const WithoutClinician: Story = {
  args: {
    appointment: generateMock(AppointmentSchema as any),
  },
};

export const WithMissingData: Story = {
  args: {
    appointment: generateMock(AppointmentSchema as any),
  },
};

export const LocationGroupOnly: Story = {
  args: {
    appointment: generateMock(AppointmentSchema as any),
  },
};

export const EmptyData: Story = {
  args: {
    appointment: generateMock(AppointmentSchema as any),
  },
};
