import type { Meta, StoryObj } from '@storybook/react-vite';
import { MedicationsSection } from '../../components/sections/MedicationsSection';
import { MockedApi } from '../utils/mockedApi';

import { generateMock } from '@anatine/zod-mock';
import { MedicationSchema } from '@tamanu/shared/dtos/responses/MedicationSchema';

// TODO - ideally this could use fake data package
const mockMedicationsData = {
  data: [
    generateMock(MedicationSchema as any),
    generateMock(MedicationSchema as any),
    generateMock(MedicationSchema as any),
  ],
};

const mockSingleMedicationData = {
  data: [generateMock(MedicationSchema as any)],
};

const meta: Meta<typeof MedicationsSection> = {
  title: 'Components/Sections/MedicationsSection',
  component: MedicationsSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A section component for displaying patient medications using individual Card components with LabelValueList for structured information display.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <MockedApi endpoints={{ '/patient/me/medications': () => mockMedicationsData }}>
        <Story />
      </MockedApi>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleMedication: Story = {
  decorators: [
    Story => (
      <MockedApi endpoints={{ '/patient/me/medications': () => mockSingleMedicationData }}>
        <Story />
      </MockedApi>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Example showing a single medication with PRN (as needed) frequency.',
      },
    },
  },
};

export const EmptyState: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/patient/me/medications': () => ({
            data: [],
          }),
        }}
      >
        <Story />
      </MockedApi>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows the empty state when no medications are recorded.',
      },
    },
  },
};

export const LoadingState: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/patient/me/medications': () => new Promise(() => {}), // Never resolves to show loading state
        }}
      >
        <Story />
      </MockedApi>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows the loading state with a circular progress indicator.',
      },
    },
  },
};
