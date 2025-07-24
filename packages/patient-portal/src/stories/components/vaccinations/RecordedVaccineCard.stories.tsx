import type { Meta, StoryObj } from '@storybook/react-vite';
import type { AdministeredVaccine } from '@tamanu/shared/schemas/patientPortal/responses/administeredVaccine.schema';
import { RecordedVaccineCard } from '../../../components/sections/Vaccinations/RecordedVaccineCard';
import { generateMock } from '@anatine/zod-mock';
import { AdministeredVaccineSchema } from '@tamanu/shared/schemas/patientPortal/responses/administeredVaccine.schema';

const meta: Meta<typeof RecordedVaccineCard> = {
  title: 'Components/Vaccinations/RecordedVaccineCard',
  component: RecordedVaccineCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    vaccine: generateMock(AdministeredVaccineSchema as any),
  },
};

export const WithMissingData: Story = {
  args: {
    vaccine: generateMock(AdministeredVaccineSchema as any),
  },
};

export const GivenElsewhere: Story = {
  args: {
    vaccine: generateMock(AdministeredVaccineSchema as any),
  },
};

export const NotGiven: Story = {
  args: {
    vaccine: generateMock(AdministeredVaccineSchema as any),
  },
};
