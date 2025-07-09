import type { Meta, StoryObj } from '@storybook/react-vite';
import { OutstandingFormsSection } from '../../components/sections/Forms/OutstandingFormsSection';
import { MockedApi } from '../utils/mockedApi';

// TODO - ideally this could use fake data package
const mockFormsData = {
  data: [
    {
      id: 'form-1',
      title: 'Annual Health Assessment',
      description: 'Complete your yearly health check questionnaire',
      dueDate: '2024-02-15T00:00:00.000Z',
      priority: 'high',
      formType: 'health-assessment',
      status: 'pending',
      createdAt: '2024-01-15T08:00:00.000Z',
      updatedAt: '2024-01-15T08:00:00.000Z',
    },
    {
      id: 'form-2',
      title: 'Medication Review Form',
      description: 'Review and update your current medications',
      dueDate: '2024-01-20T00:00:00.000Z',
      priority: 'medium',
      formType: 'medication-review',
      status: 'overdue',
      createdAt: '2024-01-10T10:30:00.000Z',
      updatedAt: '2024-01-10T10:30:00.000Z',
    },
    {
      id: 'form-3',
      title: 'Emergency Contact Information',
      description: 'Update your emergency contact details',
      dueDate: undefined,
      priority: 'low',
      formType: 'contact-info',
      status: 'pending',
      createdAt: '2024-01-12T14:15:00.000Z',
      updatedAt: '2024-01-12T14:15:00.000Z',
    },
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
      <MockedApi endpoints={{ '/patient/me/outstanding-forms': () => mockFormsData }}>
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
          '/patient/me/outstanding-forms': () => ({
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
          '/patient/me/outstanding-forms': () => new Promise(() => {}), // Never resolves to show loading state
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
          '/patient/me/outstanding-forms': () => ({
            data: [
              {
                id: 'form-single',
                title: 'Patient Registration Update',
                description: 'Please update your patient registration information',
                dueDate: '2024-03-01T00:00:00.000Z',
                priority: 'high',
                formType: 'registration-update',
                status: 'pending',
                createdAt: '2024-02-01T10:00:00.000Z',
                updatedAt: '2024-02-01T10:00:00.000Z',
              },
            ],
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
