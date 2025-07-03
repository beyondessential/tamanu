import type { Meta, StoryObj } from '@storybook/react-vite';
import { OngoingConditionsSection } from '../../components/sections/OngoingConditionsSection';
import { MockedApi } from '../utils/mockedApi';

// TODO - ideally this could use fake data package
const mockData = {
  data: [
    {
      id: 'condition-1',
      note: 'Essential hypertension, well controlled with medication',
      recordedDate: '2023-01-15T10:00:00.000Z',
      resolved: false,
      resolutionDate: null,
      resolutionNote: null,
      patientId: 'patient-123',
      conditionId: 'ref-hypertension',
      examinerId: 'examiner-1',
      resolutionPractitionerId: null,
      condition: {
        id: 'ref-hypertension',
        name: 'Essential Hypertension',
        code: 'I10',
        type: 'diagnosis',
      },
    },
    {
      id: 'condition-2',
      note: 'Type 2 diabetes mellitus, managed with diet and medication',
      recordedDate: '2022-08-20T14:30:00.000Z',
      resolved: false,
      resolutionDate: null,
      resolutionNote: null,
      patientId: 'patient-123',
      conditionId: 'ref-diabetes-t2',
      examinerId: 'examiner-2',
      resolutionPractitionerId: null,
      condition: {
        id: 'ref-diabetes-t2',
        name: 'Type 2 Diabetes Mellitus',
        code: 'E11',
        type: 'diagnosis',
      },
    },
  ],
  count: 2,
};

const meta: Meta<typeof OngoingConditionsSection> = {
  title: 'Components/Sections/OngoingConditionsSection',
  component: OngoingConditionsSection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <MockedApi endpoints={{ '/patient/me/ongoing-conditions': () => mockData }}>
        <Story />
      </MockedApi>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EmptyState: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/patient/me/ongoing-conditions': () => ({
            data: [],
            count: 0,
          }),
        }}
      >
        <Story />
      </MockedApi>
    ),
  ],
};

export const LoadingState: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/patient/me/ongoing-conditions': () => new Promise(() => {}), // Never resolves to show loading state
        }}
      >
        <Story />
      </MockedApi>
    ),
  ],
};
