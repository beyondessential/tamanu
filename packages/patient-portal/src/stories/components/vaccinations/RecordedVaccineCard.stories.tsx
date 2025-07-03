import type { Meta, StoryObj } from '@storybook/react-vite';
import { RecordedVaccineCard } from '../../../components/sections/Vaccinations/RecordedVaccineCard';
import type { AdministeredVaccine } from '@tamanu/shared/dtos/responses/AdministeredVaccineSchema';

// Mock data for different vaccine scenarios
const baseMockVaccine: AdministeredVaccine = {
  id: 'administered-1',
  status: 'GIVEN',
  date: '2023-06-15T09:00:00.000Z',
  batch: 'VAC123',
  injectionSite: 'Left arm',
  vaccineName: undefined,
  vaccineBrand: undefined,
  disease: undefined,
  givenBy: undefined,
  givenElsewhere: false,
  notGivenReason: undefined,
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
};

const covidBoosterVaccine: AdministeredVaccine = {
  ...baseMockVaccine,
  id: 'administered-2',
  date: '2023-12-01T14:30:00.000Z',
  batch: 'COV789',
  scheduledVaccine: {
    id: 'scheduled-2',
    label: 'COVID-19 Moderna Bivalent',
    doseLabel: 'Booster',
    category: 'COVID',
    schedule: 'COVID-19 Booster',
  },
  recorder: {
    id: 'user-2',
    displayName: 'Dr. Michael Chen',
    firstName: 'Michael',
    lastName: 'Chen',
  },
};

const fluVaccine: AdministeredVaccine = {
  ...baseMockVaccine,
  id: 'administered-3',
  date: '2023-03-20T11:15:00.000Z',
  batch: 'FLU456',
  injectionSite: 'Right arm',
  scheduledVaccine: {
    id: 'scheduled-3',
    label: 'Influenza Vaccine',
    doseLabel: 'Annual dose',
    category: 'Routine',
    schedule: 'Annual Flu',
  },
  location: {
    id: 'location-2',
    name: 'Community Health Centre',
  },
  recorder: {
    id: 'user-3',
    displayName: 'Nurse Sarah Wilson',
    firstName: 'Sarah',
    lastName: 'Wilson',
  },
};

const overseasVaccine: AdministeredVaccine = {
  ...baseMockVaccine,
  id: 'administered-4',
  date: '2023-08-10T16:00:00.000Z',
  batch: 'YF789',
  givenBy: 'Australia',
  givenElsewhere: true,
  scheduledVaccine: {
    id: 'scheduled-4',
    label: 'Yellow Fever Vaccine',
    doseLabel: 'Single dose',
    category: 'Travel',
    schedule: 'Travel Vaccination',
  },
  location: undefined,
  recorder: {
    id: 'user-4',
    displayName: 'Dr. Emily Rodriguez',
    firstName: 'Emily',
    lastName: 'Rodriguez',
  },
};

const notGivenVaccine: AdministeredVaccine = {
  ...baseMockVaccine,
  id: 'administered-5',
  status: 'NOT_GIVEN',
  date: '2023-09-05T10:00:00.000Z',
  batch: undefined,
  notGivenReason: 'Patient declined',
  scheduledVaccine: {
    id: 'scheduled-5',
    label: 'Hepatitis B Vaccine',
    doseLabel: 'Dose 2',
    category: 'Routine',
    schedule: 'Hepatitis B Series',
  },
};

const incompleteDataVaccine: AdministeredVaccine = {
  ...baseMockVaccine,
  id: 'administered-6',
  date: '2023-05-15T13:30:00.000Z',
  batch: undefined,
  scheduledVaccine: {
    id: 'scheduled-6',
    label: 'MMR Vaccine',
    doseLabel: undefined,
    category: 'Routine',
    schedule: undefined,
  },
  recorder: undefined,
  location: undefined,
  givenBy: undefined,
};

const meta: Meta<typeof RecordedVaccineCard> = {
  title: 'Components/Vaccinations/RecordedVaccineCard',
  component: RecordedVaccineCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A card component for displaying recorded vaccine information, including vaccine name, dose, date, administrator, and location.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    vaccine: {
      description: 'The administered vaccine data to display',
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const CovidVaccine: Story = {
  args: {
    vaccine: baseMockVaccine,
  },
  parameters: {
    docs: {
      description: {
        story: 'A standard COVID-19 vaccine administered at a hospital facility.',
      },
    },
  },
};

export const CovidBooster: Story = {
  args: {
    vaccine: covidBoosterVaccine,
  },
  parameters: {
    docs: {
      description: {
        story: 'A COVID-19 booster vaccine with bivalent formulation.',
      },
    },
  },
};

export const RoutineFluVaccine: Story = {
  args: {
    vaccine: fluVaccine,
  },
  parameters: {
    docs: {
      description: {
        story: 'An annual influenza vaccine administered at a community health centre.',
      },
    },
  },
};

export const OverseasVaccination: Story = {
  args: {
    vaccine: overseasVaccine,
  },
  parameters: {
    docs: {
      description: {
        story: 'A travel vaccine administered overseas, showing "Given elsewhere" status.',
      },
    },
  },
};

export const VaccineNotGiven: Story = {
  args: {
    vaccine: notGivenVaccine,
  },
  parameters: {
    docs: {
      description: {
        story: 'A vaccine that was scheduled but not administered, showing "Not given" status.',
      },
    },
  },
};

export const IncompleteData: Story = {
  args: {
    vaccine: incompleteDataVaccine,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A vaccine record with incomplete data, demonstrating how the component handles missing information with fallback values.',
      },
    },
  },
};
