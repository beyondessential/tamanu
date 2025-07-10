import type { Meta, StoryObj } from '@storybook/react-vite';
import { PatientDetailsSection } from '../../components/sections/PatientDetailsSection';
import { MockedApi } from '../utils/mockedApi';

import { generateMock } from '@anatine/zod-mock';
import { PatientSchema } from '@tamanu/shared/dtos/responses/PatientSchema';

// TODO - ideally this could use fake data package
const mockPatientData = generateMock(PatientSchema as any);

const mockPatientDataMale = generateMock(PatientSchema as any);

const mockPatientDataMinimal = generateMock(PatientSchema as any);

const meta: Meta<typeof PatientDetailsSection> = {
  title: 'Components/Sections/PatientDetailsSection',
  component: PatientDetailsSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays patient personal details in a grid layout using LabelValueList for perfect alignment. Shows first name, last name, date of birth, sex, village, and patient ID.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <MockedApi endpoints={{ '/patient/me': () => mockPatientData }}>
        <Story />
      </MockedApi>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MalePatient: Story = {
  decorators: [
    Story => (
      <MockedApi endpoints={{ '/patient/me': () => mockPatientDataMale }}>
        <Story />
      </MockedApi>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Example with a male patient showing different data values.',
      },
    },
  },
};

export const MinimalData: Story = {
  decorators: [
    Story => (
      <MockedApi endpoints={{ '/patient/me': () => mockPatientDataMinimal }}>
        <Story />
      </MockedApi>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story:
          'Example with minimal patient data showing how missing fields are handled with fallback values.',
      },
    },
  },
};

export const LoadingState: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/patient/me': () => new Promise(() => {}), // Never resolves to show loading state
        }}
      >
        <Story />
      </MockedApi>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Loading state with spinner while patient data is being fetched.',
      },
    },
  },
};

export const ErrorState: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/patient/me': () => {
            throw new Error('Failed to fetch patient data');
          },
        }}
      >
        <Story />
      </MockedApi>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Error state when patient data cannot be loaded.',
      },
    },
  },
};
