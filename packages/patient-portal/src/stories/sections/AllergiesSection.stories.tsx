import type { Meta, StoryObj } from '@storybook/react-vite';
import { AllergiesSection } from '../../components/sections/AllergiesSection';
import { MockedApi } from '../utils/mockedApi';

// TODO - ideally this could use fake data package
const mockData = {
  data: [
    {
      id: 'allergy-1',
      note: 'Patient experiences skin rash when exposed to penicillin',
      recordedDate: '2023-02-10T09:30:00.000Z',
      patientId: 'patient-123',
      practitionerId: 'practitioner-1',
      allergyId: 'ref-penicillin',
      reactionId: 'ref-rash',
      allergy: {
        id: 'ref-penicillin',
        name: 'Penicillin',
        code: 'PENICILLIN',
        type: 'allergy',
      },
      reaction: {
        id: 'ref-rash',
        name: 'rash',
        code: 'RASH',
        type: 'allergic-reaction',
      },
    },
    {
      id: 'allergy-2',
      note: 'Severe anaphylactic reaction to aspirin reported by patient',
      recordedDate: '2022-11-20T14:15:00.000Z',
      patientId: 'patient-123',
      practitionerId: 'practitioner-2',
      allergyId: 'ref-aspirin',
      reactionId: 'ref-anaphylaxis',
      allergy: {
        id: 'ref-aspirin',
        name: 'Aspirin',
        code: 'ASPIRIN',
        type: 'allergy',
      },
      reaction: {
        id: 'ref-anaphylaxis',
        name: 'anaphylaxis',
        code: 'ANAPHYLAXIS',
        type: 'allergic-reaction',
      },
    },
    {
      id: 'allergy-3',
      note: 'Food allergy causing digestive issues',
      recordedDate: '2023-05-08T11:45:00.000Z',
      patientId: 'patient-123',
      practitionerId: 'practitioner-1',
      allergyId: 'ref-shellfish',
      reactionId: 'ref-digestive',
      allergy: {
        id: 'ref-shellfish',
        name: 'Shellfish',
        code: 'SHELLFISH',
        type: 'allergy',
      },
      reaction: {
        id: 'ref-digestive',
        name: 'digestive issues',
        code: 'DIGESTIVE',
        type: 'allergic-reaction',
      },
    },
  ],
  count: 3,
};

const meta: Meta<typeof AllergiesSection> = {
  title: 'Components/Sections/AllergiesSection',
  component: AllergiesSection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <MockedApi endpoints={{ '/patient/me/allergies': () => mockData }}>
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
          '/patient/me/allergies': () => ({
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
          '/patient/me/allergies': () => new Promise(() => {}), // Never resolves to show loading state
        }}
      >
        <Story />
      </MockedApi>
    ),
  ],
};

export const SingleAllergy: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/patient/me/allergies': () => ({
            data: [
              {
                id: 'allergy-single',
                note: 'Mild skin irritation from latex exposure',
                recordedDate: '2023-01-15T10:00:00.000Z',
                patientId: 'patient-123',
                practitionerId: 'practitioner-1',
                allergyId: 'ref-latex',
                reactionId: 'ref-skin-irritation',
                allergy: {
                  id: 'ref-latex',
                  name: 'Latex',
                  code: 'LATEX',
                  type: 'allergy',
                },
                reaction: {
                  id: 'ref-skin-irritation',
                  name: 'skin irritation',
                  code: 'SKIN_IRRITATION',
                  type: 'allergic-reaction',
                },
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
};

export const AllergyWithoutReaction: Story = {
  decorators: [
    Story => (
      <MockedApi
        endpoints={{
          '/patient/me/allergies': () => ({
            data: [
              {
                id: 'allergy-no-reaction',
                note: 'Allergy noted but reaction type not specified',
                recordedDate: '2023-03-20T15:30:00.000Z',
                patientId: 'patient-123',
                practitionerId: 'practitioner-1',
                allergyId: 'ref-pollen',
                reactionId: null,
                allergy: {
                  id: 'ref-pollen',
                  name: 'Pollen',
                  code: 'POLLEN',
                  type: 'allergy',
                },
                reaction: null,
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
};
