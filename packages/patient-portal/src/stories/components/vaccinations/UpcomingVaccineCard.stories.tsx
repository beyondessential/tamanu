import type { Meta, StoryObj } from '@storybook/react-vite';
import type { UpcomingVaccination } from '@tamanu/shared/schemas/patientPortal/responses/upcomingVaccination.schema';
import { UpcomingVaccineCard } from '../../../components/sections/Vaccinations/UpcomingVaccineCard';
import { generateMock } from '@anatine/zod-mock';
import { UpcomingVaccinationSchema } from '@tamanu/shared/schemas/patientPortal/responses/upcomingVaccination.schema';

const meta: Meta<typeof UpcomingVaccineCard> = {
  title: 'Components/Vaccinations/UpcomingVaccineCard',
  component: UpcomingVaccineCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    vaccine: generateMock(UpcomingVaccinationSchema as any),
  },
};

export const Overdue: Story = {
  args: {
    vaccine: generateMock(UpcomingVaccinationSchema as any, {
      stringMap: { dueDate: () => '2023-01-15' },
    }),
  },
};

export const DueSoon: Story = {
  args: {
    vaccine: generateMock(UpcomingVaccinationSchema as any, {
      stringMap: { dueDate: () => '2024-02-15' },
    }),
  },
};

export const DueLater: Story = {
  args: {
    vaccine: generateMock(UpcomingVaccinationSchema as any, {
      stringMap: { dueDate: () => '2024-06-15' },
    }),
  },
};

export const WithMissingData: Story = {
  args: {
    vaccine: generateMock(UpcomingVaccinationSchema as any),
  },
};

export const MultipleVaccines: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <UpcomingVaccineCard
        vaccine={generateMock(UpcomingVaccinationSchema as any, {
          stringMap: { dueDate: () => '2024-01-15' },
        })}
      />
      <UpcomingVaccineCard
        vaccine={generateMock(UpcomingVaccinationSchema as any, {
          stringMap: { dueDate: () => '2024-02-10' },
        })}
      />
      <UpcomingVaccineCard
        vaccine={generateMock(UpcomingVaccinationSchema as any, {
          stringMap: { dueDate: () => '2024-03-20' },
        })}
      />
    </div>
  ),
};
