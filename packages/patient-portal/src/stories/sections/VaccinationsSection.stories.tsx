import type { Meta, StoryObj } from '@storybook/react-vite';
import { VaccinationsSection } from '../../components/sections/VaccinationsSection';
import { MockedApi } from '../utils/mockedApi';

import { generateMock } from '@anatine/zod-mock';
import { AdministeredVaccineSchema } from '@tamanu/shared/schemas/patientPortal/responses/administeredVaccine.schema';
import { UpcomingVaccinationSchema } from '@tamanu/shared/schemas/patientPortal/responses/upcomingVaccination.schema';

// TODO - ideally this could use fake data package
const mockAdministeredVaccines = {
  data: [
    generateMock(AdministeredVaccineSchema as any),
    generateMock(AdministeredVaccineSchema as any),
  ],
  count: 2,
};

const mockUpcomingVaccines = {
  data: [
    generateMock(UpcomingVaccinationSchema as any, { stringMap: { dueDate: () => '2024-01-15' } }),
    generateMock(UpcomingVaccinationSchema as any, { stringMap: { dueDate: () => '2024-02-10' } }),
  ],
  count: 2,
};

const meta: Meta<typeof VaccinationsSection> = {
  title: 'Components/Sections/VaccinationsSection',
  component: VaccinationsSection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/me/vaccinations/administered': () => mockAdministeredVaccines,
          '/me/vaccinations/upcoming': () => mockUpcomingVaccines,
        }}
      >
        <Story />
      </MockedApi>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyState: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/me/vaccinations/administered': () => ({
            data: [],
            count: 0,
          }),
          '/me/vaccinations/upcoming': () => ({
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
          '/me/vaccinations/administered': () => new Promise(() => {}), // Never resolves to show loading state
          '/me/vaccinations/upcoming': () => new Promise(() => {}), // Never resolves to show loading state
        }}
      >
        <Story />
      </MockedApi>
    ),
  ],
};

export const OnlyAdministeredVaccines: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/me/vaccinations/administered': () => mockAdministeredVaccines,
          '/me/vaccinations/upcoming': () => ({
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

export const OnlyUpcomingVaccines: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/me/vaccinations/administered': () => ({
            data: [],
            count: 0,
          }),
          '/me/vaccinations/upcoming': () => mockUpcomingVaccines,
        }}
      >
        <Story />
      </MockedApi>
    ),
  ],
};
