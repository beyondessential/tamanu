import type { Meta, StoryObj } from '@storybook/react-vite';
import { VaccinationsSection } from '../../components/sections/VaccinationsSection';
import { MockedApi } from '../utils/mockedApi';

// TODO - ideally this could use fake data package
const mockAdministeredVaccines = {
  data: [
    {
      id: 'administered-1',
      status: 'GIVEN',
      date: '2023-06-15T09:00:00.000Z',
      batch: 'VAC123',
      injectionSite: 'Left arm',
      vaccineName: null,
      vaccineBrand: null,
      disease: null,
      givenBy: null,
      givenElsewhere: false,
      notGivenReason: null,
      certifiable: true,
      createdAt: '2023-06-15T09:00:00.000Z',
      updatedAt: '2023-06-15T09:00:00.000Z',
      encounterId: 'encounter-1',
      scheduledVaccineId: 'scheduled-1',
      scheduledVaccine: {
        id: 'scheduled-1',
        label: 'COVID-19 Pfizer',
        doseLabel: 'Dose 1',
        category: 'COVID',
        schedule: 'COVID-19',
      },
      encounter: {
        id: 'encounter-1',
        patientId: 'patient-1',
      },
      recorder: {
        id: 'user-1',
        displayName: 'Dr. Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
      },
      location: {
        id: 'location-1',
        name: 'Main Hospital',
      },
      department: {
        id: 'department-1',
        name: 'Immunisation Clinic',
      },
    },
    {
      id: 'administered-2',
      status: 'GIVEN',
      date: '2023-07-15T14:30:00.000Z',
      batch: 'VAC456',
      injectionSite: 'Right arm',
      vaccineName: null,
      vaccineBrand: null,
      disease: null,
      givenBy: null,
      givenElsewhere: false,
      notGivenReason: null,
      certifiable: true,
      createdAt: '2023-07-15T14:30:00.000Z',
      updatedAt: '2023-07-15T14:30:00.000Z',
      encounterId: 'encounter-2',
      scheduledVaccineId: 'scheduled-2',
      scheduledVaccine: {
        id: 'scheduled-2',
        label: 'COVID-19 Pfizer',
        doseLabel: 'Dose 2',
        category: 'COVID',
        schedule: 'COVID-19',
      },
      encounter: {
        id: 'encounter-2',
        patientId: 'patient-1',
      },
      recorder: {
        id: 'user-2',
        displayName: 'Dr. John Doe',
        firstName: 'John',
        lastName: 'Doe',
      },
      location: {
        id: 'location-1',
        name: 'Main Hospital',
      },
      department: {
        id: 'department-1',
        name: 'Immunisation Clinic',
      },
    },
  ],
  count: 2,
};

const mockUpcomingVaccines = {
  data: [
    {
      id: 'upcoming-1',
      dueDate: '2024-01-15T00:00:00.000Z',
      status: 'DUE',
      scheduledVaccineId: 'scheduled-3',
      scheduledVaccine: {
        id: 'scheduled-3',
        label: 'Annual Flu Shot',
        doseLabel: 'Annual dose',
        category: 'Routine',
        schedule: 'Yearly',
      },
      patientId: 'patient-1',
      createdAt: '2023-12-01T00:00:00.000Z',
      updatedAt: '2023-12-01T00:00:00.000Z',
    },
    {
      id: 'upcoming-2',
      dueDate: '2024-02-10T00:00:00.000Z',
      status: 'UPCOMING',
      scheduledVaccineId: 'scheduled-4',
      scheduledVaccine: {
        id: 'scheduled-4',
        label: 'MMR Booster',
        doseLabel: 'Booster',
        category: 'Routine',
        schedule: 'Childhood',
      },
      patientId: 'patient-1',
      createdAt: '2023-12-01T00:00:00.000Z',
      updatedAt: '2023-12-01T00:00:00.000Z',
    },
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
          '/patient/me/administeredVaccines': () => mockAdministeredVaccines,
          '/patient/me/upcomingVaccinations': () => mockUpcomingVaccines,
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
          '/patient/me/administeredVaccines': () => ({
            data: [],
            count: 0,
          }),
          '/patient/me/upcomingVaccinations': () => ({
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
          '/patient/me/administeredVaccines': () => new Promise(() => {}), // Never resolves to show loading state
          '/patient/me/upcomingVaccinations': () => new Promise(() => {}), // Never resolves to show loading state
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
          '/patient/me/administeredVaccines': () => mockAdministeredVaccines,
          '/patient/me/upcomingVaccinations': () => ({
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
          '/patient/me/administeredVaccines': () => ({
            data: [],
            count: 0,
          }),
          '/patient/me/upcomingVaccinations': () => mockUpcomingVaccines,
        }}
      >
        <Story />
      </MockedApi>
    ),
  ],
};
