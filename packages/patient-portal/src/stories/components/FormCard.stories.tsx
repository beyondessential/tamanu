import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormCard } from '../../components/sections/Forms/FormCard';

import { generateMock } from '@anatine/zod-mock';
import { PatientSurveyAssignmentSchema } from '@tamanu/shared/schemas/patientPortal/responses/patientSurveyAssignment.schema';

const meta: Meta<typeof FormCard> = {
  title: 'Components/FormCard',
  component: FormCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    form: generateMock(PatientSurveyAssignmentSchema as any),
  },
};

export const WithClick: Story = {
  args: {
    form: generateMock(PatientSurveyAssignmentSchema as any),
    onClick: () => {
      console.log('Opening form');
    },
  },
};

export const WithMissingData: Story = {
  args: {
    form: generateMock(PatientSurveyAssignmentSchema as any),
  },
};

export const LongTitle: Story = {
  args: {
    form: generateMock(PatientSurveyAssignmentSchema as any),
  },
};

export const EmptyData: Story = {
  args: {
    form: generateMock(PatientSurveyAssignmentSchema as any),
  },
};
