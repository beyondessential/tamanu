import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormCard } from '../../components/sections/Forms/FormCard';
import type { OutstandingForm } from '@tamanu/shared/dtos/responses/OutstandingFormSchema';

const mockForm: OutstandingForm = {
  id: 'form-1',
  title: 'Annual Health Assessment',
  description: 'Complete your yearly health check questionnaire',
  dueDate: '2024-02-15T00:00:00.000Z',
  priority: 'high',
  formType: 'health-assessment',
  status: 'pending',
  createdAt: '2024-01-15T08:00:00.000Z',
  updatedAt: '2024-01-15T08:00:00.000Z',
};

const mockOverdueForm: OutstandingForm = {
  id: 'form-2',
  title: 'Medication Review Form',
  description: 'Review and update your current medications',
  dueDate: '2024-01-20T00:00:00.000Z',
  priority: 'medium',
  formType: 'medication-review',
  status: 'overdue',
  createdAt: '2024-01-10T10:30:00.000Z',
  updatedAt: '2024-01-10T10:30:00.000Z',
};

const mockLongTitleForm: OutstandingForm = {
  id: 'form-3',
  title: 'Patient Registration and Emergency Contact Information Update Form for Annual Review',
  description:
    'Please update your patient registration and emergency contact details for the annual review process',
  dueDate: undefined,
  priority: 'low',
  formType: 'contact-info',
  status: 'pending',
  createdAt: '2024-01-12T14:15:00.000Z',
  updatedAt: '2024-01-12T14:15:00.000Z',
};

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
