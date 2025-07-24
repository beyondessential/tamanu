import type { Meta, StoryObj } from '@storybook/react-vite';
import { OutstandingFormsSection } from '../../components/sections/Forms/OutstandingFormsSection';
import { MockedApi } from '../utils/mockedApi';

import { generateMock } from '@anatine/zod-mock';
import { PatientSurveyAssignmentSchema } from '@tamanu/shared/schemas/patientPortal/responses/patientSurveyAssignment.schema';

// TODO - ideally this could use fake data package
const mockFormsData = {
  data: [
    generateMock(PatientSurveyAssignmentSchema as any),
    generateMock(PatientSurveyAssignmentSchema as any),
    generateMock(PatientSurveyAssignmentSchema as any),
  ],
  count: 3,
};

const meta: Meta<typeof OutstandingFormsSection> = {
  title: 'Components/Sections/OutstandingFormsSection',
  component: OutstandingFormsSection,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays outstanding forms for patients with a card container layout. Shows dynamic header based on form count and conditional icons.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <MockedApi endpoints={{ '/me/forms/outstanding': () => mockFormsData }}>
        <Story />
      </MockedApi>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Shows the default state with multiple outstanding forms - displays red clock icon and form count.',
      },
    },
  },
};

export const EmptyState: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/me/forms/outstanding': () => ({
            data: [],
            count: 0,
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
        story:
          'Shows the state when there are no outstanding forms - displays green check icon and appropriate message.',
      },
    },
  },
};

export const LoadingState: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/me/forms/outstanding': () => new Promise(() => {}), // Never resolves to show loading state
        }}
      >
        <Story />
      </MockedApi>
    ),
  ],
  parameters: {
    docs: {
      description: {
        story: 'Shows the loading state with StyledCircularProgress while forms are being fetched.',
      },
    },
  },
};

export const SingleForm: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/me/forms/outstanding': () => ({
            data: [generateMock(PatientSurveyAssignmentSchema as any)],
            count: 1,
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
        story: 'Shows the state with a single outstanding form - tests singular form text.',
      },
    },
  },
};
