import type { Meta, StoryObj } from '@storybook/react-vite';
import { UpcomingVaccineCard } from '../../../components/sections/Vaccinations/UpcomingVaccineCard';
import type { UpcomingVaccine } from '@tamanu/shared/schemas/responses/upcomingVaccine.schema';

import { generateMock } from '@anatine/zod-mock';
import { UpcomingVaccineSchema } from '@tamanu/shared/schemas/responses/upcomingVaccine.schema';

// Mock data for different upcoming vaccine scenarios
const baseMockUpcomingVaccine: UpcomingVaccine = generateMock(UpcomingVaccineSchema as any);

const upcomingCovidBooster: UpcomingVaccine = generateMock(UpcomingVaccineSchema as any);

const overdueMmr: UpcomingVaccine = generateMock(UpcomingVaccineSchema as any);

const scheduledHepB: UpcomingVaccine = generateMock(UpcomingVaccineSchema as any);

const missedTetanus: UpcomingVaccine = generateMock(UpcomingVaccineSchema as any);

const travelVaccine: UpcomingVaccine = generateMock(UpcomingVaccineSchema as any);

const incompleteDataVaccine: UpcomingVaccine = generateMock(UpcomingVaccineSchema as any);

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
