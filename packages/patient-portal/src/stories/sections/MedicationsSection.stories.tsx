import type { Meta, StoryObj } from '@storybook/react-vite';
import { MedicationsSection } from '../../components/sections/MedicationsSection';
import { MockedApi } from '../utils/mockedApi';

import { generateMock } from '@anatine/zod-mock';
import { OngoingPrescriptionSchema } from '@tamanu/shared/schemas/patientPortal/responses/ongoingPrescription.schema';

// TODO - ideally this could use fake data package
const mockMedicationsData = {
  data: [
    generateMock(OngoingPrescriptionSchema as any),
    generateMock(OngoingPrescriptionSchema as any),
    generateMock(OngoingPrescriptionSchema as any),
  ],
};

const mockSingleMedicationData = {
  data: [generateMock(OngoingPrescriptionSchema as any)],
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
      <MockedApi endpoints={{ '/me/ongoing-prescriptions': () => mockMedicationsData }}>
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
      <MockedApi endpoints={{ '/me/ongoing-prescriptions': () => mockSingleMedicationData }}>
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
          '/me/ongoing-prescriptions': () => ({
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
          '/me/ongoing-prescriptions': () => new Promise(() => {}), // Never resolves to show loading state
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
