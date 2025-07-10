import type { Meta, StoryObj } from '@storybook/react-vite';
import { AllergiesSection } from '../../components/sections/AllergiesSection';
import { MockedApi } from '../utils/mockedApi';

import { generateMock } from '@anatine/zod-mock';
import { AllergySchema } from '@tamanu/shared/dtos/responses/AllergySchema';

// TODO - ideally this could use fake data package
const mockData = {
  data: [
    generateMock(AllergySchema as any),
    generateMock(AllergySchema as any),
    generateMock(AllergySchema as any),
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
            data: [generateMock(AllergySchema as any)],
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
            data: [generateMock(AllergySchema as any)],
            count: 1,
          }),
        }}
      >
        <Story />
      </MockedApi>
    ),
  ],
};
