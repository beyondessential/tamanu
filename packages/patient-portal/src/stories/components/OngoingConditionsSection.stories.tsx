import type { Meta, StoryObj } from '@storybook/react-vite';
import { OngoingConditionsSection } from '../../components/sections/OngoingConditionsSection';
import { MockedApi } from '../utils/mockedApi';

import { generateMock } from '@anatine/zod-mock';
import { OngoingConditionSchema } from '@tamanu/shared/schemas/responses/ongoingCondition.schema';

// TODO - ideally this could use fake data package
const mockData = {
  data: [generateMock(OngoingConditionSchema as any), generateMock(OngoingConditionSchema as any)],
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
