import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormCard } from '../../components/sections/Forms/FormCard';
import type { OutstandingForm } from '@tamanu/shared/dtos/responses/OutstandingFormSchema';

import { generateMock } from '@anatine/zod-mock';
import { OutstandingFormSchema } from '@tamanu/shared/dtos/responses/OutstandingFormSchema';

const mockForm: OutstandingForm = generateMock(OutstandingFormSchema as any);

const mockOverdueForm: OutstandingForm = generateMock(OutstandingFormSchema as any);

const mockLongTitleForm: OutstandingForm = generateMock(OutstandingFormSchema as any);

const meta: Meta<typeof FormCard> = {
  title: 'Components/FormCard',
  component: FormCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Individual form card component that displays form information with title, status chip, and navigation arrow. Used within the OutstandingFormsSection.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    form: mockForm,
  },
};

export const OverdueForm: Story = {
  args: {
    form: mockOverdueForm,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows a form with overdue status. The card appearance remains the same regardless of status.',
      },
    },
  },
};

export const LongTitle: Story = {
  args: {
    form: mockLongTitleForm,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows how the card handles forms with very long titles and descriptions.',
      },
    },
  },
};

export const WithoutClick: Story = {
  args: {
    form: mockForm,
    onClick: undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows the card when no onClick handler is provided - the CardActionArea will be disabled.',
      },
    },
  },
};

export const WithClick: Story = {
  args: {
    form: mockForm,
    onClick: () => {
      console.log('Form clicked:', mockForm.title);
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the card with a click handler - the card will be interactive and clickable.',
      },
    },
  },
};
