import type { Meta, StoryObj } from '@storybook/react-vite';
import { RecordedVaccineCard } from '../../../components/sections/Vaccinations/RecordedVaccineCard';
import type { AdministeredVaccine } from '@tamanu/shared/dtos/responses/AdministeredVaccineSchema';

import { generateMock } from '@anatine/zod-mock';
import { AdministeredVaccineSchema } from '@tamanu/shared/dtos/responses/AdministeredVaccineSchema';

// Mock data for different administered vaccine scenarios
const baseMockAdministeredVaccine: AdministeredVaccine = generateMock(
  AdministeredVaccineSchema as any,
);

const meta: Meta<typeof RecordedVaccineCard> = {
  title: 'Components/Vaccinations/RecordedVaccineCard',
  component: RecordedVaccineCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    vaccine: {
      description: 'The administered vaccine data to display',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    vaccine: baseMockAdministeredVaccine,
  },
};

export const CovidVaccine: Story = {
  args: {
    vaccine: generateMock(AdministeredVaccineSchema as any),
  },
};

export const FluVaccine: Story = {
  args: {
    vaccine: generateMock(AdministeredVaccineSchema as any),
  },
};

export const TravelVaccine: Story = {
  args: {
    vaccine: generateMock(AdministeredVaccineSchema as any),
  },
};

export const VaccineNotGiven: Story = {
  args: {
    vaccine: generateMock(AdministeredVaccineSchema as any),
  },
};

export const IncompleteData: Story = {
  args: {
    vaccine: generateMock(AdministeredVaccineSchema as any),
  },
};
