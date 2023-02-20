import React from 'react';
import styled from 'styled-components';
import { MockedApi } from './utils/mockedApi';
import { LabRequestNoteForm } from '../app/forms/LabRequestNoteForm';

const Container = styled.div`
  width: 600px;
  padding: 1rem;
`;

const endpoints = {
  'labRequest/:id/notes': () => {
    return {
      data: [
        { id: '1', content: 'LabRequest Cancelled. Reason: Clinical Reason.' },
        { id: '2', content: 'Patient discharged.' },
      ],
    };
  },
};

export default {
  title: 'Notes',
  component: LabRequestNoteForm,
  decorators: [
    Story => (
      <MockedApi endpoints={endpoints}>
        <Container>
          <Story />
        </Container>
      </MockedApi>
    ),
  ],
};

const Template = args => <LabRequestNoteForm {...args} />;

export const LabRequestForm = Template.bind({});
LabRequestForm.args = {
  labRequest: { id: '123', status: 'cancelled' },
};
