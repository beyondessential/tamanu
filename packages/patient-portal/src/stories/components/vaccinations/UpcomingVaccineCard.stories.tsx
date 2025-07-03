import type { Meta, StoryObj } from '@storybook/react-vite';
import { UpcomingVaccineCard } from '../../../components/sections/Vaccinations/UpcomingVaccineCard';
import type { UpcomingVaccine } from '@tamanu/shared/dtos/responses/UpcomingVaccineSchema';

// Mock data for different upcoming vaccine scenarios
const baseMockUpcomingVaccine: UpcomingVaccine = {
  id: 'upcoming-1',
  dueDate: '2024-01-15T00:00:00.000Z',
  status: 'DUE',
  scheduledVaccineId: 'scheduled-1',
  scheduledVaccine: {
    id: 'scheduled-1',
    label: 'Annual Flu Shot',
    doseLabel: 'Annual dose',
    category: 'Routine',
    schedule: 'Yearly',
  },
  patientId: 'patient-1',
  createdAt: '2023-12-01T00:00:00.000Z',
  updatedAt: '2023-12-01T00:00:00.000Z',
};

const upcomingCovidBooster: UpcomingVaccine = {
  ...baseMockUpcomingVaccine,
  id: 'upcoming-2',
  dueDate: '2024-03-10T00:00:00.000Z',
  status: 'UPCOMING',
  scheduledVaccine: {
    id: 'scheduled-2',
    label: 'COVID-19 Bivalent Booster',
    doseLabel: 'Booster',
    category: 'COVID',
    schedule: 'COVID-19 Booster',
  },
};

const overdueMmr: UpcomingVaccine = {
  ...baseMockUpcomingVaccine,
  id: 'upcoming-3',
  dueDate: '2023-10-01T00:00:00.000Z',
  status: 'OVERDUE',
  scheduledVaccine: {
    id: 'scheduled-3',
    label: 'MMR Vaccine',
    doseLabel: 'Dose 2',
    category: 'Routine',
    schedule: 'Childhood Immunisation',
  },
};

const scheduledHepB: UpcomingVaccine = {
  ...baseMockUpcomingVaccine,
  id: 'upcoming-4',
  dueDate: '2024-06-20T00:00:00.000Z',
  status: 'SCHEDULED',
  scheduledVaccine: {
    id: 'scheduled-4',
    label: 'Hepatitis B Vaccine',
    doseLabel: 'Dose 3',
    category: 'Routine',
    schedule: 'Hepatitis B Series',
  },
};

const missedTetanus: UpcomingVaccine = {
  ...baseMockUpcomingVaccine,
  id: 'upcoming-5',
  dueDate: '2023-08-15T00:00:00.000Z',
  status: 'MISSED',
  scheduledVaccine: {
    id: 'scheduled-5',
    label: 'Tetanus-Diphtheria (Td)',
    doseLabel: '10-year booster',
    category: 'Routine',
    schedule: 'Adult Boosters',
  },
};

const travelVaccine: UpcomingVaccine = {
  ...baseMockUpcomingVaccine,
  id: 'upcoming-6',
  dueDate: '2024-02-28T00:00:00.000Z',
  status: 'DUE',
  scheduledVaccine: {
    id: 'scheduled-6',
    label: 'Typhoid Vaccine',
    doseLabel: 'Single dose',
    category: 'Travel',
    schedule: 'Travel Vaccination',
  },
};

const incompleteDataVaccine: UpcomingVaccine = {
  ...baseMockUpcomingVaccine,
  id: 'upcoming-7',
  dueDate: undefined,
  status: 'SCHEDULED',
  scheduledVaccine: {
    id: 'scheduled-7',
    label: 'Unknown Vaccine',
    doseLabel: undefined,
    category: undefined,
    schedule: undefined,
  },
};

const meta: Meta<typeof UpcomingVaccineCard> = {
  title: 'Components/Vaccinations/UpcomingVaccineCard',
  component: UpcomingVaccineCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A card component for displaying upcoming vaccine information, including vaccine name, dose, due date, and status with colour-coded chips.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    vaccine: {
      description: 'The upcoming vaccine data to display',
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DueVaccine: Story = {
  args: {
    vaccine: baseMockUpcomingVaccine,
  },
  parameters: {
    docs: {
      description: {
        story: 'An annual flu shot that is currently due for administration.',
      },
    },
  },
};

export const UpcomingBooster: Story = {
  args: {
    vaccine: upcomingCovidBooster,
  },
  parameters: {
    docs: {
      description: {
        story: 'A COVID-19 booster that is upcoming but not yet due.',
      },
    },
  },
};

export const OverdueVaccine: Story = {
  args: {
    vaccine: overdueMmr,
  },
  parameters: {
    docs: {
      description: {
        story: 'An MMR vaccine that is overdue and needs immediate attention.',
      },
    },
  },
};

export const ScheduledVaccine: Story = {
  args: {
    vaccine: scheduledHepB,
  },
  parameters: {
    docs: {
      description: {
        story: 'A hepatitis B vaccine that is scheduled for the future.',
      },
    },
  },
};

export const MissedVaccine: Story = {
  args: {
    vaccine: missedTetanus,
  },
  parameters: {
    docs: {
      description: {
        story: 'A tetanus booster that was missed and may need rescheduling.',
      },
    },
  },
};

export const TravelVaccination: Story = {
  args: {
    vaccine: travelVaccine,
  },
  parameters: {
    docs: {
      description: {
        story: 'A travel-specific vaccine (typhoid) that is due for travel preparation.',
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
          'A vaccine with incomplete data, demonstrating how the component handles missing information with fallback values.',
      },
    },
  },
};
