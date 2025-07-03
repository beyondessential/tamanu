import type { Meta, StoryObj } from '@storybook/react-vite';
import { MedicationsSection } from '../../components/sections/MedicationsSection';
import { MockedApi } from '../utils/mockedApi';

// TODO - ideally this could use fake data package
const mockMedicationsData = {
  data: [
    {
      id: 'medication-1',
      doseAmount: 10,
      units: 'mg',
      frequency: 'twice_daily',
      route: 'oral',
      date: '2024-01-15T00:00:00.000Z',
      startDate: '2024-01-15T08:00:00.000Z',
      indication: 'Hypertension',
      isPrn: false,
      discontinued: false,
      medication: {
        id: 'drug-lisinopril',
        name: 'Lisinopril',
        code: 'lisinopril',
        type: 'drug',
      },
      prescriber: {
        id: 'user-1',
        displayName: 'Dr. Sarah Wilson',
        firstName: 'Sarah',
        lastName: 'Wilson',
      },
    },
    {
      id: 'medication-2',
      doseAmount: 500,
      units: 'mg',
      frequency: 'twice_daily',
      route: 'oral',
      date: '2024-01-10T00:00:00.000Z',
      startDate: '2024-01-10T08:00:00.000Z',
      indication: 'Type 2 Diabetes',
      isPrn: false,
      discontinued: false,
      medication: {
        id: 'drug-metformin',
        name: 'Metformin',
        code: 'metformin',
        type: 'drug',
      },
      prescriber: {
        id: 'user-2',
        displayName: 'Dr. James Chen',
        firstName: 'James',
        lastName: 'Chen',
      },
    },
    {
      id: 'medication-3',
      doseAmount: 81,
      units: 'mg',
      frequency: 'once_daily',
      route: 'oral',
      date: '2024-01-05T00:00:00.000Z',
      startDate: '2024-01-05T08:00:00.000Z',
      indication: 'Cardiovascular protection',
      isPrn: false,
      discontinued: false,
      medication: {
        id: 'drug-aspirin',
        name: 'Aspirin (Low Dose)',
        code: 'aspirin-81mg',
        type: 'drug',
      },
      prescriber: {
        id: 'user-1',
        displayName: 'Dr. Sarah Wilson',
        firstName: 'Sarah',
        lastName: 'Wilson',
      },
    },
  ],
};

const mockSingleMedicationData = {
  data: [
    {
      id: 'medication-1',
      doseAmount: 400,
      units: 'mg',
      frequency: 'as_needed',
      route: 'oral',
      date: '2024-01-20T00:00:00.000Z',
      startDate: '2024-01-20T08:00:00.000Z',
      indication: 'Pain relief',
      isPrn: true,
      discontinued: false,
      medication: {
        id: 'drug-ibuprofen',
        name: 'Ibuprofen',
        code: 'ibuprofen',
        type: 'drug',
      },
      prescriber: {
        id: 'user-3',
        displayName: 'Dr. Maria Rodriguez',
        firstName: 'Maria',
        lastName: 'Rodriguez',
      },
    },
  ],
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
